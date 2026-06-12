from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from django.db import connection
from .models import FoodListing
from .serializers import SignupSerializer, UserSerializer, LoginSerializer, FoodListingSerializer

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

