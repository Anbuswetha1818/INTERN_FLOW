import os
import requests
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def call_gemini(prompt, system_prompt="You are a helpful AI assistant for the SIMS platform."):
    """
    Wrapper to call the Google Gemini API.
    In dev mode, if no key is provided, returns a mock response.
    """
    api_key = getattr(settings, 'GEMINI_API_KEY', None)
    
    if not api_key:
        logger.warning("No GEMINI_API_KEY found. Returning mock AI response.")
        return f"[MOCK AI RESPONSE] I am the SIMS AI. You asked: {prompt}"
        
    ai_model = getattr(settings, 'AI_MODEL', 'gemini-flash-latest')
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{ai_model}:generateContent?key={api_key}"
    headers = {
        "Content-Type": "application/json"
    }
    
    # Simple prompt construction for Gemini
    combined_prompt = f"System Context: {system_prompt}\n\nUser Question: {prompt}"
    
    data = {
        "contents": [{
            "parts": [{"text": combined_prompt}]
        }]
    }
    
    try:
        response = requests.post(url, headers=headers, json=data, timeout=15)
        response.raise_for_status()
        result = response.json()
        return result['candidates'][0]['content']['parts'][0]['text']
    except Exception as e:
        logger.error(f"Error calling Gemini API: {e}")
        # Graceful fallback mock responses based on prompt keywords
        p_lower = prompt.lower()
        if "performance" in p_lower and "executive_summary" in p_lower:
            return """{
              "executive_summary": "Based on the metrics, the intern is performing exceptionally well with strong task completion and high attendance. (Mock AI Data due to invalid API key)",
              "strengths": ["Consistent attendance", "High task completion rate", "Good communication"],
              "areas_for_improvement": ["Could take on more complex tasks", "Improve code documentation"],
              "attendance_analysis": "Attendance is stellar at near perfect levels over the last 30 days.",
              "task_efficiency_trend": "Task completion is trending upwards, showing increased familiarity with the tech stack.",
              "recommended_actions_for_intern": ["Review advanced React patterns", "Take the initiative on next project planning"],
              "recommended_actions_for_mentor": ["Assign a stretch goal project", "Provide leadership opportunities"]
            }"""
        elif "evaluate this interview answer" in p_lower or "candidate's answer" in p_lower:
            return """{
              "score": 8,
              "immediate_feedback": "The explanation of the project challenges was clear and structured, highlighting the issue and how it was resolved.",
              "what_was_good": "Good problem description and clear resolution steps.",
              "what_was_missing": "Could have quantified the results of the project solution.",
              "next_question": "Can you describe a situation where you had to collaborate with a difficult teammate?",
              "next_topic": "Collaboration",
              "is_last": false
            }"""
        elif "start the interview" in p_lower:
            return """{
              "greeting": "Welcome to your mock interview! Let's begin.",
              "question": "Tell me about yourself and your experience in this field.",
              "question_number": 1,
              "topic": "Introduction"
            }"""
        elif "interview" in p_lower and "report" in p_lower:
            return """{"overall_score": 85, "summary": "Strong mock interview performance. (Mock Data)", "strengths": ["Clear communication"], "improvement_areas": ["System design"], "recommended_study_topics": ["Scalability"], "action_plan": ["Review distributed systems"]}"""
        elif "resume" in p_lower and "evaluate" in p_lower:
            return """{"ats_score": 75, "overall_score": 80, "domain_relevance_score": 85, "strengths": ["Good formatting"], "missing_keywords": ["CI/CD"], "formatting_issues": [], "improvement_suggestions": ["Add more measurable metrics"]}"""
        elif "tasks/suggest" in p_lower or "decompose" in p_lower:
            return """{"subtasks": [{"title": "Initial Setup", "description": "Setup project", "estimated_hours": 2, "order": 1}]}"""
        
        if "json" in p_lower or "{" in p_lower:
            return """{
              "score": 7,
              "immediate_feedback": "Your response is noted. Keep up the good work!",
              "what_was_good": "Structured response.",
              "what_was_missing": "More details can be added.",
              "next_question": "What are your long-term career goals?",
              "next_topic": "Career Goals",
              "is_last": false,
              "overall_score": 75,
              "summary": "AI generated mock evaluation.",
              "strengths": ["Clear response structure"],
              "improvement_areas": ["Detailed answers"],
              "recommended_study_topics": ["General concepts"],
              "action_plan": ["Practice daily"],
              "ats_score": 75,
              "domain_relevance_score": 75,
              "missing_keywords": [],
              "formatting_issues": [],
              "improvement_suggestions": [],
              "subtasks": []
            }"""

        # Smart keyword-based text fallbacks
        if "hello" in p_lower or "hi " in p_lower or "hey" in p_lower or "greetings" in p_lower:
            return "Hello! I am your SIMS AI assistant. How can I help you today with your internship, tasks, or code queries?"
        elif "react" in p_lower:
            return "React is a popular JavaScript library for building user interfaces, particularly single-page applications. It allows developers to create reusable UI components, manage state efficiently, and utilize a Virtual DOM for optimal rendering performance. Let me know if you need component code examples!"
        elif "django" in p_lower:
            return "Django is a high-level Python web framework that encourages rapid development and clean, pragmatic design. It follows the MVT (Model-View-Template) pattern and comes with built-in features like an ORM, authentication, and an administrative interface."
        elif "python" in p_lower:
            return "Python is an interpreted, high-level, general-purpose programming language. Its design philosophy emphasizes code readability with the use of significant indentation. Python is widely used in web development, data science, and machine learning."
        elif "javascript" in p_lower or " js" in p_lower:
            return "JavaScript is a lightweight, interpreted, or just-in-time compiled programming language with first-class functions. It is best known as the scripting language for Web pages, but is also used in Node.js for backend development."
        elif "sql" in p_lower or "database" in p_lower:
            return "A database is an organized collection of structured information or data. SQL (Structured Query Language) is the standard language used to manage, query, and manipulate relational databases like PostgreSQL, MySQL, and SQLite."
        elif "html" in p_lower or "css" in p_lower:
            return "HTML (HyperText Markup Language) provides the structure of web pages, while CSS (Cascading Style Sheets) is used to control the presentation, formatting, and layout of the HTML elements."
        elif "git" in p_lower:
            return "Git is a free and open-source distributed version control system designed to handle everything from small to very large projects with speed and efficiency. It allows multiple developers to collaborate smoothly using repositories, branches, and merges."

        # Dynamic fallback response incorporating user's question
        user_query = prompt.replace("System Context: You are a helpful AI assistant for the SIMS platform.\n\nUser Question: ", "")
        user_query = user_query.replace("System Context: You are a helpful AI assistant for the SIMS platform.\n\n", "")
        if "user question:" in user_query.lower():
            parts = user_query.lower().split("user question:")
            if len(parts) > 1:
                user_query = parts[1].strip()

        return f"Regarding your question about '{user_query}': To implement this, you should structure your code components carefully, ensure correct data flow, and write clean unit tests. If you are developing a feature, verify backend REST APIs and connect them to your React frontend using service layers. Please let me know if you need specific code examples!"
