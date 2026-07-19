"""
Forms & Surveys — Views
"""
from django.db.models import Count
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Form, FormSection, FormQuestion, FormResponse, ResponseComment
from .serializers import (
    FormSerializer, FormQuestionSerializer, FormSectionSerializer,
    FormResponseSerializer, ResponseCommentSerializer,
)


class FormListCreateView(APIView):
    """GET/POST /api/forms/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = request.user.profile
        qs = Form.objects.all()
        if profile.role != 'superadmin':
            qs = qs.filter(entity=profile.entity)
        return Response(FormSerializer(qs, many=True).data)

    def post(self, request):
        serializer = FormSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        form = serializer.save(
            created_by=request.user.profile,
            entity=request.user.profile.entity
        )
        # Create questions
        questions = request.data.get('questions', [])
        for i, q in enumerate(questions):
            FormQuestion.objects.create(
                form=form, question_text=q.get('question_text', ''),
                question_type=q.get('question_type', 'text'),
                options=q.get('options', []),
                is_required=q.get('is_required', False), order=i
            )
        return Response(FormSerializer(form).data, status=status.HTTP_201_CREATED)


class FormDetailView(APIView):
    """GET/PATCH/DELETE /api/forms/{id}/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            return Response(FormSerializer(Form.objects.get(pk=pk)).data)
        except Form.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, pk):
        try:
            form = Form.objects.get(pk=pk)
            serializer = FormSerializer(form, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        except Form.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        try:
            Form.objects.get(pk=pk).delete()
            return Response({'message': 'Deleted'})
        except Form.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


class FormBannerUploadView(APIView):
    """POST /api/forms/{id}/upload_banner/"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            form = Form.objects.get(pk=pk)
            form.banner = request.FILES.get('banner')
            form.save()
            return Response({'message': 'Banner uploaded'})
        except Form.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


class FormAnalyticsView(APIView):
    """GET /api/forms/{id}/analytics/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            form = Form.objects.get(pk=pk)
            responses = form.responses.all()
            analytics = {
                'total_responses': responses.count(),
                'consult_count': responses.filter(is_consult=True).count(),
            }
            # Aggregate answers per question
            for q in form.questions.all():
                q_id = str(q.id)
                answers = [r.answers.get(q_id) for r in responses if q_id in r.answers]
                analytics[f'question_{q.id}'] = {
                    'question': q.question_text,
                    'type': q.question_type,
                    'answer_count': len(answers),
                }
            return Response(analytics)
        except Form.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


class FormResponsesView(APIView):
    """GET /api/forms/{id}/responses/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            form = Form.objects.get(pk=pk)
            return Response(FormResponseSerializer(form.responses.all(), many=True).data)
        except Form.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


class PublicFeedbackView(APIView):
    """GET/POST /api/public/feedback/{formId}/ — Public form submission."""
    permission_classes = [AllowAny]

    def get(self, request, form_id):
        try:
            form = Form.objects.get(pk=form_id, is_public=True, is_active=True)
            return Response(FormSerializer(form).data)
        except Form.DoesNotExist:
            return Response({'error': 'Form not found or not public'}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request, form_id):
        try:
            form = Form.objects.get(pk=form_id, is_public=True, is_active=True)
            response = FormResponse.objects.create(
                form=form,
                respondent_name=request.data.get('respondent_name', ''),
                respondent_email=request.data.get('respondent_email', ''),
                answers=request.data.get('answers', {}),
            )
            return Response({'message': 'Response submitted', 'id': response.pk}, status=status.HTTP_201_CREATED)
        except Form.DoesNotExist:
            return Response({'error': 'Form not found'}, status=status.HTTP_404_NOT_FOUND)


class ToggleConsultView(APIView):
    """PATCH /api/responses/{responseId}/consult/"""
    permission_classes = [IsAuthenticated]

    def patch(self, request, response_id):
        try:
            resp = FormResponse.objects.get(pk=response_id)
            resp.is_consult = not resp.is_consult
            resp.save()
            return Response({'is_consult': resp.is_consult})
        except FormResponse.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


class ResponseCommentView(APIView):
    """GET/POST /api/responses/{responseId}/comments/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, response_id):
        try:
            resp = FormResponse.objects.get(pk=response_id)
            return Response(ResponseCommentSerializer(resp.comments.all(), many=True).data)
        except FormResponse.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request, response_id):
        try:
            resp = FormResponse.objects.get(pk=response_id)
            comment = ResponseComment.objects.create(
                response=resp,
                author=request.user.profile,
                content=request.data.get('content', '')
            )
            return Response(ResponseCommentSerializer(comment).data, status=status.HTTP_201_CREATED)
        except FormResponse.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
