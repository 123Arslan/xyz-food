from rest_framework import serializers
from django.contrib.auth.models import User
from django.db import transaction
from .models import Profile

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['full_name', 'account_type', 'created_at']

class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'profile']

class SignupSerializer(serializers.Serializer):
    fullName = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    accountType = serializers.ChoiceField(choices=Profile.ACCOUNT_TYPE_CHOICES, default='Donor')

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        email = validated_data['email']
        password = validated_data['password']
        full_name = validated_data['fullName']
        account_type = validated_data['accountType']

        with transaction.atomic():
            # Create user. Set username to email since username is required and must be unique.
            user = User.objects.create_user(
                username=email,
                email=email,
                password=password
            )
            # Create profile
            Profile.objects.create(
                user=user,
                full_name=full_name,
                account_type=account_type
            )
        return user
