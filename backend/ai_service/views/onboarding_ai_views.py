"""
Stub file for onboarding_ai_views.py.
Full implementation will utilize the Anthropic Claude API for AI features.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

class OnboardingAiViews(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"status": "ready", "module": "onboarding_ai_views.py"})
        
    def post(self, request):
        return Response({"status": "ready", "module": "onboarding_ai_views.py"})
