"""
SIMS — Feedback & Performance Views
"""
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..models import Feedback, StudentStaffFeedback, UserProfile, AttendanceRecord, Task
from ..serializers import FeedbackSerializer, StudentStaffFeedbackSerializer
from ..permissions import IsStaffOrAbove, IsMentorOrAbove

from django.db.models import Avg, Count, Q
from datetime import timedelta
from django.utils import timezone


class FeedbackListCreateView(APIView):
    """GET/POST /Sims/feedback/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = request.user.profile
        if profile.role == 'intern':
            qs = Feedback.objects.filter(intern=profile)
        else:
            qs = Feedback.objects.all()
            if not profile.is_global_admin():
                qs = qs.filter(entity=profile.entity)
        return Response(FeedbackSerializer(qs, many=True).data)

    def post(self, request):
        serializer = FeedbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(reviewer=request.user.profile, entity=request.user.profile.entity)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class FeedbackDetailView(APIView):
    """GET/PATCH/DELETE /Sims/feedback/{id}/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            return Response(FeedbackSerializer(Feedback.objects.get(pk=pk)).data)
        except Feedback.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, pk):
        try:
            fb = Feedback.objects.get(pk=pk)
            serializer = FeedbackSerializer(fb, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        except Feedback.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        try:
            Feedback.objects.get(pk=pk).delete()
            return Response({'message': 'Deleted'})
        except Feedback.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


class PerformanceView(APIView):
    """GET /Sims/performance/ — Performance overview for current user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = request.user.profile
        emp_id = request.query_params.get('emp_id', profile.emp_id)
        try:
            target = UserProfile.objects.get(emp_id=emp_id)
        except UserProfile.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        # Attendance %
        att = AttendanceRecord.objects.filter(user=target)
        total_days = att.count()
        present = att.filter(status='present').count()
        att_pct = round((present / total_days * 100), 1) if total_days > 0 else 0

        # Task completion rate
        tasks = target.assigned_tasks.filter(is_deleted=False)
        total_tasks = tasks.count()
        completed_tasks = tasks.filter(status__in=['completed', 'verified']).count()
        task_rate = round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0

        # Quality rating
        feedback = Feedback.objects.filter(intern=target)
        quality = feedback.aggregate(avg=Avg('quality_score'))['avg'] or 0

        # Effective hours ratio
        total_login = att.aggregate(s=Avg('total_hours'))['s'] or 0
        effective = att.aggregate(s=Avg('effective_hours'))['s'] or 0
        hours_ratio = round((effective / total_login * 100), 1) if total_login > 0 else 0

        return Response({
            'emp_id': emp_id,
            'full_name': target.full_name,
            'attendance_percentage': att_pct,
            'task_completion_rate': task_rate,
            'effective_hours_ratio': hours_ratio,
            'quality_rating': round(quality, 1),
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'total_attendance_days': total_days,
            'present_days': present,
            'feedback_count': feedback.count(),
        })


class MonthlyPerformanceView(APIView):
    """GET /Sims/api/intern/monthly-performance/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = request.user.profile
        data = []
        for i in range(5, -1, -1):
            d = timezone.now().date().replace(day=1) - timedelta(days=i * 30)
            att = AttendanceRecord.objects.filter(
                user=profile, date__year=d.year, date__month=d.month
            )
            total = att.count()
            present = att.filter(status='present').count()
            data.append({
                'month': d.strftime('%b %Y'),
                'attendance_pct': round((present / total * 100), 1) if total > 0 else 0,
                'present': present,
                'total': total,
            })
        return Response(data)


class StudentStaffFeedbackView(APIView):
    """POST /Sims/student-staff-feedback/"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = StudentStaffFeedbackSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(intern=request.user.profile)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def get(self, request):
        profile = request.user.profile
        if profile.role == 'intern':
            qs = StudentStaffFeedback.objects.filter(intern=profile)
        else:
            qs = StudentStaffFeedback.objects.filter(staff=profile)
        return Response(StudentStaffFeedbackSerializer(qs, many=True).data)
