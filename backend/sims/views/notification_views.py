"""
SIMS — Notification Views
"""
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..models import Notification
from ..serializers import NotificationSerializer


class NotificationListView(APIView):
    """GET /Sims/notifications/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Notification.objects.filter(user=request.user.profile)
        unread_only = request.query_params.get('unread')
        if unread_only:
            qs = qs.filter(is_read=False)
        return Response({
            'notifications': NotificationSerializer(qs[:50], many=True).data,
            'unread_count': Notification.objects.filter(user=request.user.profile, is_read=False).count(),
        })


class MarkNotificationReadView(APIView):
    """PATCH /Sims/notifications/{id}/mark_read/"""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            n = Notification.objects.get(pk=pk, user=request.user.profile)
            n.is_read = True
            n.read_at = timezone.now()
            n.save()
            return Response({'message': 'Marked as read'})
        except Notification.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


class MarkAllReadView(APIView):
    """POST /Sims/notifications/mark_all_read/"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(user=request.user.profile, is_read=False).update(
            is_read=True, read_at=timezone.now()
        )
        return Response({'message': 'All marked as read'})


class CreateNotificationView(APIView):
    """POST /Sims/notifications/create/"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_ids = request.data.get('user_ids', [])
        title = request.data.get('title', 'New Notification')
        message = request.data.get('message', '')
        n_type = request.data.get('type', 'general')

        from ..models import UserProfile
        users = UserProfile.objects.filter(id__in=user_ids)
        for u in users:
            Notification.objects.create(
                user=u,
                title=title,
                message=message,
                notification_type=n_type
            )
        return Response({'message': 'Notifications created'})
