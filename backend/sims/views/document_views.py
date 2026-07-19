"""
SIMS — Document Management Views
"""
from django.http import FileResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..models import Document, UserProfile
from ..serializers import DocumentSerializer
from ..permissions import IsStaffOrAbove


class DocumentListCreateView(APIView):
    """GET/POST /Sims/documents/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = request.user.profile
        if profile.role == 'intern':
            qs = Document.objects.filter(user=profile, is_deleted=False)
        else:
            qs = Document.objects.filter(is_deleted=False)
            if not profile.is_global_admin():
                qs = qs.filter(entity=profile.entity)
        return Response(DocumentSerializer(qs, many=True).data)

    def post(self, request):
        serializer = DocumentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user.profile, entity=request.user.profile.entity)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class DocumentDetailView(APIView):
    """GET/PATCH/DELETE /Sims/documents/{pk}/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            return Response(DocumentSerializer(Document.objects.get(pk=pk, is_deleted=False)).data)
        except Document.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, pk):
        try:
            doc = Document.objects.get(pk=pk, is_deleted=False)
            serializer = DocumentSerializer(doc, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        except Document.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        try:
            doc = Document.objects.get(pk=pk)
            doc.is_deleted = True
            doc.save()
            return Response({'message': 'Deleted'})
        except Document.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


class DocumentsByUserView(APIView):
    """GET /Sims/documents/emp/{empId}/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, emp_id):
        try:
            user = UserProfile.objects.get(emp_id=emp_id)
            qs = Document.objects.filter(user=user, is_deleted=False)
            return Response(DocumentSerializer(qs, many=True).data)
        except UserProfile.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


class DocumentDownloadView(APIView):
    """GET /Sims/documents/{pk}/download/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            doc = Document.objects.get(pk=pk, is_deleted=False)
            return FileResponse(doc.file.open('rb'), as_attachment=True, filename=doc.file.name.split('/')[-1])
        except (Document.DoesNotExist, FileNotFoundError):
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


class ApproveDocumentView(APIView):
    """POST /Sims/approve-document/{pk}/"""
    permission_classes = [IsAuthenticated, IsStaffOrAbove]

    def post(self, request, pk):
        try:
            doc = Document.objects.get(pk=pk)
            doc.status = 'approved'
            doc.reviewed_by = request.user.profile
            doc.reviewed_at = timezone.now()
            doc.save()
            return Response({'message': 'Approved'})
        except Document.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


class RejectDocumentView(APIView):
    """POST /Sims/reject-document/{pk}/"""
    permission_classes = [IsAuthenticated, IsStaffOrAbove]

    def post(self, request, pk):
        try:
            doc = Document.objects.get(pk=pk)
            doc.status = 'rejected'
            doc.reviewed_by = request.user.profile
            doc.reviewed_at = timezone.now()
            doc.reviewer_comment = request.data.get('comment', '')
            doc.save()
            return Response({'message': 'Rejected'})
        except Document.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


class InternApprovalDashboardView(APIView):
    """GET /Sims/intern-approval-dashboard/"""
    permission_classes = [IsAuthenticated, IsStaffOrAbove]

    def get(self, request):
        profile = request.user.profile
        interns = UserProfile.objects.filter(role='intern', is_deleted=False)
        if not profile.is_global_admin():
            interns = interns.filter(entity=profile.entity)
        result = []
        for intern in interns:
            docs = intern.documents.filter(is_deleted=False)
            pending = docs.filter(status='pending').count()
            if pending > 0:
                result.append({
                    'emp_id': intern.emp_id, 'full_name': intern.full_name,
                    'total_docs': docs.count(), 'pending': pending,
                    'approved': docs.filter(status='approved').count(),
                    'rejected': docs.filter(status='rejected').count(),
                })
        return Response(result)
