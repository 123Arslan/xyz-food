from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from django.db import connection
from .models import FoodListing, Message, Donation, Feedback
from .serializers import SignupSerializer, UserSerializer, LoginSerializer, FoodListingSerializer, MessageSerializer, DonationSerializer, FeedbackSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    serializer = SignupSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            "user": UserSerializer(user).data,
            "token": token.key,
            "message": "User registered successfully"
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)

        is_donor = False
        is_receiver = False
        is_admin = False
        try:
            profile = user.profile
            account_type = profile.account_type.lower()
            if account_type in ['donor', 'organization']:
                is_donor = True
            elif account_type == 'receiver':
                is_receiver = True
            elif account_type == 'admin' or user.is_staff or user.is_superuser:
                is_admin = True
        except Exception:
            if user.is_staff or user.is_superuser:
                is_admin = True

        return Response({
            "token": token.key,
            "username": user.email,
            "is_donor": is_donor,
            "is_receiver": is_receiver,
            "is_admin": is_admin
        }, status=status.HTTP_200_OK)

    errors = serializer.errors
    error_msg = "Invalid Credentials"
    status_code = status.HTTP_401_UNAUTHORIZED

    if 'email' in errors:
        error_msg = errors['email'][0]
        status_code = status.HTTP_400_BAD_REQUEST
    elif 'password' in errors:
        error_msg = errors['password'][0]
        status_code = status.HTTP_400_BAD_REQUEST
    elif 'non_field_errors' in errors:
        error_msg = errors['non_field_errors'][0]
        if "Must include" in error_msg:
            status_code = status.HTTP_400_BAD_REQUEST

    return Response({"error": error_msg}, status=status_code)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_users(request):
    users = User.objects.all()
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([AllowAny])
def test_db(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            row = cursor.fetchone()
        return Response({"status": "Database connected successfully", "result": row}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": f"Database connection failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FoodListingListCreateView(generics.ListCreateAPIView):
    serializer_class = FoodListingSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FoodListing.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class FoodListingDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FoodListingSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FoodListing.objects.filter(user=self.request.user)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_food(request):
    import math

    def haversine(lat1, lon1, lat2, lon2):
        R = 6371.0
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    queryset = FoodListing.objects.filter(status='Available')

    # Get location filter
    location = request.query_params.get('location', '')
    if not location:
        location = request.query_params.get('pickup_location', '')
    if location:
        queryset = queryset.filter(pickup_location__icontains=location)

    # Get food type filter
    food_type = request.query_params.get('food_type', '')
    if food_type and food_type.lower() != 'all':
        # Map frontend values to backend DB model choices
        normalized = food_type.lower().strip()
        if 'veg' == normalized:
            queryset = queryset.filter(food_type='Veg')
        elif 'non-veg' == normalized or 'nonveg' == normalized:
            queryset = queryset.filter(food_type='Non-Veg')
        elif 'cooked' in normalized:
            queryset = queryset.filter(food_type='Cooked')
        elif 'dry' in normalized:
            queryset = queryset.filter(food_type='Dry')
        else:
            queryset = queryset.filter(food_type__iexact=food_type)

    listings = list(queryset.order_by('-created_at'))

    # Distance calculation and sorting
    lat = request.query_params.get('lat')
    lng = request.query_params.get('lng')
    has_coords = False

    if lat and lng:
        try:
            user_lat = float(lat)
            user_lng = float(lng)
            has_coords = True
            for item in listings:
                if item.latitude is not None and item.longitude is not None:
                    item.distance = haversine(user_lat, user_lng, item.latitude, item.longitude)
                else:
                    item.distance = None
            
            listings.sort(key=lambda x: (x.distance is None, x.distance or 0))
        except ValueError:
            pass

    serializer = FoodListingSerializer(listings, many=True)
    data = serializer.data

    if has_coords:
        for i, item_data in enumerate(data):
            if hasattr(listings[i], 'distance') and listings[i].distance is not None:
                item_data['distance'] = round(listings[i].distance, 2)
            else:
                item_data['distance'] = None

    return Response(data, status=status.HTTP_200_OK)

from django.db import transaction

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def claim_food(request, food_id):
    try:
        with transaction.atomic():
            food_listing = FoodListing.objects.select_for_update().get(id=food_id, status='Available')
            donation = Donation.objects.create(
                donor_id=food_listing.user,
                receiver_id=request.user,
                food_id=food_listing
            )
            food_listing.status = 'Pending'
            food_listing.save()
            return Response({
                "message": "Food claimed successfully",
                "donation": DonationSerializer(donation).data
            }, status=status.HTTP_200_OK)
    except FoodListing.DoesNotExist:
        return Response({"error": "Food listing is not available or does not exist."}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_transaction(request, food_id):
    try:
        with transaction.atomic():
            food_listing = FoodListing.objects.select_for_update().get(id=food_id)
            if food_listing.status != 'Pending':
                return Response({"error": "Food listing is not in Pending status."}, status=status.HTTP_400_BAD_REQUEST)
            
            donation = Donation.objects.filter(food_id=food_listing).first()
            if not donation:
                return Response({"error": "No donation record found for this listing."}, status=status.HTTP_400_BAD_REQUEST)
            
            if request.user != food_listing.user and request.user != donation.receiver_id:
                return Response({"error": "You are not authorized to complete this transaction."}, status=status.HTTP_403_FORBIDDEN)
            
            food_listing.status = 'Completed'
            food_listing.save()
            return Response({
                "message": "Transaction completed successfully",
                "status": food_listing.status
            }, status=status.HTTP_200_OK)
    except FoodListing.DoesNotExist:
        return Response({"error": "Food listing not found."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_claims(request):
    donations = Donation.objects.filter(receiver_id=request.user).order_by('-created_at')
    serializer = DonationSerializer(donations, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def post_feedback(request):
    serializer = FeedbackSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

from rest_framework.permissions import BasePermission

class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_staff or request.user.is_superuser:
            return True
        try:
            return request.user.profile.account_type.lower() == 'admin'
        except Exception:
            return False

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminRole])
def admin_stats(request):
    total_users = User.objects.count()
    total_food = FoodListing.objects.filter(status='Available').count()
    total_donations = Donation.objects.count()
    
    available_count = FoodListing.objects.filter(status='Available').count()
    pending_count = FoodListing.objects.filter(status='Pending').count()
    completed_count = FoodListing.objects.filter(status='Completed').count()
    
    return Response({
        "total_users": total_users,
        "total_food": total_food,
        "total_donations": total_donations,
        "status_stats": {
            "available": available_count,
            "pending": pending_count,
            "completed": completed_count
        }
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminRole])
def admin_listings(request):
    listings = FoodListing.objects.all().order_by('-created_at')
    serializer = FoodListingSerializer(listings, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsAdminRole])
def admin_delete_listing(request, pk):
    try:
        listing = FoodListing.objects.get(pk=pk)
        listing.delete()
        return Response({"message": "Listing deleted successfully"}, status=status.HTTP_200_OK)
    except FoodListing.DoesNotExist:
        return Response({"error": "Listing not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdminRole])
def admin_users(request):
    users = User.objects.all().order_by('id')
    data = []
    for u in users:
        account_type = 'Donor'
        full_name = u.username
        try:
            profile = u.profile
            account_type = profile.account_type
            full_name = profile.full_name
        except Exception:
            if u.is_staff or u.is_superuser:
                account_type = 'Admin'
        data.append({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "full_name": full_name,
            "account_type": account_type,
            "is_active": u.is_active,
        })
    return Response(data, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminRole])
def admin_toggle_ban_user(request, user_id):
    try:
        user = User.objects.get(id=user_id)
        if user.is_superuser:
            return Response({"error": "Cannot ban superuser"}, status=status.HTTP_400_BAD_REQUEST)
        user.is_active = not user.is_active
        user.save()
        action = "suspended" if not user.is_active else "activated"
        return Response({"message": f"User {action} successfully", "is_active": user.is_active}, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)


def _get_listing_chat_participants(food_listing, user):
    """Return (donor, receiver) if user may access chat for this listing, else None."""
    if food_listing.status not in ('Pending', 'Completed'):
        return None
    donation = Donation.objects.filter(food_id=food_listing).first()
    if not donation:
        return None
    donor = donation.donor_id
    receiver = donation.receiver_id
    if user.id not in (donor.id, receiver.id):
        return None
    return donor, receiver


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request):
    receiver_id = request.data.get('receiver_id')
    food_listing_id = request.data.get('food_listing_id')
    message_text = (request.data.get('message_text') or '').strip()

    if not receiver_id or not food_listing_id:
        return Response(
            {"error": "receiver_id and food_listing_id are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not message_text:
        return Response(
            {"error": "message_text cannot be empty."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        food_listing = FoodListing.objects.get(id=food_listing_id)
    except FoodListing.DoesNotExist:
        return Response({"error": "Food listing not found."}, status=status.HTTP_404_NOT_FOUND)

    if food_listing.status != 'Pending':
        return Response(
            {"error": "Chat is only available for active (Pending) donations."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    participants = _get_listing_chat_participants(food_listing, request.user)
    if not participants:
        return Response({"error": "You are not authorized to chat on this listing."}, status=status.HTTP_403_FORBIDDEN)

    donor, receiver = participants
    try:
        receiver_user = User.objects.get(id=receiver_id)
    except User.DoesNotExist:
        return Response({"error": "Receiver not found."}, status=status.HTTP_404_NOT_FOUND)

    allowed_ids = {donor.id, receiver.id}
    if request.user.id not in allowed_ids or receiver_user.id not in allowed_ids:
        return Response({"error": "Invalid chat participants for this listing."}, status=status.HTTP_400_BAD_REQUEST)
    if request.user.id == receiver_user.id:
        return Response({"error": "Cannot send a message to yourself."}, status=status.HTTP_400_BAD_REQUEST)

    message = Message.objects.create(
        sender=request.user,
        receiver=receiver_user,
        food_listing=food_listing,
        message_text=message_text,
    )
    return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def chat_history(request, listing_id):
    try:
        food_listing = FoodListing.objects.get(id=listing_id)
    except FoodListing.DoesNotExist:
        return Response({"error": "Food listing not found."}, status=status.HTTP_404_NOT_FOUND)

    participants = _get_listing_chat_participants(food_listing, request.user)
    if not participants:
        return Response({"error": "You are not authorized to view this chat."}, status=status.HTTP_403_FORBIDDEN)

    donor, receiver = participants
    messages = Message.objects.filter(
        food_listing=food_listing,
        sender__in=[donor, receiver],
        receiver__in=[donor, receiver],
    ).select_related('sender', 'receiver', 'sender__profile', 'receiver__profile').order_by('timestamp')

    return Response({
        "messages": MessageSerializer(messages, many=True).data,
        "current_user_id": request.user.id,
        "food_listing_id": food_listing.id,
        "other_user": UserSerializer(receiver if request.user.id == donor.id else donor).data,
    }, status=status.HTTP_200_OK)


