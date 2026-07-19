"""
AI Interview Views — Powered by Google Gemini
Handles mock interview sessions: start, answer, report, history.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from ..models import AIInterviewSession
from ..utils import call_gemini
import json


DOMAIN_TECH_TOPICS = {
    'Full Stack': 'React, Django REST Framework, REST APIs, JavaScript, Python, SQL, Git',
    'Data Science': 'Python, pandas, numpy, scikit-learn, machine learning, data visualization, SQL',
    'DevOps': 'Docker, Kubernetes, CI/CD pipelines, Linux, AWS/GCP, Terraform, monitoring',
    'Design': 'UI/UX principles, Figma, design systems, user research, accessibility, prototyping',
    'Frontend': 'React, HTML, CSS, JavaScript, responsive design, performance optimization',
    'Backend': 'Django, REST APIs, databases, authentication, caching, microservices',
    'General': 'problem solving, communication, teamwork, system design, data structures',
}


class InterviewStartView(APIView):
    """POST /ai/interview/start/ — Start a new mock interview session."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        profile = request.user.profile
        interview_type = request.data.get('interview_type', 'technical')
        difficulty = request.data.get('difficulty', 'intermediate')
        duration_minutes = int(request.data.get('duration_minutes', 30))
        domain = getattr(profile.domain, 'name', 'General')
        tech_topics = DOMAIN_TECH_TOPICS.get(domain, DOMAIN_TECH_TOPICS['General'])

        # Create session
        session = AIInterviewSession.objects.create(
            intern=profile,
            interview_type=interview_type,
            difficulty=difficulty,
            duration_minutes=duration_minutes,
        )

        # Generate opening question
        system_prompt = (
            f"You are a professional technical interviewer conducting a {interview_type} interview "
            f"for a {domain} intern at {difficulty} level. Be professional, clear, and encouraging. "
            "Ask one question at a time. Respond ONLY with JSON."
        )
        prompt = f"""
Start the interview with a warm professional greeting and ask the first question.
Return JSON: {{"greeting": "intro message", "question": "first interview question", "question_number": 1, "topic": "topic name"}}
Interview type: {interview_type}, Domain: {domain}, Topics: {tech_topics}, Difficulty: {difficulty}
"""
        ai_text = call_gemini(prompt, system_prompt)
        opening = {}
        try:
            start = ai_text.find('{')
            end = ai_text.rfind('}') + 1
            if start >= 0:
                opening = json.loads(ai_text[start:end])
        except Exception:
            opening = {'greeting': 'Welcome! Let\'s begin your mock interview.', 'question': 'Tell me about yourself and your experience in ' + domain, 'question_number': 1, 'topic': domain}

        # Save to session
        session.questions_answers.append({'question': opening.get('question', ''), 'topic': opening.get('topic', ''), 'q_num': 1, 'answer': None, 'score': None, 'feedback': None})
        session.save()

        return Response({
            'session_id': session.id,
            'greeting': opening.get('greeting', ''),
            'question': opening.get('question', ''),
            'question_number': 1,
            'topic': opening.get('topic', ''),
            'domain': domain,
            'difficulty': difficulty,
            'interview_type': interview_type,
        })


class InterviewAnswerView(APIView):
    """POST /ai/interview/answer/{sessionId}/ — Submit answer, get evaluation + next question."""
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        try:
            session = AIInterviewSession.objects.get(id=session_id, intern=request.user.profile)
        except AIInterviewSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=404)

        answer = request.data.get('answer', '')
        is_final = request.data.get('is_final', False)

        if not answer:
            return Response({'error': 'Answer is required'}, status=400)

        # Get last unanswered question
        qa_list = session.questions_answers
        last_q = qa_list[-1] if qa_list else {}
        current_question = last_q.get('question', '')
        q_num = last_q.get('q_num', 1)

        profile = session.intern
        domain = getattr(profile.domain, 'name', 'General')

        system_prompt = (
            f"You are evaluating answers in a {session.interview_type} interview for a {domain} intern. "
            "Be fair, specific, and constructive in your feedback. Respond ONLY with JSON."
        )

        # Evaluate answer
        eval_prompt = f"""
Evaluate this interview answer and provide the next question. Return JSON:
{{
  "score": <1-10>,
  "immediate_feedback": "brief specific feedback on the answer",
  "what_was_good": "what was correct or strong",
  "what_was_missing": "key points that were missing",
  "next_question": "next interview question to ask",
  "next_topic": "topic of next question",
  "is_last": {str(is_final or q_num >= 8).lower()}
}}

Question asked: {current_question}
Candidate's answer: {answer}
Domain: {domain}, Difficulty: {session.difficulty}, Question number: {q_num}
"""
        ai_text = call_gemini(eval_prompt, system_prompt)
        evaluation = {}
        try:
            start = ai_text.find('{')
            end = ai_text.rfind('}') + 1
            if start >= 0:
                evaluation = json.loads(ai_text[start:end])
        except Exception:
            evaluation = {'score': 5, 'immediate_feedback': 'Good attempt. Keep practicing!', 'next_question': 'Tell me about a challenging project you worked on.', 'is_last': False}

        # Update current Q with answer and evaluation
        qa_list[-1]['answer'] = answer
        qa_list[-1]['score'] = evaluation.get('score', 5)
        qa_list[-1]['feedback'] = evaluation.get('immediate_feedback', '')
        qa_list[-1]['what_was_good'] = evaluation.get('what_was_good', '')
        qa_list[-1]['what_was_missing'] = evaluation.get('what_was_missing', '')

        is_last = evaluation.get('is_last', False) or is_final or q_num >= 8

        if not is_last:
            # Add next question
            next_q = {'question': evaluation.get('next_question', ''), 'topic': evaluation.get('next_topic', ''), 'q_num': q_num + 1, 'answer': None, 'score': None, 'feedback': None}
            qa_list.append(next_q)

        session.questions_answers = qa_list
        session.save()

        return Response({
            'score': evaluation.get('score', 5),
            'immediate_feedback': evaluation.get('immediate_feedback', ''),
            'what_was_good': evaluation.get('what_was_good', ''),
            'what_was_missing': evaluation.get('what_was_missing', ''),
            'next_question': evaluation.get('next_question') if not is_last else None,
            'next_topic': evaluation.get('next_topic') if not is_last else None,
            'next_question_number': q_num + 1 if not is_last else None,
            'is_complete': is_last,
            'session_id': session.id,
        })


class InterviewReportView(APIView):
    """GET /ai/interview/report/{sessionId}/ — Get full interview report."""
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        try:
            session = AIInterviewSession.objects.get(id=session_id, intern=request.user.profile)
        except AIInterviewSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=404)

        # If report already exists, return it
        if session.report and session.report.get('overall_score'):
            return Response(session.report)

        qa_list = session.questions_answers
        answered = [q for q in qa_list if q.get('answer')]
        if not answered:
            return Response({'error': 'No answers recorded yet'}, status=400)

        total_score = sum(q.get('score', 0) for q in answered)
        avg_score = round(total_score / len(answered), 1) if answered else 0
        overall_pct = round(avg_score * 10, 1)

        profile = session.intern
        domain = getattr(profile.domain, 'name', 'General')

        system_prompt = "You are generating a detailed, professional mock interview report. Be specific and constructive. Return JSON only."

        qa_summary = "\n".join([f"Q{q['q_num']}: {q['question'][:100]}... | Score: {q.get('score', 0)}/10 | Feedback: {q.get('immediate_feedback', '')[:80]}" for q in answered])

        report_prompt = f"""
Generate a comprehensive interview report. Return JSON:
{{
  "overall_score": {overall_pct},
  "performance_label": "Excellent/Good/Average/Needs Improvement",
  "strengths": ["strength1", "strength2", "strength3"],
  "improvement_areas": ["area1", "area2", "area3"],
  "recommended_study_topics": ["topic1", "topic2", "topic3"],
  "action_plan": ["step1", "step2", "step3"],
  "confidence_assessment": "paragraph on communication and confidence",
  "summary": "2-3 sentence overall assessment"
}}

Interview Details:
- Domain: {domain}
- Type: {session.interview_type}
- Difficulty: {session.difficulty}
- Questions answered: {len(answered)}
- Average score: {avg_score}/10

Question by Question:
{qa_summary}
"""
        ai_text = call_gemini(report_prompt, system_prompt)
        report_data = {}
        try:
            start = ai_text.find('{')
            end = ai_text.rfind('}') + 1
            if start >= 0:
                report_data = json.loads(ai_text[start:end])
        except Exception:
            report_data = {'overall_score': overall_pct, 'summary': 'Interview completed. Review your performance above.', 'strengths': [], 'improvement_areas': [], 'recommended_study_topics': [], 'action_plan': []}

        report_data['question_breakdown'] = answered
        report_data['overall_score'] = overall_pct
        report_data['avg_score_per_question'] = avg_score

        # Save report
        session.score = overall_pct
        session.report = report_data
        session.completed_at = timezone.now()
        session.save()

        return Response(report_data)


class InterviewHistoryView(APIView):
    """GET /ai/interview/history/{empId}/ — All past sessions for intern."""
    permission_classes = [IsAuthenticated]

    def get(self, request, emp_id=None):
        profile = request.user.profile
        sessions = AIInterviewSession.objects.filter(intern=profile).order_by('-started_at')
        data = [{
            'id': s.id,
            'interview_type': s.interview_type,
            'difficulty': s.difficulty,
            'score': s.score,
            'started_at': s.started_at,
            'completed_at': s.completed_at,
            'questions_count': len([q for q in s.questions_answers if q.get('answer')]),
        } for s in sessions]
        return Response({'sessions': data})
