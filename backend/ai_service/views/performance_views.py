"""
AI Performance Analysis Views — Powered by Google Gemini
Generates AI performance scores, narrative reports, and risk flags.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta
from sims.models import UserProfile, Task
from ..models import AIPerformanceReport
from ..utils import call_gemini
import json


def get_intern_metrics(profile):
    """Aggregate all performance metrics for a given intern profile."""
    from sims.models import AttendanceRecord, LeaveRequest
    from django.db.models import Avg

    thirty_days_ago = timezone.now().date() - timedelta(days=30)

    # --- Attendance % ---
    total_days = 30
    present_days = AttendanceRecord.objects.filter(
        user=profile, date__gte=thirty_days_ago, check_in__isnull=False
    ).count()
    attendance_pct = round((present_days / total_days) * 100, 1) if total_days > 0 else 0

    # --- Task metrics ---
    all_tasks = Task.objects.filter(assigned_to=profile, is_deleted=False)
    total_tasks = all_tasks.count()
    completed_tasks = all_tasks.filter(status__in=['completed', 'verified']).count()
    inprogress_tasks = all_tasks.filter(status='inprogress').count()
    todo_tasks = all_tasks.filter(status='todo').count()
    completion_rate = round((completed_tasks / total_tasks) * 100, 1) if total_tasks > 0 else 0
    avg_progress = round(all_tasks.aggregate(avg=Avg('progress'))['avg'] or 0, 1)

    # --- Feedback / Quality rating ---
    from sims.models import Feedback
    feedbacks = Feedback.objects.filter(intern=profile).order_by('-created_at')[:5]
    quality_rating = 0
    if feedbacks.exists():
        scores = [f.performance_score for f in feedbacks if f.performance_score]
        quality_rating = round(sum(scores) / len(scores), 1) if scores else 0

    return {
        'attendance_pct': attendance_pct,
        'present_days': present_days,
        'total_tasks': total_tasks,
        'completed_tasks': completed_tasks,
        'inprogress_tasks': inprogress_tasks,
        'todo_tasks': todo_tasks,
        'completion_rate': completion_rate,
        'avg_progress': avg_progress,
        'quality_rating': quality_rating,
        'domain': getattr(profile.domain, 'name', 'General'),
        'name': profile.full_name,
    }


def calculate_ai_score(metrics):
    """Compute composite AI Performance Score (0-100) per spec."""
    attendance_score = min(metrics['attendance_pct'], 100) * 0.25
    completion_score = min(metrics['completion_rate'], 100) * 0.30
    # Effective hours ratio — using avg_progress as proxy (0-100)
    effective_score = min(metrics['avg_progress'], 100) * 0.20
    # Quality rating: 0-10 scale → normalize to 0-100
    quality_raw = metrics['quality_rating']
    quality_score = (quality_raw / 10 * 100 if quality_raw <= 10 else quality_raw) * 0.25
    return round(attendance_score + completion_score + effective_score + quality_score, 1)


def get_risk_flags(metrics, ai_score):
    """Determine risk flags based on thresholds."""
    flags = []
    if metrics['attendance_pct'] < 75:
        flags.append({'type': 'at_risk', 'label': 'At Risk', 'reason': f"Attendance is only {metrics['attendance_pct']}% (below 75% threshold)"})
    if metrics['total_tasks'] > 0 and metrics['completion_rate'] < 30:
        flags.append({'type': 'disengaged', 'label': 'Disengaged', 'reason': f"Only {metrics['completion_rate']}% task completion rate"})
    if metrics['inprogress_tasks'] > 5:
        flags.append({'type': 'overloaded', 'label': 'Overloaded', 'reason': f"{metrics['inprogress_tasks']} tasks in progress simultaneously"})
    return flags


class PerformanceAnalysisView(APIView):
    """POST /ai/performance-analysis/{empId}/ — Generate AI performance report."""
    permission_classes = [IsAuthenticated]

    def post(self, request, emp_id=None):
        profile = request.user.profile
        # Resolve target intern
        if emp_id and emp_id != profile.emp_id:
            try:
                profile = UserProfile.objects.get(emp_id=emp_id, entity=request.user.profile.entity)
            except UserProfile.DoesNotExist:
                return Response({'error': 'Intern not found'}, status=404)

        metrics = get_intern_metrics(profile)
        ai_score = calculate_ai_score(metrics)
        risk_flags = get_risk_flags(metrics, ai_score)

        system_prompt = (
            "You are an expert HR performance analyst for an intern management platform called SIMS. "
            "Analyze intern performance data and give a professional, constructive, data-driven report. "
            "Be specific, encouraging but honest. Respond with a valid JSON object only."
        )

        user_prompt = f"""
Analyze this intern's performance and return a JSON report with these exact keys:
{{
  "executive_summary": "2-3 sentence overview",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "areas_for_improvement": ["area 1", "area 2"],
  "attendance_analysis": "paragraph about attendance patterns",
  "task_efficiency_trend": "paragraph about task performance",
  "recommended_actions_for_intern": ["action 1", "action 2", "action 3"],
  "recommended_actions_for_mentor": ["action 1", "action 2"]
}}

Intern Data:
- Name: {metrics['name']}
- Domain: {metrics['domain']}
- Attendance (last 30 days): {metrics['attendance_pct']}% ({metrics['present_days']}/30 days)
- Total Tasks: {metrics['total_tasks']}
- Completed Tasks: {metrics['completed_tasks']}
- In Progress: {metrics['inprogress_tasks']}
- Task Completion Rate: {metrics['completion_rate']}%
- Average Task Progress: {metrics['avg_progress']}%
- Quality Rating (mentor feedback avg): {metrics['quality_rating']}/10
- AI Performance Score: {ai_score}/100
"""
        ai_text = call_gemini(user_prompt, system_prompt)

        # Parse JSON from AI response
        report_data = {}
        try:
            # Extract JSON from response
            start = ai_text.find('{')
            end = ai_text.rfind('}') + 1
            if start >= 0 and end > start:
                report_data = json.loads(ai_text[start:end])
        except Exception:
            report_data = {'executive_summary': ai_text}

        # Save report
        AIPerformanceReport.objects.create(
            intern=profile,
            report_data={**report_data, 'metrics': metrics},
            ai_score=ai_score
        )

        return Response({
            'ai_score': ai_score,
            'risk_flags': risk_flags,
            'metrics': metrics,
            'report': report_data
        })


class PerformanceReportView(APIView):
    """GET /ai/performance-report/{empId}/ — Get latest cached report."""
    permission_classes = [IsAuthenticated]

    def get(self, request, emp_id=None):
        profile = request.user.profile
        if emp_id and emp_id != profile.emp_id:
            try:
                profile = UserProfile.objects.get(emp_id=emp_id, entity=request.user.profile.entity)
            except UserProfile.DoesNotExist:
                return Response({'error': 'Intern not found'}, status=404)

        # Return latest report if exists and less than 24 hours old
        latest = AIPerformanceReport.objects.filter(intern=profile).first()
        if latest:
            age = timezone.now() - latest.generated_at
            if age.total_seconds() < 86400:  # 24 hours
                metrics = get_intern_metrics(profile)
                ai_score = latest.ai_score
                risk_flags = get_risk_flags(metrics, ai_score)
                return Response({
                    'ai_score': ai_score,
                    'risk_flags': risk_flags,
                    'metrics': latest.report_data.get('metrics', metrics),
                    'report': {k: v for k, v in latest.report_data.items() if k != 'metrics'},
                    'cached': True,
                    'generated_at': latest.generated_at
                })

        # No recent report — compute basic score on the fly
        metrics = get_intern_metrics(profile)
        ai_score = calculate_ai_score(metrics)
        risk_flags = get_risk_flags(metrics, ai_score)
        return Response({
            'ai_score': ai_score,
            'risk_flags': risk_flags,
            'metrics': metrics,
            'report': None,
            'cached': False
        })
