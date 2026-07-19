"""
SIMS — Activity Log Views
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..models import ActivityLog, UserProfile
from ..serializers import ActivityLogSerializer
from ..permissions import IsSuperAdminOrManager


class ActivityLogListView(APIView):
    """GET /Sims/logs/ — All activity logs."""
    permission_classes = [IsAuthenticated, IsSuperAdminOrManager]

    def get(self, request):
        profile = request.user.profile
        qs = ActivityLog.objects.all()
        if not profile.is_global_admin():
            qs = qs.filter(entity=profile.entity)
        return Response(ActivityLogSerializer(qs[:500], many=True).data)


class ActivityLogByUserView(APIView):
    """GET /Sims/logs/{empId}/ — Per-intern activity log."""
    permission_classes = [IsAuthenticated]

    def get(self, request, emp_id):
        try:
            user = UserProfile.objects.get(emp_id=emp_id)
            qs = ActivityLog.objects.filter(user=user)
            return Response(ActivityLogSerializer(qs[:200], many=True).data)
        except UserProfile.DoesNotExist:
            from rest_framework import status
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
