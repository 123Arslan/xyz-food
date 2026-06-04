from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db import connection
from .serializers import SignupSerializer, UserSerializer, LoginSerializer

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
