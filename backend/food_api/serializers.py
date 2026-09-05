from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.db import transaction
from .models import Profile, FoodListing, Donation, Feedback, Message, Notification

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['full_name', 'account_type', 'account_status', 'contact_phone', 'instructions', 'reward_points', 'created_at', 'profile_pic']

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

    receiver = serializers.SerializerMethodField()
    claimed_by = UserSerializer(read_only=True)
    rider = UserSerializer(read_only=True)
    donor_name = serializers.SerializerMethodField()
    donor_phone = serializers.SerializerMethodField()
    receiver_name = serializers.SerializerMethodField()
    receiver_phone = serializers.SerializerMethodField()
    dropoff_location = serializers.SerializerMethodField()
    food_image = serializers.ImageField(required=False, allow_null=True)
    food_image_url = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    image = serializers.SerializerMethodField(read_only=True)

    def get_receiver(self, obj):
        if obj.claimed_by:
            return UserSerializer(obj.claimed_by).data
        donation = obj.donations.first()
        if donation:
            return UserSerializer(donation.receiver_id).data
        return None

    def get_donor_name(self, obj):
        try:
            return obj.user.profile.full_name or obj.user.username
        except Exception:
            return obj.user.username if obj.user else 'Donor'

    def get_donor_phone(self, obj):
        return obj.contact_phone or getattr(getattr(obj.user, 'profile', None), 'contact_phone', '')

    def get_receiver_name(self, obj):
        receiver = obj.claimed_by
        if not receiver:
            donation = obj.donations.first()
            if donation:
                receiver = donation.receiver_id
        if receiver:
            try:
                return receiver.profile.full_name or receiver.username
            except Exception:
                return receiver.username
        return 'Receiver'

    def get_receiver_phone(self, obj):
        receiver = obj.claimed_by
        if not receiver:
            donation = obj.donations.first()
            if donation:
                receiver = donation.receiver_id
        if receiver:
            try:
                return receiver.profile.contact_phone or ''
            except Exception:
                return ''
        return ''

    def get_dropoff_location(self, obj):
        receiver = obj.claimed_by
        if not receiver:
            donation = obj.donations.first()
            if donation:
                receiver = donation.receiver_id
        if receiver:
            try:
                if receiver.profile.instructions:
                    return receiver.profile.instructions
            except Exception:
                pass
        return 'Receiver Address'

    def get_image(self, obj):
        if obj.food_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.food_image.url)
            return obj.food_image.url
        return obj.food_image_url

    def to_internal_value(self, data):
        if hasattr(data, 'copy'):
            data = data.copy()
        if 'image' in data and 'food_image' not in data:
            val = data.get('image')
            if hasattr(val, 'read'):
                data['food_image'] = val
            elif isinstance(val, str) and val.strip():
                data['food_image_url'] = val
        return super().to_internal_value(data)

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
            'food_image',
            'food_image_url',
            'image',
            'status',
            'created_at',
            'latitude',
            'longitude',
            'receiver',
            'claimed_by',
            'rider',
            'donor_name',
            'donor_phone',
            'receiver_name',
            'receiver_phone',
            'dropoff_location',
        ]
        read_only_fields = ['id', 'user', 'user_id', 'status', 'created_at', 'claimed_by', 'rider']

ListingSerializer = FoodListingSerializer

class DonationSerializer(serializers.ModelSerializer):
    food_listing = FoodListingSerializer(source='food_id', read_only=True)
    donor = UserSerializer(source='donor_id', read_only=True)
    receiver = UserSerializer(source='receiver_id', read_only=True)

    class Meta:
        model = Donation
        fields = ['id', 'food_listing', 'donor', 'receiver', 'created_at']

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)
    food_listing_id = serializers.IntegerField(source='food_listing.id', read_only=True)

    class Meta:
        model = Message
        fields = [
            'id',
            'sender',
            'receiver',
            'food_listing_id',
            'message_text',
            'timestamp',
        ]
        read_only_fields = fields

class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ['id', 'rating', 'comment', 'food_id', 'created_at']

    def validate_rating(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'notification_type', 'food_listing', 'message', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at']

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
                account_type=account_type,
                account_status='Active'
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
