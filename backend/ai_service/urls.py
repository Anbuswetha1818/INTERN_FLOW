"""
AI Service — URL Configuration
All /ai/ endpoints powered by Google Gemini API.
"""
from django.urls import path
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .views.chat_views import ChatViews
from .views.performance_views import PerformanceAnalysisView, PerformanceReportView
from .views.interview_views import InterviewStartView, InterviewAnswerView, InterviewReportView, InterviewHistoryView
from .views.resume_views import ResumeGenerateView, ResumeEvaluateView, ResumeSectionImproveView, ResumeGetView
from .views.task_ai_views import TaskSuggestView, TaskDecomposeView, TaskFeedbackAIView
from .views.learning_views import LearningPathGenerateView, LearningPathGetView, QuizGenerateView
from .views.exit_views import ExitReportView


class AIHealthCheckView(APIView):
    """GET /ai/health/ — AI service health check."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.conf import settings
        return Response({
            'status': 'ok',
            'model': getattr(settings, 'AI_MODEL', 'gemini-flash-latest'),
            'api_key_configured': bool(getattr(settings, 'GEMINI_API_KEY', '')),
            'provider': 'Google Gemini',
        })


class InternListAIScoresView(APIView):
    """GET /ai/intern-scores/ — Get AI scores + risk flags for all interns (Mentor/Lead view)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from sims.models import UserProfile
        from .views.performance_views import get_intern_metrics, calculate_ai_score, get_risk_flags

        profile = request.user.profile

        interns = UserProfile.objects.filter(role='intern', is_deleted=False, entity=profile.entity)

        # Domain scoping for SME
        if profile.role == 'sme':
            interns = interns.filter(domain=profile.domain)

        # Mentor scoping
        if profile.role == 'mentor':
            mentor_teams = profile.led_teams.all()
            intern_ids = []
            for team in mentor_teams:
                intern_ids.extend(team.interns.values_list('id', flat=True))
            interns = interns.filter(id__in=intern_ids)

        results = []
        for intern in interns[:50]:  # cap at 50 to avoid timeout
            try:
                metrics = get_intern_metrics(intern)
                ai_score = calculate_ai_score(metrics)
                risk_flags = get_risk_flags(metrics, ai_score)
                results.append({
                    'emp_id': intern.emp_id,
                    'full_name': intern.full_name,
                    'ai_score': ai_score,
                    'risk_flags': risk_flags,
                    'attendance_pct': metrics['attendance_pct'],
                    'completion_rate': metrics['completion_rate'],
                    'quality_rating': metrics['quality_rating'],
                })
            except Exception:
                results.append({'emp_id': intern.emp_id, 'full_name': intern.full_name, 'ai_score': None, 'risk_flags': []})

        return Response({'scores': results})


urlpatterns = [
    # Health
    path('health/', AIHealthCheckView.as_view(), name='ai-health'),

    # Chat
    path('chat/', ChatViews.as_view(), name='ai-chat'),

    # Performance Analysis
    path('performance-analysis/<str:emp_id>/', PerformanceAnalysisView.as_view(), name='ai-performance-analysis'),
    path('performance-analysis/', PerformanceAnalysisView.as_view(), name='ai-performance-analysis-self'),
    path('performance-report/<str:emp_id>/', PerformanceReportView.as_view(), name='ai-performance-report'),
    path('performance-report/', PerformanceReportView.as_view(), name='ai-performance-report-self'),

    # Intern AI Scores (bulk — for Mentor/Lead dashboard)
    path('intern-scores/', InternListAIScoresView.as_view(), name='ai-intern-scores'),

    # Mock Interview
    path('interview/start/', InterviewStartView.as_view(), name='ai-interview-start'),
    path('interview/answer/<int:session_id>/', InterviewAnswerView.as_view(), name='ai-interview-answer'),
    path('interview/report/<int:session_id>/', InterviewReportView.as_view(), name='ai-interview-report'),
    path('interview/history/', InterviewHistoryView.as_view(), name='ai-interview-history'),
    path('interview/history/<str:emp_id>/', InterviewHistoryView.as_view(), name='ai-interview-history-emp'),

    # Resume
    path('resume/generate/', ResumeGenerateView.as_view(), name='ai-resume-generate'),
    path('resume/generate/<str:emp_id>/', ResumeGenerateView.as_view(), name='ai-resume-generate-emp'),
    path('resume/evaluate/', ResumeEvaluateView.as_view(), name='ai-resume-evaluate'),
    path('resume/evaluation/', ResumeGetView.as_view(), name='ai-resume-evaluation'),
    path('resume/evaluation/<str:emp_id>/', ResumeGetView.as_view(), name='ai-resume-evaluation-emp'),
    path('resume/section/<str:section>/', ResumeSectionImproveView.as_view(), name='ai-resume-section'),

    # Learning Path
    path('learning-path/generate/', LearningPathGenerateView.as_view(), name='ai-learning-path-generate'),
    path('learning-path/generate/<str:emp_id>/', LearningPathGenerateView.as_view(), name='ai-learning-path-generate-emp'),
    path('learning-path/', LearningPathGetView.as_view(), name='ai-learning-path'),
    path('learning-path/<str:emp_id>/', LearningPathGetView.as_view(), name='ai-learning-path-emp'),

    # Quiz
    path('quiz/generate/<int:task_id>/', QuizGenerateView.as_view(), name='ai-quiz-generate'),

    # Task AI
    path('tasks/suggest/', TaskSuggestView.as_view(), name='ai-tasks-suggest'),
    path('tasks/decompose/', TaskDecomposeView.as_view(), name='ai-tasks-decompose'),

    # Feedback Draft
    path('feedback/draft/<str:emp_id>/', TaskFeedbackAIView.as_view(), name='ai-feedback-draft'),

    # Exit Report
    path('exit-report/', ExitReportView.as_view(), name='ai-exit-report'),
    path('exit-report/<str:emp_id>/', ExitReportView.as_view(), name='ai-exit-report-emp'),
]
