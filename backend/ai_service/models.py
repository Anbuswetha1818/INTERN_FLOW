"""
AI Service — Models
Chat sessions, AI reports, learning paths.
"""
from django.db import models
from sims.models import UserProfile


class AIChatSession(models.Model):
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='ai_sessions')
    title = models.CharField(max_length=500, default='New Chat')
    messages = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']


class AIPerformanceReport(models.Model):
    intern = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='ai_reports')
    report_data = models.JSONField(default=dict)
    ai_score = models.FloatField(default=0)
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-generated_at']


class AILearningPath(models.Model):
    intern = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='learning_paths')
    path_data = models.JSONField(default=dict)
    progress = models.IntegerField(default=0)
    generated_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class AIInterviewSession(models.Model):
    INTERVIEW_TYPES = [
        ('technical', 'Technical'), ('hr', 'HR/Behavioral'), ('mixed', 'Mixed'),
        ('project', 'Project-Based'), ('company', 'Company Prep'),
    ]
    intern = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='interview_sessions')
    interview_type = models.CharField(max_length=20, choices=INTERVIEW_TYPES, default='technical')
    difficulty = models.CharField(max_length=20, default='intermediate')
    duration_minutes = models.IntegerField(default=30)
    questions_answers = models.JSONField(default=list)
    score = models.FloatField(null=True, blank=True)
    report = models.JSONField(default=dict)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)


class AIResumeData(models.Model):
    intern = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='resume_data')
    resume_content = models.JSONField(default=dict)
    ats_score = models.FloatField(null=True, blank=True)
    evaluation_data = models.JSONField(default=dict)
    generated_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
