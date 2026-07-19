"""
AI Task Suggestion Views — Powered by Google Gemini
Smart task description, decomposition, SLA estimation.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from sims.models import Task, UserProfile
from ..utils import call_gemini
import json


class TaskSuggestView(APIView):
    """POST /ai/tasks/suggest/ — Suggest task description, priority, SLA from title."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        title = request.data.get('title', '')
        project_name = request.data.get('project_name', '')
        domain = getattr(request.user.profile.domain, 'name', 'General')

        if not title:
            return Response({'error': 'Task title is required'}, status=400)

        system_prompt = f"You are a technical project manager for a {domain} internship program. Return JSON only."
        prompt = f"""
Given this task title, generate professional task details. Return JSON:
{{
  "description": "detailed professional task description (3-4 sentences)",
  "priority": "low|medium|high",
  "suggested_sla_hours": <number>,
  "task_type": "learning|project|custom",
  "subtasks": ["subtask 1", "subtask 2", "subtask 3"],
  "skills_required": ["skill1", "skill2"],
  "acceptance_criteria": ["criterion 1", "criterion 2"]
}}

Task Title: {title}
Project: {project_name}
Domain: {domain}
"""
        ai_text = call_gemini(prompt, system_prompt)
        suggestion = {}
        try:
            start = ai_text.find('{')
            end = ai_text.rfind('}') + 1
            if start >= 0:
                suggestion = json.loads(ai_text[start:end])
        except Exception:
            suggestion = {'description': ai_text[:500], 'priority': 'medium', 'suggested_sla_hours': 8}

        return Response(suggestion)


class TaskDecomposeView(APIView):
    """POST /ai/tasks/decompose/ — Break high-level task into specific subtasks."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        task_description = request.data.get('description', '')
        domain = getattr(request.user.profile.domain, 'name', 'General')

        system_prompt = "You are a technical project manager. Break tasks into specific, measurable subtasks. Return JSON only."
        prompt = f"""
Decompose this high-level task into 4-7 specific, measurable subtasks. Return JSON:
{{
  "subtasks": [
    {{"title": "subtask title", "description": "what to do", "estimated_hours": <number>, "order": 1}},
    {{"title": "subtask title", "description": "what to do", "estimated_hours": <number>, "order": 2}}
  ]
}}

Task: {task_description}
Domain: {domain}
"""
        ai_text = call_gemini(prompt, system_prompt)
        decomposition = {}
        try:
            start = ai_text.find('{')
            end = ai_text.rfind('}') + 1
            if start >= 0:
                decomposition = json.loads(ai_text[start:end])
        except Exception:
            decomposition = {'subtasks': [{'title': 'Research & Planning', 'description': 'Research the requirements', 'estimated_hours': 2, 'order': 1}]}

        return Response(decomposition)


class TaskFeedbackAIView(APIView):
    """POST /ai/feedback/draft/{empId}/ — AI draft feedback from intern metrics."""
    permission_classes = [IsAuthenticated]

    def post(self, request, emp_id):
        try:
            profile = UserProfile.objects.get(emp_id=emp_id)
        except UserProfile.DoesNotExist:
            return Response({'error': 'Intern not found'}, status=404)

        from ai_service.views.performance_views import get_intern_metrics
        metrics = get_intern_metrics(profile)

        system_prompt = "You are a mentor writing constructive, specific, data-backed feedback for an intern. Be professional, encouraging, and honest."
        prompt = f"""
Write a comprehensive mentor feedback for this intern based on their performance data.
Include: performance summary, specific strengths, areas for improvement, and a recommendation.
Keep it professional but personalized. Aim for 150-200 words.

Intern: {metrics['name']}
Domain: {metrics['domain']}
Attendance: {metrics['attendance_pct']}%
Task Completion Rate: {metrics['completion_rate']}%
Tasks Completed: {metrics['completed_tasks']}/{metrics['total_tasks']}
Average Progress: {metrics['avg_progress']}%
Quality Rating: {metrics['quality_rating']}/10
"""
        draft = call_gemini(prompt, system_prompt)
        return Response({'draft': draft.strip(), 'metrics': metrics})
