from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from django.db import connection
from django.db.models import F, Value, FloatField, ExpressionWrapper, Case, When, Subquery, OuterRef
from django.db.models.functions import Radians, Sin, Cos, ATan2, Sqrt, Power
from .models import Profile, FoodListing, Message, Donation, Feedback, Notification
from .serializers import SignupSerializer, UserSerializer, LoginSerializer, FoodListingSerializer, MessageSerializer, DonationSerializer, FeedbackSerializer, NotificationSerializer

# ─── Location-based filtering (Haversine, computed at the DB layer) ───────
EARTH_RADIUS_KM = 6371.0
DEFAULT_RADIUS_KM = 30.0


def annotate_distance(queryset, user_lat, user_lng, lat_expr=None, lng_expr=None, alias='distance'):
    """Annotate each row with `alias` (km) from (user_lat, user_lng) to the row's
    target latitude/longitude (by default the row's own `latitude`/`longitude`
    fields, but any expression — e.g. a Case/When or a related field — can be
    passed via lat_expr/lng_expr), using the Haversine formula evaluated by the
    database (RADIANS/SIN/COS/ATAN2/SQRT/POWER pushed down to SQL, not computed
    in Python).
    """
    if lat_expr is None:
        lat_expr = F('latitude')
    if lng_expr is None:
        lng_expr = F('longitude')

    user_lat_rad = Radians(Value(user_lat, output_field=FloatField()))
    user_lng_rad = Radians(Value(user_lng, output_field=FloatField()))
    lat_rad = Radians(lat_expr)
    lng_rad = Radians(lng_expr)

    dlat = lat_rad - user_lat_rad
    dlon = lng_rad - user_lng_rad

    a = Power(Sin(dlat / 2.0), 2) + Cos(user_lat_rad) * Cos(lat_rad) * Power(Sin(dlon / 2.0), 2)
    c = 2 * ATan2(Sqrt(a), Sqrt(1 - a))

    distance_expr = ExpressionWrapper(
        Value(EARTH_RADIUS_KM, output_field=FloatField()) * c,
        output_field=FloatField(),
    )
    return queryset.annotate(**{alias: distance_expr})


def parse_coords(request):
    """Return (lat, lng) floats from query params, or (None, None) if absent/invalid."""
    lat = request.query_params.get('lat')
    lng = request.query_params.get('lng')
    if lat is None or lng is None:
        return None, None
    try:
        return float(lat), float(lng)
    except (TypeError, ValueError):
        return None, None


def parse_coords_from_data(data):
    """Return (lat, lng) floats from a request body dict, or (None, None)."""
    if not isinstance(data, dict):
        return None, None
    lat = data.get('latitude') or data.get('lat')
    lng = data.get('longitude') or data.get('lng')
    if lat is None or lng is None:
        return None, None
    try:
        return float(lat), float(lng)
    except (TypeError, ValueError):
        return None, None


def parse_radius(request, default=DEFAULT_RADIUS_KM):
    raw = request.query_params.get('radius') or request.query_params.get('radius_km')
    if not raw:
        return default
    try:
        radius = float(raw)
        return radius if radius > 0 else default
    except (TypeError, ValueError):
        return default


def filter_within_radius(queryset, user_lat, user_lng, radius_km):
    """Restrict a queryset to rows with coordinates set and within radius_km of
    (user_lat, user_lng), ordered nearest-first. The distance is annotated on
    each row (in km) via annotate_distance so it can be returned in the API
    response.
    """
    queryset = queryset.filter(latitude__isnull=False, longitude__isnull=False)
    queryset = annotate_distance(queryset, user_lat, user_lng)
    return queryset.filter(distance__lte=radius_km).order_by('distance')

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
        is_rider = False
        account_status = 'Pending'
        try:
            profile = user.profile
            account_type = profile.account_type.lower()
            account_status = profile.account_status
            if account_type in ['donor', 'organization']:
                is_donor = True
            elif account_type == 'receiver':
                is_receiver = True
            elif account_type == 'rider':
                is_rider = True
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
            "is_admin": is_admin,
            "is_rider": is_rider,
            "account_status": account_status
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
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        return FoodListing.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class FoodListingDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = FoodListingSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        return FoodListing.objects.filter(user=self.request.user)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_food(request):
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

    # Restrict to a 30km (configurable) radius of the receiver/rider's current
    # location. Distance is computed at the database layer via the Haversine
    # formula (see annotate_distance) so it can also be returned in the response.
    user_lat, user_lng = parse_coords(request)
    has_coords = user_lat is not None and user_lng is not None
    radius_km = parse_radius(request)

    if has_coords:
        listings = list(filter_within_radius(queryset, user_lat, user_lng, radius_km))
    else:
        listings = list(queryset.order_by('-created_at'))

    serializer = FoodListingSerializer(listings, many=True, context={'request': request})
    data = serializer.data

    if has_coords:
        for item_data, listing in zip(data, listings):
            item_data['distance'] = round(listing.distance, 2)

    return Response(data, status=status.HTTP_200_OK)

from django.db import transaction

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def claim_food(request, food_id=None):
    # Support food_id from URL parameter, request body, or query param
    target_id = food_id
    if not target_id and isinstance(request.data, dict):
        target_id = request.data.get('food_id') or request.data.get('id')
    if not target_id:
        target_id = request.query_params.get('food_id') or request.query_params.get('id')

    if not target_id:
        return Response({"error": "food_id is required to claim a listing."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        target_id = int(target_id)
    except (TypeError, ValueError):
        return Response({"error": "Invalid food_id provided."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        with transaction.atomic():
            try:
                food_listing = FoodListing.objects.select_for_update().get(id=target_id)
            except FoodListing.DoesNotExist:
                return Response({"error": "Food listing does not exist."}, status=status.HTTP_404_NOT_FOUND)

            # Prevent donor from claiming their own food
            if food_listing.user == request.user:
                return Response({"error": "You cannot claim your own food donation."}, status=status.HTTP_400_BAD_REQUEST)

            # Check status
            if food_listing.status.lower() != 'available':
                return Response(
                    {"error": f"Food listing is not available (current status: {food_listing.status})."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Link receiver to listing and update status
            food_listing.status = 'Claimed'
            food_listing.claimed_by = request.user
            food_listing.save()

            receiver_lat, receiver_lng = parse_coords_from_data(request.data)

            donation, created = Donation.objects.get_or_create(
                food_id=food_listing,
                defaults={
                    'donor_id': food_listing.user,
                    'receiver_id': request.user,
                    'latitude': receiver_lat,
                    'longitude': receiver_lng,
                }
            )
            if not created:
                changed = False
                if donation.receiver_id != request.user:
                    donation.receiver_id = request.user
                    changed = True
                if receiver_lat is not None and receiver_lng is not None:
                    donation.latitude = receiver_lat
                    donation.longitude = receiver_lng
                    changed = True
                if changed:
                    donation.save()

            # Create notification for donor
            donor_name = getattr(request.user, 'profile', None) and request.user.profile.full_name or request.user.email
            Notification.objects.create(
                recipient=food_listing.user,
                notification_type='claim',
                food_listing=food_listing,
                message=f"Your food listing '{food_listing.food_title}' has been claimed by {donor_name}."
            )

            return Response({
                "message": "Food claimed successfully",
                "donation": DonationSerializer(donation, context={'request': request}).data,
                "food_status": food_listing.status,
                "listing": FoodListingSerializer(food_listing, context={'request': request}).data,
            }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_transaction(request, food_id):
    try:
        with transaction.atomic():
            food_listing = FoodListing.objects.select_for_update().get(id=food_id)
            if food_listing.status not in ['Out for Delivery', 'Claimed']:
                return Response({"error": f"Food listing cannot be completed from status '{food_listing.status}'."}, status=status.HTTP_400_BAD_REQUEST)
            
            donation = Donation.objects.filter(food_id=food_listing).first()
            if not donation:
                return Response({"error": "No donation record found for this listing."}, status=status.HTTP_400_BAD_REQUEST)
            
            # Allow donor, receiver, OR assigned rider to mark complete
            is_authorized = (
                request.user == food_listing.user or
                request.user == donation.receiver_id or
                (food_listing.claimed_by and request.user == food_listing.claimed_by) or
                (food_listing.rider and request.user == food_listing.rider) or
                request.user.is_staff
            )
            if not is_authorized:
                return Response({"error": "You are not authorized to complete this transaction."}, status=status.HTTP_403_FORBIDDEN)
            
            food_listing.status = 'Completed'
            food_listing.save()
            
            # Award gamification points to donor
            try:
                donor_profile = food_listing.user.profile
                donor_profile.reward_points += 50
                donor_profile.save()
            except Exception:
                pass
            
            return Response({
                "message": "Transaction completed successfully",
                "status": food_listing.status,
                "reward_points_earned": 50
            }, status=status.HTTP_200_OK)
    except FoodListing.DoesNotExist:
        return Response({"error": "Food listing not found."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_claims(request):
    donations = Donation.objects.filter(receiver_id=request.user).order_by('-created_at')
    serializer = DonationSerializer(donations, many=True, context={'request': request})
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
    serializer = FoodListingSerializer(listings, many=True, context={'request': request})
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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def rider_accept_delivery(request, food_id):
    """Assign the requesting rider to a claimed listing. This does NOT mean the
    rider has the food yet — status stays 'Claimed' (now with a rider attached)
    until the rider confirms pickup via rider_mark_picked_up, at which point it
    becomes 'Out for Delivery'.
    """
    try:
        with transaction.atomic():
            food_listing = FoodListing.objects.select_for_update().get(id=food_id)
            if food_listing.status != 'Claimed':
                return Response({"error": f"Food listing is currently '{food_listing.status}' and cannot be accepted."}, status=status.HTTP_400_BAD_REQUEST)
            if food_listing.rider and food_listing.rider != request.user:
                return Response({"error": "Another rider has already accepted this delivery."}, status=status.HTTP_400_BAD_REQUEST)

            food_listing.rider = request.user
            food_listing.save()

            rider_name = getattr(getattr(request.user, 'profile', None), 'full_name', '') or request.user.username

            # Get donation to notify donor and receiver
            donation = Donation.objects.filter(food_id=food_listing).first()
            if donation:
                Notification.objects.create(
                    recipient=food_listing.user,
                    notification_type='delivery',
                    food_listing=food_listing,
                    message=f"Rider {rider_name} has accepted delivery for '{food_listing.food_title}' and is heading to you for pickup."
                )
                Notification.objects.create(
                    recipient=donation.receiver_id,
                    notification_type='delivery',
                    food_listing=food_listing,
                    message=f"Rider {rider_name} has been assigned to deliver your food '{food_listing.food_title}'."
                )
            elif food_listing.claimed_by:
                Notification.objects.create(
                    recipient=food_listing.claimed_by,
                    notification_type='delivery',
                    food_listing=food_listing,
                    message=f"Rider {rider_name} has been assigned to deliver your food '{food_listing.food_title}'."
                )

            return Response({
                "message": "Delivery accepted successfully",
                "status": food_listing.status,
                "rider_name": rider_name,
                "listing": FoodListingSerializer(food_listing, context={'request': request}).data
            }, status=status.HTTP_200_OK)
    except FoodListing.DoesNotExist:
        return Response({"error": "Food listing not found."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def rider_mark_picked_up(request, food_id):
    """The assigned rider confirms they've collected the food from the donor.
    Transitions 'Claimed' -> 'Out for Delivery', after which the rider's
    destination switches from the donor's pickup point to the receiver's
    drop-off point.
    """
    try:
        with transaction.atomic():
            food_listing = FoodListing.objects.select_for_update().get(id=food_id)
            if food_listing.rider != request.user:
                return Response({"error": "You are not assigned to this delivery."}, status=status.HTTP_403_FORBIDDEN)
            if food_listing.status != 'Claimed':
                return Response({"error": f"Food listing is currently '{food_listing.status}' and cannot be marked picked up."}, status=status.HTTP_400_BAD_REQUEST)

            food_listing.status = 'Out for Delivery'
            food_listing.save()

            rider_name = getattr(getattr(request.user, 'profile', None), 'full_name', '') or request.user.username
            donation = Donation.objects.filter(food_id=food_listing).first()
            recipient = donation.receiver_id if donation else food_listing.claimed_by
            if recipient:
                Notification.objects.create(
                    recipient=recipient,
                    notification_type='delivery',
                    food_listing=food_listing,
                    message=f"Rider {rider_name} has picked up your food '{food_listing.food_title}' and is on the way to you."
                )

            return Response({
                "message": "Pickup confirmed successfully",
                "status": food_listing.status,
                "listing": FoodListingSerializer(food_listing, context={'request': request}).data
            }, status=status.HTTP_200_OK)
    except FoodListing.DoesNotExist:
        return Response({"error": "Food listing not found."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def rider_available_deliveries(request):
    queryset = FoodListing.objects.filter(status='Claimed', rider__isnull=True)

    # Riders should only see pickups within a 30km (configurable) radius of
    # their current location, with distance computed at the DB layer.
    user_lat, user_lng = parse_coords(request)
    has_coords = user_lat is not None and user_lng is not None
    radius_km = parse_radius(request)

    if has_coords:
        listings = list(filter_within_radius(queryset, user_lat, user_lng, radius_km))
    else:
        listings = list(queryset.order_by('-created_at'))

    serializer = FoodListingSerializer(listings, many=True, context={'request': request})
    data = serializer.data

    if has_coords:
        for item_data, listing in zip(data, listings):
            item_data['distance'] = round(listing.distance, 2)

    return Response(data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def rider_my_deliveries(request):
    """The rider's active deliveries, with the next-leg destination and distance:
    while status is 'Claimed' the rider is still heading to the donor to pick up
    the food; once 'Out for Delivery' the rider is heading to the receiver's
    drop-off point. Distance to that next stop is computed at the DB layer via
    the Haversine formula, from the rider's current coordinates (?lat=&lng=).
    """
    queryset = FoodListing.objects.filter(rider=request.user, status__in=['Out for Delivery', 'Claimed'])

    donation_lat_sq = Donation.objects.filter(food_id=OuterRef('pk')).order_by('-created_at').values('latitude')[:1]
    donation_lng_sq = Donation.objects.filter(food_id=OuterRef('pk')).order_by('-created_at').values('longitude')[:1]

    queryset = queryset.annotate(
        target_lat=Case(
            When(status='Out for Delivery', then=Subquery(donation_lat_sq)),
            default=F('latitude'),
            output_field=FloatField(),
        ),
        target_lng=Case(
            When(status='Out for Delivery', then=Subquery(donation_lng_sq)),
            default=F('longitude'),
            output_field=FloatField(),
        ),
    )

    user_lat, user_lng = parse_coords(request)
    has_coords = user_lat is not None and user_lng is not None
    if has_coords:
        queryset = annotate_distance(queryset, user_lat, user_lng, lat_expr=F('target_lat'), lng_expr=F('target_lng'))

    listings = list(queryset.order_by('-created_at'))

    serializer = FoodListingSerializer(listings, many=True, context={'request': request})
    data = serializer.data

    for item_data, listing in zip(data, listings):
        item_data['destination_type'] = 'receiver' if listing.status == 'Out for Delivery' else 'donor'
        item_data['destination_lat'] = listing.target_lat
        item_data['destination_lng'] = listing.target_lng
        if has_coords and listing.target_lat is not None and listing.target_lng is not None:
            item_data['distance'] = round(listing.distance, 2)
        else:
            item_data['distance'] = None

    return Response(data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminRole])
def admin_approve_user(request, user_id):
    try:
        user = User.objects.get(id=user_id)
        profile = user.profile
        profile.account_status = 'Active'
        profile.save()
        return Response({"message": f"User {user.email} has been approved.", "account_status": "Active"}, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminRole])
def admin_reject_user(request, user_id):
    try:
        user = User.objects.get(id=user_id)
        profile = user.profile
        profile.account_status = 'Rejected'
        profile.save()
        return Response({"message": f"User {user.email} has been rejected.", "account_status": "Rejected"}, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_leaderboard(request):
    try:
        # Get all users with profiles and reward points
        profiles = Profile.objects.filter(account_type__in=['Donor', 'Organization']).select_related('user').order_by('-reward_points')
        
        leaderboard_data = []
        for idx, profile in enumerate(profiles[:10], 1):  # Top 10
            donation_count = FoodListing.objects.filter(user=profile.user, status='Completed').count()
            points = profile.reward_points or 0
            
            # Determine badge based on points
            if points >= 1000:
                badge = 'Platinum Guardian'
            elif points >= 500:
                badge = 'Golden Hero'
            else:
                badge = 'Silver Donor'
            
            leaderboard_data.append({
                'rank': idx,
                'id': profile.user.id,
                'name': profile.full_name or profile.user.email,
                'points': points,
                'donations': donation_count,
                'badge': badge
            })
        
        return Response(leaderboard_data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notifications(request):
    try:
        notifications = Notification.objects.filter(recipient=request.user).order_by('-created_at')
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read(request, notification_id):
    try:
        notification = Notification.objects.get(id=notification_id, recipient=request.user)
        notification.is_read = True
        notification.save()
        return Response({"message": "Notification marked as read"}, status=status.HTTP_200_OK)
    except Notification.DoesNotExist:
        return Response({"error": "Notification not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    user = request.user
    profile, created = Profile.objects.get_or_create(user=user)

    if request.method == 'GET':
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "name": profile.full_name or "",
            "phone": profile.contact_phone or "",
            "profilePic": profile.profile_pic or "",
        }, status=status.HTTP_200_OK)

    elif request.method in ['PUT', 'PATCH']:
        data = request.data
        
        # Update Profile fields
        if 'name' in data:
            profile.full_name = data['name']
        if 'phone' in data:
            profile.contact_phone = data['phone']
        if 'profilePic' in data:
            profile.profile_pic = data['profilePic']
        profile.save()

        # Update User fields
        if 'email' in data:
            user.email = data['email']
            user.username = data['email']  # username is email in this project
        
        # Check and update password if provided
        if 'newPassword' in data and data['newPassword']:
            old_password = data.get('oldPassword')
            if old_password:
                if not user.check_password(old_password):
                    return Response({"error": "Incorrect old password"}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(data['newPassword'])
            
        user.save()

        # Ensure token exists
        token, created = Token.objects.get_or_create(user=user)

        return Response({
            "token": token.key,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "profile": {
                    "full_name": profile.full_name,
                    "contact_phone": profile.contact_phone,
                    "profile_pic": profile.profile_pic,
                }
            },
            "message": "Profile updated successfully"
        }, status=status.HTTP_200_OK)


