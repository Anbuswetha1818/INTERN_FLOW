"""
AI Exit Summary Views — Powered by Google Gemini
Generates career readiness reports and exit summaries.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from sims.models import UserProfile, Task, Project
from ..utils import call_gemini
from ai_service.views.performance_views import get_intern_metrics, calculate_ai_score
import json


class ExitReportView(APIView):
    """POST|GET /ai/exit-report/{empId}/ — Generate or retrieve exit summary."""
    permission_classes = [IsAuthenticated]

    def get(self, request, emp_id=None):
        profile = request.user.profile
        if emp_id and emp_id != profile.emp_id:
            try:
                profile = UserProfile.objects.get(emp_id=emp_id, entity=request.user.profile.entity)
            except UserProfile.DoesNotExist:
                return Response({'error': 'Intern not found'}, status=404)

        from ..models import AIPerformanceReport
        latest = AIPerformanceReport.objects.filter(intern=profile).first()
        if latest and latest.report_data.get('exit_report'):
            return Response(latest.report_data['exit_report'])
        return Response({'message': 'No exit report generated yet. POST to generate.'})

    def post(self, request, emp_id=None):
        profile = request.user.profile
        if emp_id and emp_id != profile.emp_id:
            try:
                profile = UserProfile.objects.get(emp_id=emp_id, entity=request.user.profile.entity)
            except UserProfile.DoesNotExist:
                return Response({'error': 'Intern not found'}, status=404)

        metrics = get_intern_metrics(profile)
        ai_score = calculate_ai_score(metrics)
        domain = getattr(profile.domain, 'name', 'General')

        completed_tasks = Task.objects.filter(
            assigned_to=profile, status__in=['completed', 'verified']
        ).values('title', 'task_type')

        projects = Project.objects.filter(
            team__interns=profile
        ).values('name', 'status')

        tasks_list = [t['title'] for t in completed_tasks[:10]]
        projects_list = [p['name'] for p in projects[:5]]

        from ..models import AIInterviewSession
        interview_sessions = AIInterviewSession.objects.filter(intern=profile)
        avg_interview_score = 0
        if interview_sessions.exists():
            scores = [s.score for s in interview_sessions if s.score]
            avg_interview_score = round(sum(scores) / len(scores), 1) if scores else 0

        system_prompt = "You are generating a comprehensive professional exit report for an intern. Be thorough and career-focused. Return JSON only."

        prompt = f"""
Generate a comprehensive exit summary and career readiness report. Return JSON:
{{
  "career_readiness_score": <0-100>,
  "internship_overview": "2-3 sentence overview of internship",
  "performance_summary": "paragraph summarizing performance across all metrics",
  "skills_acquired": ["skill1", "skill2", "skill3", "skill4", "skill5"],
  "key_achievements": ["achievement1", "achievement2", "achievement3"],
  "interview_readiness": "paragraph on interview preparation progress",
  "recommended_next_steps": ["step1", "step2", "step3"],
  "recommended_roles": ["role1", "role2"],
  "strengths_for_resume": ["strength1", "strength2", "strength3"],
  "final_recommendation": "Selected|Not Selected|Recommended for Extension"
}}

Intern: {metrics['name']}, Domain: {domain}
Internship: {profile.start_date} to {profile.end_date}
AI Performance Score: {ai_score}/100
Attendance: {metrics['attendance_pct']}%
Task Completion: {metrics['completion_rate']}% ({metrics['completed_tasks']}/{metrics['total_tasks']} tasks)
Completed Tasks: {', '.join(tasks_list) or 'None'}
Projects: {', '.join(projects_list) or 'None'}
Mock Interview Avg Score: {avg_interview_score}/100
Quality Rating: {metrics['quality_rating']}/10
"""
        ai_text = call_gemini(prompt, system_prompt)
        report = {}
        try:
            start = ai_text.find('{')
            end = ai_text.rfind('}') + 1
            if start >= 0:
                report = json.loads(ai_text[start:end])
        except Exception:
            report = {
                'career_readiness_score': ai_score,
                'internship_overview': f'{metrics["name"]} completed internship in {domain}.',
                'performance_summary': f'Overall AI score: {ai_score}/100',
                'skills_acquired': [],
                'key_achievements': [],
                'recommended_next_steps': [],
            }

        return Response(report)
