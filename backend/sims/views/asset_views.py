"""
SIMS — Asset Management Views
"""
from django.db.models import Count
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..models import Asset, AssetIssue, AssetHistory, UserProfile
from ..serializers import AssetSerializer, AssetIssueSerializer, AssetHistorySerializer
from ..permissions import IsManagerOrAbove, IsStaffOrAbove


class AssetListCreateView(APIView):
    """GET/POST /Sims/assert-stock/ — Staff and Admin/Manager access."""
    permission_classes = [IsAuthenticated, IsStaffOrAbove]

    def get(self, request):
        profile = request.user.profile
        queryset = Asset.objects.filter(is_deleted=False)
        if not profile.is_global_admin():
            queryset = queryset.filter(entity=profile.entity)
        for p, f in [('type', 'asset_type'), ('status', 'status'), ('condition', 'condition')]:
            v = request.query_params.get(p)
            if v:
                queryset = queryset.filter(**{f: v})
        return Response(AssetSerializer(queryset, many=True).data)

    def post(self, request):
        serializer = AssetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(entity=request.user.profile.entity)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AssetDetailView(APIView):
    """GET/PATCH/DELETE /Sims/assert-stock/{pk}/ — Staff and Admin/Manager access."""
    permission_classes = [IsAuthenticated, IsStaffOrAbove]

    def get(self, request, pk):
        try:
            return Response(AssetSerializer(Asset.objects.get(pk=pk, is_deleted=False)).data)
        except Asset.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, pk):
        try:
            asset = Asset.objects.get(pk=pk, is_deleted=False)
            old_data = AssetSerializer(asset).data
            serializer = AssetSerializer(asset, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            AssetHistory.objects.create(
                asset=asset, action='updated', performed_by=request.user.profile,
                user=asset.assigned_to, old_value=old_data, new_value=serializer.data
            )
            return Response(serializer.data)
        except Asset.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        try:
            asset = Asset.objects.get(pk=pk)
            asset.delete()
            return Response({'message': 'Deleted'})
        except Asset.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


class AssetCountView(APIView):
    """GET /Sims/assert-stock-count/ — Staff, Manager and Admin."""
    permission_classes = [IsAuthenticated, IsStaffOrAbove]

    def get(self, request):
        profile = request.user.profile
        qs = Asset.objects.filter(is_deleted=False)
        if not profile.is_global_admin():
            qs = qs.filter(entity=profile.entity)
        return Response({
            'total': qs.count(), 'available': qs.filter(status='available').count(),
            'assigned': qs.filter(status='assigned').count(), 'damaged': qs.filter(status='damaged').count(),
            'lost': qs.filter(status='lost').count(),
            'by_type': list(qs.values('asset_type').annotate(count=Count('id'))),
        })


class AssetTrendView(APIView):
    """GET /Sims/asset-trend/ — Staff, Manager and Admin."""
    permission_classes = [IsAuthenticated, IsStaffOrAbove]

    def get(self, request):
        from datetime import timedelta
        from django.utils import timezone
        data = []
        for i in range(5, -1, -1):
            d = timezone.now().date().replace(day=1) - timedelta(days=i * 30)
            count = Asset.objects.filter(created_at__year=d.year, created_at__month=d.month, is_deleted=False).count()
            data.append({'month': d.strftime('%b %Y'), 'count': count})
        return Response(data)


class AvailableAssetsView(APIView):
    """GET /Sims/available-assets/ — Staff, Manager and Admin."""
    permission_classes = [IsAuthenticated, IsStaffOrAbove]

    def get(self, request):
        return Response({'count': Asset.objects.filter(status='available', is_deleted=False).count()})


class AssetLookupView(APIView):
    """GET /Sims/asset-lookup/{code}/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, code):
        try:
            return Response(AssetSerializer(Asset.objects.get(asset_code=code, is_deleted=False)).data)
        except Asset.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


class AssetLogsView(APIView):
    """GET /Sims/asset-logs/ — Manager and Admin only."""
    permission_classes = [IsAuthenticated, IsManagerOrAbove]

    def get(self, request):
        return Response(AssetHistorySerializer(AssetHistory.objects.all()[:200], many=True).data)


class AssetHistoryView(APIView):
    """GET /Sims/asserthistory/ — Manager and Admin only."""
    permission_classes = [IsAuthenticated, IsManagerOrAbove]

    def get(self, request):
        return Response(AssetHistorySerializer(AssetHistory.objects.all()[:200], many=True).data)


class AssetUserHistoryView(APIView):
    """GET /Sims/assertuserhistory/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = AssetHistory.objects.filter(user=request.user.profile)
        return Response(AssetHistorySerializer(qs, many=True).data)


class AssetIssueListCreateView(APIView):
    """GET/POST /Sims/assert-issue/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(AssetIssueSerializer(AssetIssue.objects.all()[:100], many=True).data)

    def post(self, request):
        serializer = AssetIssueSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(reported_by=request.user.profile)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AssetReplacementView(APIView):
    """GET /Sims/assert-issue/{pk}/replacement-assets/ — Manager and Admin only."""
    permission_classes = [IsAuthenticated, IsManagerOrAbove]

    def get(self, request, pk):
        try:
            issue = AssetIssue.objects.get(pk=pk)
            available = Asset.objects.filter(asset_type=issue.asset.asset_type, status='available', is_deleted=False)
            return Response(AssetSerializer(available, many=True).data)
        except AssetIssue.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


class AssetAssignReplacementView(APIView):
    """POST /Sims/assert-issue/{pk}/assign-new-asset/ — Manager and Admin only."""
    permission_classes = [IsAuthenticated, IsManagerOrAbove]

    def post(self, request, pk):
        try:
            issue = AssetIssue.objects.get(pk=pk)
            new_asset = Asset.objects.get(pk=request.data.get('asset_id'))
            new_asset.assigned_to = issue.asset.assigned_to
            new_asset.status = 'assigned'
            new_asset.save()
            issue.replacement_asset = new_asset
            issue.status = 'replaced'
            issue.save()
            return Response({'message': 'Replacement assigned'})
        except (AssetIssue.DoesNotExist, Asset.DoesNotExist):
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
