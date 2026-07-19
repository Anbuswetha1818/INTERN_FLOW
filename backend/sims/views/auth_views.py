"""
SIMS — Authentication Views
Login, Logout, Register, Password Reset (OTP), User Permissions, Current User
"""

import random
import string
from datetime import timedelta

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token

from ..models import UserProfile, PasswordResetOTP, LoginOTP
from ..serializers import (
    LoginSerializer, UserRegistrationSerializer,
    PasswordResetRequestSerializer, PasswordResetVerifySerializer,
    PasswordResetUpdateSerializer, UserProfileSerializer,
)
from ..permissions import get_user_permissions, IsAdmin, IsManagerOrAbove


class LoginView(APIView):
    """POST /Sims/login/ — Authenticate user, return token."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        username_or_email = serializer.validated_data['username'].strip()
        password = serializer.validated_data['password'].strip()

        # Support email OR emp_id OR username authentication
        try:
            if '@' in username_or_email:
                user_obj = User.objects.get(email__iexact=username_or_email)
            else:
                try:
                    profile_obj = UserProfile.objects.get(emp_id__iexact=username_or_email)
                    user_obj = profile_obj.user
                except UserProfile.DoesNotExist:
                    user_obj = User.objects.get(username__iexact=username_or_email)
            username_to_auth = user_obj.username
        except (User.DoesNotExist, UserProfile.DoesNotExist):
            return Response(
                {'error': 'Invalid email/ID or password'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except User.MultipleObjectsReturned:
            # Handle edge case where multiple users share an email
            user_obj = User.objects.filter(email__iexact=username_or_email).first()
            username_to_auth = user_obj.username

        user = authenticate(
            username=username_to_auth,
            password=password
        )

        if not user:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            return Response(
                {'error': 'Account is deactivated'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get or create token
        token, _ = Token.objects.get_or_create(user=user)

        # Get profile
        try:
            profile = user.profile
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'User profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response({
            'token': token.key,
            'username': user.username,
            'email': user.email,
            'role': profile.role,
            'emp_id': profile.emp_id,
            'full_name': profile.full_name,
            'entity_id': profile.entity_id,
            'user_status': profile.user_status,
        }, status=status.HTTP_200_OK)


class LoginVerifyOTPView(APIView):
    """POST /Sims/login/verify-otp/ — Verify OTP and return token."""
    permission_classes = [AllowAny]

    def post(self, request):
        user_id = request.data.get('user_id')
        otp = request.data.get('otp')

        if not user_id or not otp:
            return Response({'error': 'Missing user_id or otp'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        otp_record = LoginOTP.objects.filter(user=user).order_by('-created_at').first()
        if not otp_record or str(otp_record.otp) != str(otp):
            return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)
        if otp_record.is_expired:
            return Response({'error': 'OTP expired'}, status=status.HTTP_400_BAD_REQUEST)
        if otp_record.is_verified:
            return Response({'error': 'OTP already used'}, status=status.HTTP_400_BAD_REQUEST)

        otp_record.is_verified = True
        otp_record.save()

        # Get or create token
        token, _ = Token.objects.get_or_create(user=user)

        # Get profile
        try:
            profile = user.profile
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'User profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response({
            'token': token.key,
            'username': user.username,
            'email': user.email,
            'role': profile.role,
            'emp_id': profile.emp_id,
            'full_name': profile.full_name,
            'entity_id': profile.entity_id,
            'user_status': profile.user_status,
        })


class LogoutView(APIView):
    """POST /Sims/logout/ — Invalidate token."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            request.user.auth_token.delete()
        except Exception:
            pass
        return Response({'message': 'Logged out successfully'})


class RegisterView(APIView):
    """POST /Sims/register/ — Create staff account. Admin/Manager only."""
    permission_classes = [IsAuthenticated, IsManagerOrAbove]

    # Roles that Admin/Manager is allowed to create
    ALLOWED_ROLES = ('manager', 'sme', 'mentor', 'staff', 'intern')

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Block creation of intern or superadmin via this endpoint
        if data['role'] not in self.ALLOWED_ROLES:
            return Response(
                {'error': f'Admin/Manager can only register roles: {self.ALLOWED_ROLES}'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Create Django User
        user = User.objects.create_user(
            username=data['username'],
            email=data['email'],
            password=data['password'],
            first_name=data['full_name'].split(' ')[0],
            last_name=' '.join(data['full_name'].split(' ')[1:]),
        )

        # Create UserProfile
        profile_data = {
            'user': user,
            'emp_id': data['emp_id'],
            'full_name': data['full_name'],
            'role': data['role'],
            'phone': data.get('phone', ''),
            'shift_timing': data.get('shift_timing', 'Standard'),
            'user_status': 'active',
        }

        # Inherit entity from requesting admin/manager
        requesting_profile = request.user.profile
        if requesting_profile.role == 'manager':
            # Managers can only register staff/interns for their own entity
            profile_data['entity'] = requesting_profile.entity
        elif data.get('entity'):
            from ..models import Entity
            profile_data['entity'] = Entity.objects.get(pk=data['entity'])
        elif requesting_profile.entity:
            profile_data['entity'] = requesting_profile.entity

        if data.get('domain'):
            from ..models import Domain
            profile_data['domain'] = Domain.objects.get(pk=data['domain'])

        profile = UserProfile.objects.create(**profile_data)

        return Response({
            'message': 'Staff registered successfully',
            'emp_id': profile.emp_id,
            'username': user.username,
            'role': profile.role,
        }, status=status.HTTP_201_CREATED)


class UserPermissionsView(APIView):
    """GET /Sims/user-permissions/ — Dashboard access flags."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.profile
        except UserProfile.DoesNotExist:
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

        permissions = get_user_permissions(profile)
        permissions['role'] = profile.role
        permissions['emp_id'] = profile.emp_id
        permissions['full_name'] = profile.full_name
        permissions['entity_id'] = profile.entity_id

        return Response(permissions)


class CurrentUserView(APIView):
    """GET /Sims/me/ — Current user role and profile."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.profile
            serializer = UserProfileSerializer(profile)
            data = serializer.data
            data['username'] = request.user.username
            data['email'] = request.user.email
            return Response(data)
        except UserProfile.DoesNotExist:
            return Response({'error': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)


class PasswordResetRequestView(APIView):
    """POST /Sims/password-reset/request/ — Send OTP to email."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'This email is not registered with any account.'}, status=status.HTTP_404_NOT_FOUND)

        # Generate 6-digit OTP
        otp = ''.join(random.choices(string.digits, k=6))

        # Store OTP (expires in 10 minutes)
        PasswordResetOTP.objects.create(
            user=user,
            otp=otp,
            expires_at=timezone.now() + timedelta(minutes=10)
        )

        # Send email
        try:
            send_mail(
                'SIMS - Password Reset OTP',
                f'Your OTP for password reset is: {otp}\n\nThis OTP expires in 10 minutes.',
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
        except Exception:
            pass  # Email backend might be console in dev

        return Response({'message': 'OTP sent! Check your email.'})


class PasswordResetVerifyView(APIView):
    """POST /Sims/password-reset/verify/ — Verify OTP."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user = User.objects.get(email=serializer.validated_data['email'])
            otp_record = PasswordResetOTP.objects.filter(
                user=user,
                otp=serializer.validated_data['otp'],
                is_verified=False,
            ).latest('created_at')

            if otp_record.is_expired:
                return Response({'error': 'OTP has expired'}, status=status.HTTP_400_BAD_REQUEST)

            otp_record.is_verified = True
            otp_record.save()
            return Response({'message': 'OTP verified successfully'})

        except (User.DoesNotExist, PasswordResetOTP.DoesNotExist):
            return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetUpdateView(APIView):
    """POST /Sims/password-reset/update/ — Set new password after OTP verification."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user = User.objects.get(email=serializer.validated_data['email'])
            otp_record = PasswordResetOTP.objects.filter(
                user=user,
                otp=serializer.validated_data['otp'],
                is_verified=True,
            ).latest('created_at')

            if otp_record.is_expired:
                return Response({'error': 'OTP session expired'}, status=status.HTTP_400_BAD_REQUEST)

            user.set_password(serializer.validated_data['new_password'])
            user.save()

            # Delete all OTPs for this user
            PasswordResetOTP.objects.filter(user=user).delete()

            # Invalidate existing tokens
            Token.objects.filter(user=user).delete()

            return Response({'message': 'Password updated successfully'})

        except (User.DoesNotExist, PasswordResetOTP.DoesNotExist):
            return Response({'error': 'Invalid request'}, status=status.HTTP_400_BAD_REQUEST)
