"""
AI Resume Views — Powered by Google Gemini
Generate and evaluate resumes from SIMS intern data.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from sims.models import UserProfile, Task, Project
from ..models import AIResumeData
from ..utils import call_gemini
import json


class ResumeGenerateView(APIView):
    """POST /ai/resume/generate/{empId}/ — Generate resume from SIMS data."""
    permission_classes = [IsAuthenticated]

    def post(self, request, emp_id=None):
        profile = request.user.profile
        if emp_id and emp_id != profile.emp_id:
            try:
                profile = UserProfile.objects.get(emp_id=emp_id)
            except UserProfile.DoesNotExist:
                return Response({'error': 'Intern not found'}, status=404)

        # Gather SIMS data
        completed_tasks = Task.objects.filter(
            assigned_to=profile, status__in=['completed', 'verified'], is_deleted=False
        ).values('title', 'description', 'task_type', 'progress')[:15]

        projects = Project.objects.filter(
            team__interns=profile, is_deleted=False
        ).values('name', 'description', 'domain__name', 'status')[:5]

        domain = getattr(profile.domain, 'name', 'General')
        extra_skills = request.data.get('skills', '')

        system_prompt = (
            "You are an expert resume writer helping an intern build a professional resume. "
            "Generate ATS-optimized, domain-relevant resume content. Return JSON only."
        )

        tasks_summary = ", ".join([t['title'] for t in completed_tasks]) if completed_tasks else "Various technical tasks"
        projects_summary = ", ".join([p['name'] for p in projects]) if projects else "Internal projects"

        prompt = f"""
Generate a complete professional resume for this intern. Return JSON:
{{
  "professional_summary": "3-4 sentence professional summary",
  "skills": {{
    "technical": ["skill1", "skill2", "skill3", "skill4", "skill5"],
    "soft_skills": ["skill1", "skill2", "skill3"]
  }},
  "internship_experience": [
    {{
      "title": "job title",
      "company": "SIMS Academy",
      "duration": "internship duration",
      "bullets": ["achievement bullet 1", "achievement bullet 2", "achievement bullet 3"]
    }}
  ],
  "projects": [
    {{
      "name": "project name",
      "description": "2 sentence description",
      "technologies": ["tech1", "tech2"],
      "outcome": "measurable outcome"
    }}
  ],
  "certifications": ["cert1"],
  "keywords": ["keyword1", "keyword2", "keyword3"]
}}

Intern Profile:
- Name: {profile.full_name}
- Domain: {domain}
- Internship Period: {profile.start_date} to {profile.end_date}
- Completed Tasks: {tasks_summary}
- Projects: {projects_summary}
- Additional Skills: {extra_skills}
- Scheme: {profile.scheme}
"""
        ai_text = call_gemini(prompt, system_prompt)
        resume_data = {}
        try:
            start = ai_text.find('{')
            end = ai_text.rfind('}') + 1
            if start >= 0:
                resume_data = json.loads(ai_text[start:end])
        except Exception:
            resume_data = {'professional_summary': ai_text[:500], 'skills': {'technical': [], 'soft_skills': []}}

        # Save or update resume data
        obj, _ = AIResumeData.objects.get_or_create(intern=profile)
        obj.resume_content = resume_data
        obj.save()

        return Response({'resume': resume_data, 'intern': {'name': profile.full_name, 'emp_id': profile.emp_id, 'domain': domain}})


class ResumeEvaluateView(APIView):
    """POST /ai/resume/evaluate/ — Evaluate uploaded resume text."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        profile = request.user.profile
        resume_text = request.data.get('resume_text', '')
        domain = request.data.get('domain', getattr(profile.domain, 'name', 'General'))

        if not resume_text:
            return Response({'error': 'Resume text is required'}, status=400)

        system_prompt = "You are an ATS expert and resume evaluator. Analyze the resume objectively. Return JSON only."

        prompt = f"""
Evaluate this resume for a {domain} role. Return JSON:
{{
  "overall_score": <0-100>,
  "ats_score": <0-100>,
  "domain_relevance_score": <0-100>,
  "section_scores": {{
    "summary": <0-10>,
    "skills": <0-10>,
    "experience": <0-10>,
    "education": <0-10>
  }},
  "strengths": ["strength1", "strength2"],
  "missing_keywords": ["keyword1", "keyword2", "keyword3"],
  "formatting_issues": ["issue1"],
  "improvement_suggestions": ["suggestion1", "suggestion2", "suggestion3"]
}}

Resume Text:
{resume_text[:3000]}

Target Domain: {domain}
"""
        ai_text = call_gemini(prompt, system_prompt)
        evaluation = {}
        try:
            start = ai_text.find('{')
            end = ai_text.rfind('}') + 1
            if start >= 0:
                evaluation = json.loads(ai_text[start:end])
        except Exception:
            evaluation = {'overall_score': 50, 'ats_score': 50, 'domain_relevance_score': 50}

        obj, _ = AIResumeData.objects.get_or_create(intern=profile)
        obj.ats_score = evaluation.get('ats_score', 50)
        obj.evaluation_data = evaluation
        obj.save()

        return Response(evaluation)


class ResumeSectionImproveView(APIView):
    """POST /ai/resume/section/{section}/ — Improve a specific resume section."""
    permission_classes = [IsAuthenticated]

    def post(self, request, section):
        current_content = request.data.get('content', '')
        instructions = request.data.get('instructions', 'Make it more professional and impactful')
        domain = getattr(request.user.profile.domain, 'name', 'General')

        system_prompt = f"You are an expert resume writer specializing in {domain} roles. Return only the improved text."

        prompt = f"""
Improve this resume {section} section based on instructions.
Instructions: {instructions}
Current content: {current_content}
Domain: {domain}
Return only the improved text, ready to paste directly.
"""
        improved = call_gemini(prompt, system_prompt)
        return Response({'improved_content': improved.strip(), 'section': section})


class ResumeGetView(APIView):
    """GET /ai/resume/evaluation/{empId}/ — Get latest resume data."""
    permission_classes = [IsAuthenticated]

    def get(self, request, emp_id=None):
        profile = request.user.profile
        try:
            resume = AIResumeData.objects.filter(intern=profile).latest('updated_at')
            return Response({
                'resume': resume.resume_content,
                'evaluation': resume.evaluation_data,
                'ats_score': resume.ats_score,
                'generated_at': resume.updated_at
            })
        except AIResumeData.DoesNotExist:
            return Response({'resume': None, 'evaluation': None})
