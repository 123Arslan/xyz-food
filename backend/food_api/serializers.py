from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.db import transaction
from .models import Profile, FoodListing

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['full_name', 'account_type', 'created_at']

class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'profile']

class FoodListingSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    pickup_time = serializers.DateTimeField(
        format='iso-8601',
        input_formats=['iso-8601', '%Y-%m-%dT%H:%M:%SZ', '%Y-%m-%dT%H:%M:%S.%fZ', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%d %H:%M:%S']
    )
    expiry_time = serializers.DateTimeField(
        format='iso-8601',
        input_formats=['iso-8601', '%Y-%m-%dT%H:%M:%SZ', '%Y-%m-%dT%H:%M:%S.%fZ', '%Y-%m-%dT%H:%M:%S', '%Y-%m-%d %H:%M:%S'],
        required=False,
        allow_null=True
    )

    class Meta:
        model = FoodListing
        fields = [
            'id',
            'user',
            'user_id',
            'food_title',
            'food_type',
            'quantity',
            'description',
            'pickup_time',
            'expiry_time',
            'pickup_location',
            'contact_phone',
            'food_image_url',
            'status',
            'created_at',
            'latitude',
            'longitude',
        ]
        read_only_fields = ['id', 'user', 'user_id', 'status', 'created_at']

class SignupSerializer(serializers.Serializer):
    fullName = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    accountType = serializers.ChoiceField(choices=Profile.ACCOUNT_TYPE_CHOICES, default='Donor')

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    def create(self, validated_data):
        email = validated_data['email']
        password = validated_data['password']
        full_name = validated_data['fullName']
        account_type = validated_data['accountType']

        with transaction.atomic():
            user = User.objects.create_user(
                username=email,
                email=email,
                password=password
            )
            Profile.objects.create(
                user=user,
                full_name=full_name,
                account_type=account_type
            )
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            raise serializers.ValidationError("Must include both 'email' and 'password'.")

        try:
            user_obj = User.objects.get(email=email)
            username = user_obj.username
        except User.DoesNotExist:
            username = email

        user = authenticate(username=username, password=password)

        if not user:
            raise serializers.ValidationError('Invalid Credentials')

        if not user.is_active:
            raise serializers.ValidationError('User account is disabled.')

        data['user'] = user
        return data
