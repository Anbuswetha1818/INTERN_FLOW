"""
SIMS — User & Profile Management Views
Users, Interns, Staff, Profiles, Onboarding
"""

from django.contrib.auth.models import User
from django.db.models import Q
from django.utils import timezone

from rest_framework import status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny

from ..models import (
    UserProfile, OnboardingSubmission, ProfileUpdateRequest,
    Promotion, Notification, AttendanceRecord
)
from ..serializers import (
    UserProfileSerializer, UserProfileListSerializer, UserFullDetailSerializer,
    OnboardingSubmissionSerializer, ProfileUpdateRequestSerializer,
    PromotionSerializer,
)
from ..permissions import IsSuperAdminOrManager, IsMentorOrAbove, IsStaffOrAbove

class NextEmpIdView(APIView):
    """GET /Sims/next-emp-id/?role=<role>"""
    permission_classes = [IsAuthenticated, IsStaffOrAbove]

    def get(self, request):
        role = request.query_params.get('role', 'staff')
        
        prefix_map = {
            'staff': 'STA',
            'mentor': 'MEN',
            'sme': 'SME',
            'manager': 'MAN',
            'admin': 'ADM',
            'superadmin': 'SUADM'
        }
        
        prefix = prefix_map.get(role.lower(), 'EMP')
        
        # Find the max ID with this prefix
        users_with_prefix = UserProfile.objects.filter(emp_id__startswith=prefix).values_list('emp_id', flat=True)
        
        max_num = 0
        for emp_id in users_with_prefix:
            num_part = emp_id[len(prefix):]
            if num_part.isdigit():
                max_num = max(max_num, int(num_part))
                
        next_num = max_num + 1
        next_emp_id = f"{prefix}{next_num:04d}"
        
        return Response({'next_emp_id': next_emp_id})


class UserListView(APIView):
    """GET /Sims/users/ — List all users."""
    permission_classes = [IsAuthenticated, IsStaffOrAbove]

    def get(self, request):
        profile = request.user.profile
        queryset = UserProfile.objects.filter(is_deleted=False)

        # Entity scoping
        if not profile.is_global_admin():
            queryset = queryset.filter(entity=profile.entity)

        # Filters
        role = request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)

        user_status = request.query_params.get('status')
        if user_status:
            queryset = queryset.filter(user_status=user_status)

        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(full_name__icontains=search) |
                Q(emp_id__icontains=search) |
                Q(user__email__icontains=search)
            )

        serializer = UserProfileListSerializer(queryset, many=True)
        return Response(serializer.data)


class InternListView(APIView):
    """GET /Sims/interns/ — List all interns."""
    permission_classes = [IsAuthenticated, IsStaffOrAbove]

    def get(self, request):
        profile = request.user.profile
        queryset = UserProfile.objects.filter(role='intern', is_deleted=False)

        # Entity scoping
        if not profile.is_global_admin():
            queryset = queryset.filter(entity=profile.entity)

        # Domain scoping for Leads - Removed to allow SMEs to view all interns under their entity
        # if profile.role == 'sme':
        #     queryset = queryset.filter(domain=profile.domain)

        # Mentor scoping
        if profile.role == 'mentor':
            intern_ids = set()
            for team in profile.led_teams.all():
                intern_ids.update(team.interns.values_list('id', flat=True))
            for project in profile.led_projects.all():
                if project.team:
                    intern_ids.update(project.team.interns.values_list('id', flat=True))
            queryset = queryset.filter(id__in=intern_ids)

        # Filters
        user_status = request.query_params.get('status')
        if user_status:
            queryset = queryset.filter(user_status=user_status)

        domain = request.query_params.get('domain')
        if domain:
            queryset = queryset.filter(domain_id=domain)

        scheme = request.query_params.get('scheme')
        if scheme:
            queryset = queryset.filter(scheme=scheme)

        serializer = UserProfileListSerializer(queryset, many=True)
        return Response(serializer.data)


class InternStatsView(APIView):
    """GET /Sims/interns/stats/ — Intern count statistics."""
    permission_classes = [IsAuthenticated, IsStaffOrAbove]

    def get(self, request):
        profile = request.user.profile
        queryset = UserProfile.objects.filter(role='intern', is_deleted=False)
        if not profile.is_global_admin():
            queryset = queryset.filter(entity=profile.entity)

        today = timezone.now().date()
        present_count = AttendanceRecord.objects.filter(
            date=today,
            status__in=['present', 'halfday'],
            user__in=queryset
        ).count()

        return Response({
            'total': queryset.count(),
            'active': queryset.filter(user_status__in=['active', 'inprogress']).count(),
            'completed': queryset.filter(user_status='completed').count(),
            'yet_to_join': queryset.filter(user_status='yettojoin').count(),
            'on_leave': queryset.filter(user_status='onleave').count(),
            'discontinued': queryset.filter(user_status='discontinued').count(),
            'present_today': present_count,
        })


class InternFullListView(APIView):
    """GET /Sims/interns/full-list/ — Full intern list with all fields."""
    permission_classes = [IsAuthenticated, IsStaffOrAbove]

    def get(self, request):
        profile = request.user.profile
        queryset = UserProfile.objects.filter(role='intern', is_deleted=False)
        if not profile.is_global_admin():
            queryset = queryset.filter(entity=profile.entity)
        serializer = UserFullDetailSerializer(queryset, many=True)
        return Response(serializer.data)


class UserDataView(APIView):
    """GET/PATCH /Sims/user-data/{empId}/ — Get or update user data."""
    permission_classes = [IsAuthenticated]

    def get(self, request, emp_id):
        try:
            profile = UserProfile.objects.get(emp_id=emp_id, is_deleted=False)
            serializer = UserFullDetailSerializer(profile)
            return Response(serializer.data)
        except UserProfile.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, emp_id):
        try:
            profile = UserProfile.objects.get(emp_id=emp_id, is_deleted=False)
            serializer = UserProfileSerializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        except UserProfile.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


class UserUpdateView(APIView):
    """PATCH /Sims/user/update/{empId}/ — Update user record."""
    permission_classes = [IsAuthenticated, IsSuperAdminOrManager]

    def patch(self, request, emp_id):
        try:
            profile = UserProfile.objects.get(emp_id=emp_id, is_deleted=False)
            
            # Handle password change
            new_password = request.data.get('new_password')
            old_password = request.data.get('old_password')
            
            if new_password:
                user = profile.user
                if old_password and not user.check_password(old_password):
                    return Response({'error': 'Old password is incorrect'}, status=status.HTTP_400_BAD_REQUEST)
                user.set_password(new_password)
                user.save()

            serializer = UserProfileSerializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        except UserProfile.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, emp_id):
        """Soft delete the user."""
        try:
            profile = UserProfile.objects.get(emp_id=emp_id, is_deleted=False)
            profile.is_deleted = True
            profile.user_status = 'discontinued'
            profile.save()
            
            # Optionally deactivate the underlying Django User
            user = profile.user
            user.is_active = False
            user.save()
            
            return Response({'message': 'User deleted successfully'})
        except UserProfile.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


class FullDetailView(APIView):
    """GET /Sims/fulldetail/ — Current user full detail."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserFullDetailSerializer(request.user.profile)
        return Response(serializer.data)


class StaffDetailsView(APIView):
    """GET /Sims/staffs-details/ — All staff with details."""
    permission_classes = [IsAuthenticated, IsStaffOrAbove]

    def get(self, request):
        profile = request.user.profile
        queryset = UserProfile.objects.filter(
            role__in=['superadmin', 'admin', 'manager', 'sme', 'mentor', 'staff'],
            is_deleted=False
        )
        # Rule: Nobody sees superadmins in this list
        queryset = queryset.exclude(role='superadmin')

        # Rule: Only Super Admins can see other Admins
        if profile.role != 'superadmin':
            queryset = queryset.exclude(role='admin')

        if not profile.is_global_admin():
            queryset = queryset.filter(entity=profile.entity)
        serializer = UserProfileListSerializer(queryset, many=True)
        return Response(serializer.data)


class StaffListView(APIView):
    """GET /Sims/staffs/ — All staff list."""
    permission_classes = [IsAuthenticated, IsStaffOrAbove]

    def get(self, request):
        profile = request.user.profile
        queryset = UserProfile.objects.filter(
            role__in=['superadmin', 'admin', 'manager', 'sme', 'mentor', 'staff'],
            is_deleted=False
        )
        # Rule: Nobody sees superadmins in this list
        queryset = queryset.exclude(role='superadmin')

        # Rule: Only Super Admins can see other Admins
        if profile.role != 'superadmin':
            queryset = queryset.exclude(role='admin')

        if not profile.is_global_admin():
            queryset = queryset.filter(entity=profile.entity)
        serializer = UserProfileListSerializer(queryset, many=True)
        return Response(serializer.data)


class ReportingStaffView(APIView):
    """GET /Sims/users/reporting-staff/ — Staff reporting to current user."""
    permission_classes = [IsAuthenticated, IsStaffOrAbove]

    def get(self, request):
        profile = request.user.profile
        if profile.is_global_admin():
            queryset = UserProfile.objects.filter(is_deleted=False).exclude(role='superadmin')
        elif profile.role == 'superadmin':
            queryset = UserProfile.objects.filter(entity=profile.entity, is_deleted=False).exclude(role='superadmin')
        elif profile.role == 'admin':
            queryset = UserProfile.objects.filter(entity=profile.entity, is_deleted=False).exclude(role__in=('superadmin', 'admin'))
        elif profile.role == 'manager':
            queryset = UserProfile.objects.filter(entity=profile.entity, is_deleted=False).exclude(role='manager')
        elif profile.role == 'sme':
            queryset = UserProfile.objects.filter(domain=profile.domain, is_deleted=False, role__in=['mentor', 'intern'])
        elif profile.role == 'mentor':
            mentor_teams = profile.led_teams.all()
            intern_ids = []
            for team in mentor_teams:
                intern_ids.extend(team.interns.values_list('id', flat=True))
            queryset = UserProfile.objects.filter(id__in=intern_ids, is_deleted=False)
        else:
            queryset = UserProfile.objects.none()

        serializer = UserProfileListSerializer(queryset, many=True)
        return Response(serializer.data)


class DeletedUsersView(APIView):
    """GET /Sims/deleted-users/ — Soft-deleted users."""
    permission_classes = [IsAuthenticated, IsSuperAdminOrManager]

    def get(self, request):
        profile = request.user.profile
        queryset = UserProfile.objects.filter(is_deleted=True)
        if not profile.is_global_admin():
            queryset = queryset.filter(entity=profile.entity)
        serializer = UserProfileListSerializer(queryset, many=True)
        return Response(serializer.data)


class InternCountByDomainView(APIView):
    """GET /Sims/intern-count-by-domain/ — Intern count per domain."""
    permission_classes = [IsAuthenticated, IsStaffOrAbove]

    def get(self, request):
        profile = request.user.profile
        queryset = UserProfile.objects.filter(role='intern', is_deleted=False)
        if not profile.is_global_admin():
            queryset = queryset.filter(entity=profile.entity)

        from django.db.models import Count
        domain_counts = queryset.values('domain__name').annotate(count=Count('id')).order_by('-count')
        return Response(list(domain_counts))


class InternTaskSummaryView(APIView):
    """GET /Sims/intern-task-summary/ — Per-intern task completion stats."""
    permission_classes = [IsAuthenticated, IsStaffOrAbove]

    def get(self, request):
        profile = request.user.profile
        queryset = UserProfile.objects.filter(role='intern', is_deleted=False)
        if not profile.is_global_admin():
            queryset = queryset.filter(entity=profile.entity)

        summaries = []
        for intern in queryset:
            tasks = intern.assigned_tasks.filter(is_deleted=False)
            total = tasks.count()
            completed = tasks.filter(status__in=['completed', 'verified']).count()
            summaries.append({
                'emp_id': intern.emp_id,
                'full_name': intern.full_name,
                'total_tasks': total,
                'completed_tasks': completed,
                'completion_rate': round((completed / total * 100), 1) if total > 0 else 0,
            })

        return Response(summaries)


class PersonalDataView(APIView):
    """GET/PATCH /Sims/personal-data/{empId}/ — Personal profile data."""
    permission_classes = [IsAuthenticated]

    def get(self, request, emp_id):
        try:
            profile = UserProfile.objects.get(emp_id=emp_id, is_deleted=False)
            serializer = UserProfileSerializer(profile)
            return Response(serializer.data)
        except UserProfile.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, emp_id):
        try:
            profile = UserProfile.objects.get(emp_id=emp_id, is_deleted=False)
            # Only the user themselves or staff can update
            requesting_profile = request.user.profile
            if requesting_profile.emp_id != emp_id and not requesting_profile.is_staff_role:
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            serializer = UserProfileSerializer(profile, data=request.data, partial=True)
            if not serializer.is_valid():
                print("VALIDATION ERRORS:", serializer.errors)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        except UserProfile.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


class CollegeDetailsView(APIView):
    """GET/PATCH /Sims/college-details/{empId}/ — College/academic details."""
    permission_classes = [IsAuthenticated]

    def get(self, request, emp_id):
        try:
            profile = UserProfile.objects.get(emp_id=emp_id, is_deleted=False)
            return Response({
                'registration_number': profile.registration_number,
                'college_name': profile.college_name,
                'college_location': profile.college_location,
                'degree': profile.degree,
                'college_department': profile.college_department,
                'year_of_passing': profile.year_of_passing,
            })
        except UserProfile.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, emp_id):
        try:
            profile = UserProfile.objects.get(emp_id=emp_id, is_deleted=False)
            for field in ['registration_number', 'college_name', 'college_location', 'degree', 'college_department', 'year_of_passing']:
                if field in request.data:
                    setattr(profile, field, request.data[field])
            profile.save()
            return Response({'message': 'Updated successfully'})
        except UserProfile.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


# =============================================================================
# Profile Update Requests
# =============================================================================

class SubmitPersonalUpdateView(APIView):
    """POST /Sims/submit-personal-update/ — Intern submits profile update request."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        profile = request.user.profile
        ProfileUpdateRequest.objects.create(
            user=profile,
            field_changes=request.data.get('field_changes', {}),
        )
        return Response({'message': 'Profile update request submitted'}, status=status.HTTP_201_CREATED)


class ProfileUpdateRequestListView(APIView):
    """GET /Sims/profile-update-request/ — Pending profile change requests."""
    permission_classes = [IsAuthenticated, IsSuperAdminOrManager]

    def get(self, request):
        profile = request.user.profile
        queryset = ProfileUpdateRequest.objects.filter(status='pending')
        if not profile.is_global_admin():
            queryset = queryset.filter(user__entity=profile.entity)
        serializer = ProfileUpdateRequestSerializer(queryset, many=True)
        return Response(serializer.data)


class ApproveProfileView(APIView):
    """POST /Sims/approve-profile/{pk}/ — Approve profile change."""
    permission_classes = [IsAuthenticated, IsSuperAdminOrManager]

    def post(self, request, pk):
        try:
            req = ProfileUpdateRequest.objects.get(pk=pk, status='pending')
            # Apply changes
            profile = req.user
            for field, values in req.field_changes.items():
                if hasattr(profile, field):
                    setattr(profile, field, values.get('new', ''))
            profile.save()
            req.status = 'approved'
            req.reviewed_by = request.user.profile
            req.save()
            return Response({'message': 'Profile update approved'})
        except ProfileUpdateRequest.DoesNotExist:
            return Response({'error': 'Request not found'}, status=status.HTTP_404_NOT_FOUND)


class RejectProfileView(APIView):
    """POST /Sims/reject-profile/{pk}/ — Reject profile change."""
    permission_classes = [IsAuthenticated, IsSuperAdminOrManager]

    def post(self, request, pk):
        try:
            req = ProfileUpdateRequest.objects.get(pk=pk, status='pending')
            req.status = 'rejected'
            req.reviewed_by = request.user.profile
            req.reviewer_comment = request.data.get('comment', '')
            req.save()
            return Response({'message': 'Profile update rejected'})
        except ProfileUpdateRequest.DoesNotExist:
            return Response({'error': 'Request not found'}, status=status.HTTP_404_NOT_FOUND)


# =============================================================================
# Onboarding
# =============================================================================

class OnboardingSubmitView(APIView):
    """POST /Sims/onboarding/submit/ — Intern submits onboarding form."""
    permission_classes = [AllowAny]

    def post(self, request):
        from ..models import Entity
        first_entity = Entity.objects.first()
        serializer = OnboardingSubmissionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if 'entity' not in serializer.validated_data or serializer.validated_data['entity'] is None:
            serializer.save(entity=first_entity)
        else:
            serializer.save()
        return Response({
            'message': 'Onboarding form submitted successfully',
            'id': serializer.instance.pk,
        }, status=status.HTTP_201_CREATED)


class OnboardingListView(APIView):
    """GET /Sims/onboarding/list/ — Pending onboarding submissions."""
    permission_classes = [IsAuthenticated, IsStaffOrAbove]

    def get(self, request):
        profile = request.user.profile
        queryset = OnboardingSubmission.objects.all()
        if not profile.is_global_admin() and profile.entity:
            queryset = queryset.filter(Q(entity=profile.entity) | Q(entity__isnull=True))

        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        serializer = OnboardingSubmissionSerializer(queryset, many=True)
        return Response(serializer.data)


class OnboardingEnableView(APIView):
    """POST /Sims/onboarding/enable/{responseId}/ — Approve and activate intern."""
    permission_classes = [IsAuthenticated, IsSuperAdminOrManager]

    def post(self, request, response_id):
        try:
            submission = OnboardingSubmission.objects.get(pk=response_id)
        except OnboardingSubmission.DoesNotExist:
            return Response({'error': 'Submission not found'}, status=status.HTTP_404_NOT_FOUND)

        if submission.status == 'approved':
            return Response({'error': 'Already approved'}, status=status.HTTP_400_BAD_REQUEST)
        
        action = request.data.get('action')

        if action == 'reject':
            submission.status = 'rejected'
            submission.reviewed_by = request.user.profile
            submission.save()
            return Response({'message': 'Application rejected successfully'}, status=status.HTTP_200_OK)

        # Generate intern ID in format VDI001, VDI002, etc.
        import re
        max_num = 0
        
        # Check profiles
        intern_profiles = UserProfile.objects.filter(emp_id__startswith='VDI')
        for p in intern_profiles:
            match = re.match(r'^VDI(\d+)$', p.emp_id)
            if match:
                num = int(match.group(1))
                if num > max_num:
                    max_num = num

        # Check submissions
        intern_submissions = OnboardingSubmission.objects.filter(emp_id__startswith='VDI')
        for s in intern_submissions:
            match = re.match(r'^VDI(\d+)$', s.emp_id)
            if match:
                num = int(match.group(1))
                if num > max_num:
                    max_num = num

        new_num = max_num + 1
        emp_id = f"VDI{new_num:03d}"

        # Create user account
        username = submission.email.split('@')[0]
        # Ensure unique username
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        password = emp_id  # Password is their Intern ID!

        user = User.objects.create_user(
            username=username,
            email=submission.email,
            password=password,
            first_name=submission.full_name.split(' ')[0],
            last_name=' '.join(submission.full_name.split(' ')[1:]),
        )

        # Create profile
        profile = UserProfile.objects.create(
            user=user,
            emp_id=emp_id,
            full_name=submission.full_name,
            role='intern',
            user_status='yettojoin',
            phone=submission.phone,
            aadhar_number=submission.aadhar_number,
            gender=submission.gender,
            date_of_birth=submission.date_of_birth,
            registration_number=submission.registration_number,
            college_location=submission.college_location,
            college_name=submission.college_name,
            degree=submission.degree,
            college_department=submission.college_department,
            year_of_passing=submission.year_of_passing,
            start_date=submission.start_date,
            end_date=submission.end_date,
            shift_timing=submission.shift_timing,
            scheme=submission.scheme,
            domain=submission.domain,
            entity=submission.entity or request.user.profile.entity,
            terms_agreed=submission.terms_agreed,
        )

        # Update submission
        submission.status = 'approved'
        submission.emp_id = emp_id
        submission.reviewed_by = request.user.profile
        submission.save()

        return Response({
            'message': 'Intern account created',
            'emp_id': emp_id,
            'username': username,
            'password': password,  # Only returned once
        }, status=status.HTTP_201_CREATED)


class OnboardingSendCredentialsView(APIView):
    """POST /Sims/onboarding/send_credentials/{internId}/ — Send login credentials."""
    permission_classes = [IsAuthenticated, IsSuperAdminOrManager]

    def post(self, request, intern_id):
        try:
            profile = UserProfile.objects.get(emp_id=intern_id)
            submission = OnboardingSubmission.objects.filter(emp_id=intern_id).first()

            # Build email
            from django.core.mail import send_mail
            from django.conf import settings

            payment_text = ""
            if profile.scheme == 'paid':
                payment_text = (
                    f"Payment Details:\n"
                    f"Your internship scheme requires a fee payment. Please log in to the portal and navigate to the 'Fees' page to check if you have a Full Payment or Installment pending.\n\n"
                )
            elif profile.scheme == 'stipend':
                payment_text = (
                    f"Payment Details:\n"
                    f"You are enrolled in the Stipend scheme. Your payroll and stipend details will be available on the portal.\n\n"
                )

            subject = 'Congratulations! Your SIMS Internship Application is Approved'
            message = (
                f"Dear {profile.full_name},\n\n"
                f"Congratulations! We are pleased to inform you that your internship "
                f"application at SIMS has been approved.\n\n"
                f"Here are your login credentials to access the Student Intern Management System:\n"
                f"  Login ID  : {profile.user.email}\n"
                f"  Password  : {profile.emp_id}\n\n"
                f"{payment_text}"
                f"Please login to the system using the URL provided by your administrator.\n"
                f"We recommend changing your password after your first login.\n\n"
                f"Best regards,\n"
                f"SIMS Administration Team"
            )

            email_error = None
            try:
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [profile.user.email],
                    fail_silently=False,  # surface errors properly
                )
            except Exception as e:
                email_error = str(e)
                print(f"[SEND CREDENTIALS EMAIL ERROR] {e}")

            # Always update DB even if email failed
            if submission:
                submission.credentials_sent = True
                submission.save()

            # Update status to active
            profile.user_status = 'active'
            profile.save()

            if email_error:
                return Response({
                    'message': 'Intern activated, but email sending failed.',
                    'email_error': email_error,
                    'warning': f'Check your SMTP settings in .env. Email to {profile.user.email} was NOT delivered.',
                }, status=status.HTTP_207_MULTI_STATUS)

            return Response({'message': f'Credentials sent successfully to {profile.user.email}'})

        except UserProfile.DoesNotExist:
            return Response({'error': 'Intern not found'}, status=status.HTTP_404_NOT_FOUND)



# =============================================================================
# Promotions
# =============================================================================

class PromotionListView(APIView):
    """GET/POST /Sims/promotions/ — List or create promotions."""
    permission_classes = [IsAuthenticated, IsSuperAdminOrManager]

    def get(self, request):
        profile = request.user.profile
        queryset = Promotion.objects.all()
        if not profile.is_global_admin():
            queryset = queryset.filter(intern__entity=profile.entity)
        serializer = PromotionSerializer(queryset, many=True)
        return Response(serializer.data)

    def post(self, request):
        intern_id = request.data.get('intern_id')
        try:
            intern = UserProfile.objects.get(pk=intern_id)
            promotion = Promotion.objects.create(
                intern=intern,
                from_scheme=intern.scheme,
                to_scheme=request.data.get('to_scheme', intern.scheme),
                from_role=intern.role,
                to_role=request.data.get('to_role', intern.role),
                approved_by=request.user.profile,
                basis=request.data.get('basis', ''),
            )
            # Update intern
            if request.data.get('to_scheme'):
                intern.scheme = request.data['to_scheme']
            if request.data.get('to_role'):
                intern.role = request.data['to_role']
            intern.save()

            serializer = PromotionSerializer(promotion)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except UserProfile.DoesNotExist:
            return Response({'error': 'Intern not found'}, status=status.HTTP_404_NOT_FOUND)

# =============================================================================
# Bulk Import
# =============================================================================

import csv
import io

class BulkImportView(APIView):
    """POST /Sims/users/bulk-import/ — Bulk import users via CSV."""
    permission_classes = [IsAuthenticated, IsSuperAdminOrManager]

    def post(self, request):
        if 'file' not in request.FILES:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        file = request.FILES['file']
        if not file.name.endswith('.csv'):
            return Response({'error': 'Please upload a valid CSV file'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            decoded_file = file.read().decode('utf-8')
            io_string = io.StringIO(decoded_file)
            reader = csv.DictReader(io_string)
            
            headers = [h.strip().lower() for h in reader.fieldnames]
            required_headers = ['email', 'full_name', 'role']
            missing = [req for req in required_headers if req not in headers]
            
            if missing:
                return Response({'error': f'Missing required columns: {", ".join(missing)}'}, status=status.HTTP_400_BAD_REQUEST)

            imported_count = 0
            duplicates = 0
            errors = 0
            
            profile = request.user.profile
            entity = profile.entity

            for row in reader:
                row_data = {k.strip().lower(): v.strip() for k, v in row.items()}
                email = row_data.get('email')
                full_name = row_data.get('full_name')
                role = row_data.get('role', 'intern').lower()
                
                if not email or not full_name:
                    errors += 1
                    continue
                
                if User.objects.filter(email=email).exists() or User.objects.filter(username=email).exists():
                    duplicates += 1
                    continue
                
                # Generate EMP ID
                prefix_map = {
                    'staff': 'STA', 'mentor': 'MEN', 'sme': 'SME',
                    'manager': 'MAN', 'admin': 'ADM', 'superadmin': 'SUADM'
                }
                prefix = prefix_map.get(role, 'EMP')
                
                users_with_prefix = UserProfile.objects.filter(emp_id__startswith=prefix).values_list('emp_id', flat=True)
                max_num = 0
                for e_id in users_with_prefix:
                    num_part = e_id[len(prefix):]
                    if num_part.isdigit():
                        max_num = max(max_num, int(num_part))
                        
                next_emp_id = f"{prefix}{max_num + 1:04d}"
                
                # Create user
                initial_password = next_emp_id if role == 'intern' else 'Sims@123'
                user = User.objects.create_user(username=email, email=email, password=initial_password)
                
                UserProfile.objects.create(
                    user=user,
                    emp_id=next_emp_id,
                    full_name=full_name,
                    role=role,
                    entity=entity,
                    user_status='active',
                    personal_email=email,
                    phone=row_data.get('phone', '')
                )
                imported_count += 1

            return Response({
                'imported': imported_count,
                'duplicates': duplicates,
                'errors': errors
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
