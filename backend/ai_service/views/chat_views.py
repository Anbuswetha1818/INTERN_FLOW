from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..utils import call_gemini
from ..models import AIChatSession

class ChatViews(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Fetch chat history for the user."""
        # AIChatSession is linked to UserProfile, not User directly.
        sessions = AIChatSession.objects.filter(user=request.user.profile).order_by('-updated_at')
        if not sessions.exists():
            return Response({"history": []})
        
        # Get latest session messages
        latest_session = sessions.first()
        return Response({"history": latest_session.messages})
        
    def post(self, request):
        """Send a message to the AI and get a response."""
        user_message = request.data.get('message')
        if not user_message:
            return Response({"error": "Message is required"}, status=400)
            
        # Get or create active session
        session = AIChatSession.objects.filter(user=request.user.profile).order_by('-updated_at').first()
        if not session:
            session = AIChatSession.objects.create(user=request.user.profile, title='New Chat Session')
        
        # Save user message
        from django.utils import timezone
        
        user_msg_obj = {
            "role": "user",
            "content": user_message,
            "timestamp": timezone.now().isoformat()
        }
        
        session.messages.append(user_msg_obj)
        session.save()
        
        # Get real data to make the AI realistic
        profile = request.user.profile
        from sims.models import Task
        tasks = Task.objects.filter(assigned_to=profile, status__in=['pending', 'in_progress'])
        task_info = ", ".join([f"'{t.title}'" for t in tasks]) if tasks.exists() else "No active tasks."
        
        system_prompt = f"""You are the SIMS AI Assistant. 
You are talking to {profile.full_name}, whose role is {profile.role}.
Their current active tasks are: {task_info}.
Answer their questions specifically based on this context. Be conversational, helpful, and reference their actual data when relevant!"""

        # Call Gemini AI
        ai_response_text = call_gemini(user_message, system_prompt=system_prompt)
        
        # Save AI response
        ai_msg_obj = {
            "role": "ai",
            "content": ai_response_text,
            "timestamp": timezone.now().isoformat()
        }
        session.messages.append(ai_msg_obj)
        session.save()
        
        return Response({
            "response": ai_response_text,
            "session_id": session.id
        })

