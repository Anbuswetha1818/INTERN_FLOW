"""
SIMS — Attendance & Leave Views
Check-in/out, Breaks, Leave Requests, Claims, Analysis, Hours Calculator
"""

from datetime import datetime, date, timedelta
from django.db.models import Avg, Count, Sum, Q
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from ..models import AttendanceRecord, LeaveRequest, AttendanceClaim, UserProfile
from ..serializers import (
    AttendanceRecordSerializer, LeaveRequestSerializer, AttendanceClaimSerializer,
)
from ..permissions import IsStaffOrAbove, IsMentorOrAbove


class AttendanceListView(APIView):
    """GET /Sims/attendance/ — All attendance records. POST — Update/create a record."""
    permission_classes = [IsAuthenticated, IsStaffOrAbove]

    def get(self, request):
        profile = request.user.profile
        queryset = AttendanceRecord.objects.all()
        if not profile.is_global_admin():
            queryset = queryset.filter(user__entity=profile.entity)
        date_param = request.query_params.get('date')
        if date_param:
            queryset = queryset.filter(date=date_param)
        serializer = AttendanceRecordSerializer(queryset[:200], many=True)
        return Response(serializer.data)

    def post(self, request):
        profile = request.user.profile
        if profile.role != 'sme':
            return Response({'error': 'Only SMEs can edit attendance history.'}, status=status.HTTP_403_FORBIDDEN)
        
        emp_id = request.data.get('emp_id')
        date_str = request.data.get('date')
        if not emp_id or not date_str:
            return Response({'error': 'emp_id and date are required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            target_user = UserProfile.objects.get(emp_id=emp_id)
        except UserProfile.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        if not profile.is_global_admin() and target_user.entity != profile.entity:
            return Response({'error': 'You do not have permission to edit this user\'s attendance.'}, status=status.HTTP_403_FORBIDDEN)
        
        record, created = AttendanceRecord.objects.get_or_create(
            user=target_user,
            date=date_str
        )
        
        status_val = request.data.get('status')
        if status_val in ['present', 'absent', 'onleave', 'halfday']:
            record.status = status_val
        
        def parse_dt(dt_str):
            if not dt_str:
                return None
            try:
                return parse_datetime(dt_str)
            except Exception:
                return None
        
        if status_val in ['absent', 'onleave']:
            record.check_in = None
            record.check_out = None
            record.break_start = None
            record.break_end = None
        else:
            if 'check_in' in request.data:
                record.check_in = parse_dt(request.data.get('check_in'))
            if 'check_out' in request.data:
                record.check_out = parse_dt(request.data.get('check_out'))
            if 'break_start' in request.data:
                record.break_start = parse_dt(request.data.get('break_start'))
            if 'break_end' in request.data:
                record.break_end = parse_dt(request.data.get('break_end'))
            
        record.calculate_hours()
        record.save()
        
        serializer = AttendanceRecordSerializer(record)
        return Response(serializer.data)


class AttendanceByUserView(APIView):
    """GET /Sims/attendance/{empId}/ — Attendance for specific intern."""
    permission_classes = [IsAuthenticated]

    def get(self, request, emp_id):
        try:
            user = UserProfile.objects.get(emp_id=emp_id)
            queryset = AttendanceRecord.objects.filter(user=user)
            serializer = AttendanceRecordSerializer(queryset[:100], many=True)
            return Response(serializer.data)
        except UserProfile.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


class UserAttendanceView(APIView):
    """GET /Sims/attendances/user/ — Current user's own attendance."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = AttendanceRecord.objects.filter(user=request.user.profile)
        serializer = AttendanceRecordSerializer(queryset[:100], many=True)
        return Response(serializer.data)


class LiveCheckInView(APIView):
    """POST /Sims/attendance/live-on/ — Check in."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        profile = request.user.profile
        today = timezone.now().date()
        record, created = AttendanceRecord.objects.get_or_create(
            user=profile, date=today,
            defaults={'status': 'present'}
        )
        if record.check_in:
            return Response({'error': 'Already checked in today'}, status=status.HTTP_400_BAD_REQUEST)

        record.check_in = timezone.now()
        record.status = 'present'
        record.save()
        return Response({'message': 'Checked in', 'check_in': record.check_in.isoformat()})


class LiveCheckOutView(APIView):
    """POST /Sims/attendance/live-off/ — Check out."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        profile = request.user.profile
        today = timezone.now().date()
        try:
            record = AttendanceRecord.objects.get(user=profile, date=today)
            if not record.check_in:
                return Response({'error': 'Not checked in'}, status=status.HTTP_400_BAD_REQUEST)
            if record.check_out:
                return Response({'error': 'Already checked out'}, status=status.HTTP_400_BAD_REQUEST)

            record.check_out = timezone.now()
            record.calculate_hours()
            record.save()
            return Response({
                'message': 'Checked out',
                'check_out': record.check_out.isoformat(),
                'total_hours': record.total_hours,
                'effective_hours': record.effective_hours,
            })
        except AttendanceRecord.DoesNotExist:
            return Response({'error': 'No check-in record found'}, status=status.HTTP_404_NOT_FOUND)


class BreakStartView(APIView):
    """POST /Sims/attendance/break-start/ — Start break."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        profile = request.user.profile
        today = timezone.now().date()
        try:
            record = AttendanceRecord.objects.get(user=profile, date=today)
            if record.break_start:
                return Response({'error': 'Break already started'}, status=status.HTTP_400_BAD_REQUEST)
            record.break_start = timezone.now()
            record.save()
            return Response({'message': 'Break started', 'break_start': record.break_start.isoformat()})
        except AttendanceRecord.DoesNotExist:
            return Response({'error': 'Not checked in'}, status=status.HTTP_404_NOT_FOUND)


class BreakEndView(APIView):
    """POST /Sims/attendance/break-end/ — End break."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        profile = request.user.profile
        today = timezone.now().date()
        try:
            record = AttendanceRecord.objects.get(user=profile, date=today)
            if not record.break_start:
                return Response({'error': 'Break not started'}, status=status.HTTP_400_BAD_REQUEST)
            record.break_end = timezone.now()
            record.save()
            return Response({'message': 'Break ended', 'break_end': record.break_end.isoformat()})
        except AttendanceRecord.DoesNotExist:
            return Response({'error': 'Not checked in'}, status=status.HTTP_404_NOT_FOUND)


class AttendanceDateRangeView(APIView):
    """GET /Sims/attendancedaterange/ — Date-range filtered attendance."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        start = request.query_params.get('start_date')
        end = request.query_params.get('end_date')
        emp_id = request.query_params.get('emp_id')

        queryset = AttendanceRecord.objects.all()
        profile = request.user.profile
        if not profile.is_global_admin():
            queryset = queryset.filter(user__entity=profile.entity)

        if start:
            queryset = queryset.filter(date__gte=start)
        if end:
            queryset = queryset.filter(date__lte=end)
        if emp_id:
            queryset = queryset.filter(user__emp_id=emp_id)

        serializer = AttendanceRecordSerializer(queryset[:500], many=True)
        return Response(serializer.data)


class SimpleAttendanceDataView(APIView):
    """GET /Sims/simpleattendancedata/ — Simplified data for charts."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = request.user.profile
        queryset = AttendanceRecord.objects.all()
        if not profile.is_global_admin():
            queryset = queryset.filter(user__entity=profile.entity)

        date_param = request.query_params.get('date', str(timezone.now().date()))
        day_records = queryset.filter(date=date_param)

        return Response({
            'date': date_param,
            'total_interns': UserProfile.objects.filter(
                role='intern', is_deleted=False, user_status__in=['active', 'inprogress'],
                entity=profile.entity if not profile.is_global_admin() else None
            ).count() if not profile.is_global_admin() else UserProfile.objects.filter(
                role='intern', is_deleted=False, user_status__in=['active', 'inprogress']
            ).count(),
            'present': day_records.filter(status='present').count(),
            'absent': day_records.filter(status='absent').count(),
            'on_leave': day_records.filter(status='onleave').count(),
        })


class AttendanceAnalysisView(APIView):
    """GET /Sims/attendanceanalysis/ — Aggregated attendance statistics."""
    permission_classes = [IsAuthenticated, IsStaffOrAbove]

    def get(self, request):
        profile = request.user.profile
        queryset = AttendanceRecord.objects.all()
        if not profile.is_global_admin():
            queryset = queryset.filter(user__entity=profile.entity)

        # Last 30 days analysis
        thirty_days_ago = timezone.now().date() - timedelta(days=30)
        recent = queryset.filter(date__gte=thirty_days_ago)

        total_records = recent.count()
        present = recent.filter(status='present').count()

        return Response({
            'total_records': total_records,
            'present': present,
            'attendance_percentage': round((present / total_records * 100), 1) if total_records > 0 else 0,
            'average_hours': round(recent.aggregate(avg=Avg('total_hours'))['avg'] or 0, 1),
            'on_leave_days': recent.filter(status='onleave').count(),
        })


# =============================================================================
# Leave Management
# =============================================================================

class LeaveRequestView(APIView):
    """POST /Sims/attendances/leave_request/ — Submit leave request."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        profile = request.user.profile
        
        # Validation: Interns must have an assigned mentor (via led_teams or led_projects of a mentor)
        if profile.role == 'intern':
            # Check if intern is part of any team that is part of a project with a team_lead
            from ..models import Project
            has_mentor = Project.objects.filter(team__interns=profile, is_deleted=False).exclude(team_lead__isnull=True).exists()
            if not has_mentor:
                return Response({'error': 'You must be assigned to a mentor to apply for leave.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = LeaveRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=profile)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class LeaveRequestDetailView(APIView):
    """DELETE /Sims/attendances/leave_request/{pk}/ — Cancel pending leave."""
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            leave = LeaveRequest.objects.get(pk=pk, user=request.user.profile)
            if leave.status != 'pending':
                return Response({'error': 'Can only cancel pending leave requests.'}, status=status.HTTP_400_BAD_REQUEST)
            leave.delete()
            return Response({'message': 'Leave request cancelled successfully'})
        except LeaveRequest.DoesNotExist:
            return Response({'error': 'Leave request not found'}, status=status.HTTP_404_NOT_FOUND)


class LeaveHistoryView(APIView):
    """GET /Sims/attendances/leave_history/ — Own leave history."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = LeaveRequest.objects.filter(user=request.user.profile)
        serializer = LeaveRequestSerializer(queryset, many=True)
        return Response(serializer.data)


class LeaveHistoryByUserView(APIView):
    """GET /Sims/attendances/leave_history/{empId}/ — Leave history for specific intern."""
    permission_classes = [IsAuthenticated, IsStaffOrAbove]

    def get(self, request, emp_id):
        try:
            user = UserProfile.objects.get(emp_id=emp_id)
            queryset = LeaveRequest.objects.filter(user=user)
            serializer = LeaveRequestSerializer(queryset, many=True)
            return Response(serializer.data)
        except UserProfile.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


class LeaveApprovalListView(APIView):
    """GET /Sims/attendances/leave_approval/ — Pending leave for approval."""
    permission_classes = [IsAuthenticated, IsMentorOrAbove]

    def get(self, request):
        profile = request.user.profile
        queryset = LeaveRequest.objects.filter(status='pending')
        if not profile.is_global_admin():
            queryset = queryset.filter(user__entity=profile.entity)
        if profile.role == 'mentor':
            intern_ids = set()
            for team in profile.led_teams.all():
                intern_ids.update(team.interns.values_list('id', flat=True))
            for project in profile.led_projects.all():
                if project.team:
                    intern_ids.update(project.team.interns.values_list('id', flat=True))
            queryset = queryset.filter(user_id__in=intern_ids)
        serializer = LeaveRequestSerializer(queryset, many=True)
        return Response(serializer.data)


class LeaveApprovalView(APIView):
    """PATCH /Sims/attendances/leave_approval/{leaveId}/ — Approve or reject."""
    permission_classes = [IsAuthenticated, IsMentorOrAbove]

    def patch(self, request, leave_id):
        profile = request.user.profile
        if profile.role == 'admin':
            return Response({'error': 'Admins cannot approve leave requests.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            leave = LeaveRequest.objects.get(pk=leave_id)
            new_status = request.data.get('status')
            if new_status not in ('approved', 'rejected'):
                return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

            leave.status = new_status
            leave.approved_by = request.user.profile
            leave.approver_comment = request.data.get('comment', '')
            leave.save()

            return Response(LeaveRequestSerializer(leave).data)
        except LeaveRequest.DoesNotExist:
            return Response({'error': 'Leave not found'}, status=status.HTTP_404_NOT_FOUND)


class LeaveBalanceView(APIView):
    """GET /Sims/attendances/leave_balance/ — Leave balance for current user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = request.user.profile
        # Get entity config for leave quota
        default_quota = {'casual': 12, 'sick': 6, 'personal': 3, 'emergency': 2}
        if profile.entity and hasattr(profile.entity, 'config'):
            config_quota = profile.entity.config.leave_quota or {}
            quota = {**default_quota, **config_quota}
        else:
            quota = default_quota

        # Calculate used leaves this year
        current_year = timezone.now().year
        used = {}
        for leave_type in quota.keys():
            used[leave_type] = LeaveRequest.objects.filter(
                user=profile,
                leave_type=leave_type,
                status='approved',
                start_date__year=current_year,
            ).count()

        balance = {}
        for leave_type, total in quota.items():
            balance[leave_type] = {
                'total': total,
                'used': used.get(leave_type, 0),
                'remaining': total - used.get(leave_type, 0),
            }

        return Response(balance)


class LeaveStatusView(APIView):
    """GET /Sims/leave-status/ — Leave status summary."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = request.user.profile
        queryset = LeaveRequest.objects.filter(user=profile)
        return Response({
            'total': queryset.count(),
            'pending': queryset.filter(status='pending').count(),
            'approved': queryset.filter(status='approved').count(),
            'rejected': queryset.filter(status='rejected').count(),
        })


# =============================================================================
# Attendance Claims
# =============================================================================

class AttendanceClaimListCreateView(APIView):
    """GET/POST /Sims/attendance-claims/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = request.user.profile
        if profile.is_staff_role:
            queryset = AttendanceClaim.objects.all()
            if not profile.is_global_admin():
                queryset = queryset.filter(user__entity=profile.entity)
        else:
            queryset = AttendanceClaim.objects.filter(user=profile)
        serializer = AttendanceClaimSerializer(queryset, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = AttendanceClaimSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user.profile)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MyClaimsView(APIView):
    """GET /Sims/attendance-claims/my-claims/ — Own claims."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = AttendanceClaim.objects.filter(user=request.user.profile)
        serializer = AttendanceClaimSerializer(queryset, many=True)
        return Response(serializer.data)


class PendingClaimsView(APIView):
    """GET /Sims/attendance-claims/pending-approval/ — Claims pending approval."""
    permission_classes = [IsAuthenticated, IsMentorOrAbove]

    def get(self, request):
        profile = request.user.profile
        queryset = AttendanceClaim.objects.filter(status='pending')
        if not profile.is_global_admin():
            queryset = queryset.filter(user__entity=profile.entity)
        if profile.role == 'mentor':
            intern_ids = set()
            for team in profile.led_teams.all():
                intern_ids.update(team.interns.values_list('id', flat=True))
            for project in profile.led_projects.all():
                if project.team:
                    intern_ids.update(project.team.interns.values_list('id', flat=True))
            queryset = queryset.filter(user_id__in=intern_ids)
        serializer = AttendanceClaimSerializer(queryset, many=True)
        return Response(serializer.data)


class ApproveClaimView(APIView):
    """POST /Sims/attendance-claims/{pk}/approve/ — Approve claim."""
    permission_classes = [IsAuthenticated, IsMentorOrAbove]

    def post(self, request, pk):
        try:
            claim = AttendanceClaim.objects.get(pk=pk, status='pending')
            claim.status = 'approved'
            claim.reviewed_by = request.user.profile
            claim.save()

            # Create/update attendance record
            record, _ = AttendanceRecord.objects.get_or_create(
                user=claim.user, date=claim.date,
                defaults={'status': 'present'}
            )
            record.status = 'present'
            if claim.check_in_time:
                record.check_in = timezone.make_aware(
                    datetime.combine(claim.date, claim.check_in_time)
                )
            if claim.check_out_time:
                record.check_out = timezone.make_aware(
                    datetime.combine(claim.date, claim.check_out_time)
                )
            record.calculate_hours()
            record.save()

            return Response({'message': 'Claim approved'})
        except AttendanceClaim.DoesNotExist:
            return Response({'error': 'Claim not found'}, status=status.HTTP_404_NOT_FOUND)


class RejectClaimView(APIView):
    """POST /Sims/attendance-claims/{pk}/reject/ — Reject claim with reason."""
    permission_classes = [IsAuthenticated, IsMentorOrAbove]

    def post(self, request, pk):
        try:
            claim = AttendanceClaim.objects.get(pk=pk, status='pending')
            claim.status = 'rejected'
            claim.reviewed_by = request.user.profile
            claim.reviewer_comment = request.data.get('reason', '')
            claim.save()
            return Response({'message': 'Claim rejected'})
        except AttendanceClaim.DoesNotExist:
            return Response({'error': 'Claim not found'}, status=status.HTTP_404_NOT_FOUND)
