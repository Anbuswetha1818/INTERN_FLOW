"""
AI Learning Path Views — Powered by Google Gemini
Generates personalized learning paths and skill gap analysis.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from sims.models import UserProfile, Task
from ..models import AILearningPath
from ..utils import call_gemini
import json

DOMAIN_COMPETENCIES = {
    'Full Stack': ['React', 'Django', 'REST APIs', 'JavaScript', 'Python', 'SQL', 'Git', 'HTML/CSS', 'Authentication', 'Deployment'],
    'Data Science': ['Python', 'pandas', 'numpy', 'Machine Learning', 'Data Visualization', 'SQL', 'Statistics', 'scikit-learn', 'Jupyter', 'Feature Engineering'],
    'DevOps': ['Docker', 'Kubernetes', 'CI/CD', 'Linux', 'AWS/GCP', 'Terraform', 'Monitoring', 'Scripting', 'Networking', 'Security'],
    'Frontend': ['React', 'JavaScript', 'HTML5', 'CSS3', 'TypeScript', 'Responsive Design', 'Performance', 'Testing', 'Git', 'APIs'],
    'Backend': ['Django', 'REST APIs', 'PostgreSQL', 'Authentication', 'Caching', 'Microservices', 'Testing', 'Docker', 'Security', 'Message Queues'],
    'General': ['Python', 'Problem Solving', 'Git', 'Communication', 'Agile', 'Databases', 'APIs', 'Testing', 'Documentation', 'Linux Basics'],
}


class LearningPathGenerateView(APIView):
    """POST /ai/learning-path/generate/{empId}/ — Generate personalized learning path."""
    permission_classes = [IsAuthenticated]

    def post(self, request, emp_id=None):
        profile = request.user.profile
        if emp_id and emp_id != profile.emp_id:
            try:
                profile = UserProfile.objects.get(emp_id=emp_id, entity=request.user.profile.entity)
            except UserProfile.DoesNotExist:
                return Response({'error': 'Intern not found'}, status=404)

        domain = getattr(profile.domain, 'name', 'General')
        required_skills = DOMAIN_COMPETENCIES.get(domain, DOMAIN_COMPETENCIES['General'])

        # Get completed learning tasks
        completed_learning = Task.objects.filter(
            assigned_to=profile, task_type='learning', status__in=['completed', 'verified']
        ).values_list('title', flat=True)

        all_learning = Task.objects.filter(
            assigned_to=profile, task_type='learning'
        ).values('title', 'status', 'progress')

        system_prompt = (
            "You are a curriculum designer creating a personalized learning path for an intern. "
            "Be specific, practical, and create an ordered path. Return JSON only."
        )

        prompt = f"""
Create a personalized learning path for this intern. Return JSON:
{{
  "skill_gap_analysis": {{
    "current_skills": ["skill1", "skill2"],
    "missing_skills": ["skill1", "skill2", "skill3"],
    "domain_readiness_score": <0-100>
  }},
  "learning_path": [
    {{
      "order": 1,
      "module_name": "module name",
      "skills_covered": ["skill1", "skill2"],
      "description": "what intern will learn",
      "resources": [
        {{"type": "read|watch|practice", "title": "resource title", "url_hint": "search term"}}
      ],
      "estimated_hours": <number>,
      "prerequisite_order": null
    }}
  ],
  "total_estimated_hours": <number>,
  "recommended_pace": "X hours per week",
  "completion_timeline": "X weeks"
}}

Intern: {profile.full_name}, Domain: {domain}
Required skills for {domain}: {', '.join(required_skills)}
Completed learning tasks: {', '.join(list(completed_learning)) or 'None yet'}
All learning tasks: {json.dumps(list(all_learning))[:500]}
"""
        ai_text = call_gemini(prompt, system_prompt)
        path_data = {}
        try:
            start = ai_text.find('{')
            end = ai_text.rfind('}') + 1
            if start >= 0:
                path_data = json.loads(ai_text[start:end])
        except Exception:
            path_data = {
                'skill_gap_analysis': {'current_skills': [], 'missing_skills': required_skills[:3], 'domain_readiness_score': 30},
                'learning_path': [{'order': 1, 'module_name': f'{domain} Fundamentals', 'skills_covered': required_skills[:2], 'description': 'Core concepts', 'resources': [], 'estimated_hours': 10, 'prerequisite_order': None}],
                'total_estimated_hours': 40,
                'recommended_pace': '10 hours per week',
                'completion_timeline': '4 weeks'
            }

        obj, _ = AILearningPath.objects.get_or_create(intern=profile)
        obj.path_data = path_data
        obj.save()

        return Response({'learning_path': path_data, 'domain': domain, 'required_skills': required_skills})


class LearningPathGetView(APIView):
    """GET /ai/learning-path/{empId}/ — Get current learning path."""
    permission_classes = [IsAuthenticated]

    def get(self, request, emp_id=None):
        profile = request.user.profile
        try:
            path = AILearningPath.objects.filter(intern=profile).latest('updated_at')
            return Response({'learning_path': path.path_data, 'progress': path.progress})
        except AILearningPath.DoesNotExist:
            return Response({'learning_path': None, 'message': 'No learning path generated yet. Click Generate to create one.'})


class QuizGenerateView(APIView):
    """POST /ai/quiz/generate/{taskId}/ — Generate quiz from a learning task."""
    permission_classes = [IsAuthenticated]

    def post(self, request, task_id):
        try:
            task = Task.objects.get(id=task_id, assigned_to=request.user.profile)
        except Task.DoesNotExist:
            return Response({'error': 'Task not found'}, status=404)

        domain = getattr(request.user.profile.domain, 'name', 'General')
        system_prompt = "You are creating educational quiz questions. Make them clear and test real understanding. Return JSON only."

        prompt = f"""
Generate 5 quiz questions for this learning task. Return JSON:
{{
  "quiz_title": "Quiz: {task.title[:50]}",
  "questions": [
    {{
      "id": 1,
      "type": "mcq",
      "question": "question text",
      "options": ["A. option1", "B. option2", "C. option3", "D. option4"],
      "correct_answer": "A",
      "explanation": "why this answer is correct"
    }},
    {{
      "id": 2,
      "type": "short_answer",
      "question": "question text",
      "sample_answer": "expected key points in answer",
      "keywords": ["keyword1", "keyword2"]
    }}
  ]
}}

Task Title: {task.title}
Task Description: {task.description[:500] if task.description else ''}
Domain: {domain}
"""
        ai_text = call_gemini(prompt, system_prompt)
        quiz = {}
        try:
            start = ai_text.find('{')
            end = ai_text.rfind('}') + 1
            if start >= 0:
                quiz = json.loads(ai_text[start:end])
        except Exception:
            quiz = {'quiz_title': f'Quiz: {task.title}', 'questions': []}

        return Response(quiz)
