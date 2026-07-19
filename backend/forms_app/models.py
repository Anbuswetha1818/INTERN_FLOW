"""
Forms & Surveys Module — Models
Custom feedback forms with multiple question types and public sharing.
"""
from django.db import models
from sims.models import UserProfile, Entity


class Form(models.Model):
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True, default='')
    created_by = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, null=True, related_name='created_forms')
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='forms', null=True, blank=True)
    banner = models.ImageField(upload_to='forms/banners/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class FormSection(models.Model):
    form = models.ForeignKey(Form, on_delete=models.CASCADE, related_name='sections')
    title = models.CharField(max_length=500)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']


class FormQuestion(models.Model):
    QUESTION_TYPES = [
        ('text', 'Text'), ('textarea', 'Text Area'), ('radio', 'Radio'),
        ('checkbox', 'Checkbox'), ('dropdown', 'Dropdown'), ('email', 'Email'),
        ('phone', 'Phone'), ('rating', 'Rating (1-5)'), ('yesno', 'Yes/No'),
    ]

    form = models.ForeignKey(Form, on_delete=models.CASCADE, related_name='questions')
    section = models.ForeignKey(FormSection, on_delete=models.CASCADE, null=True, blank=True, related_name='questions')
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES, default='text')
    options = models.JSONField(default=list, blank=True)  # For radio/checkbox/dropdown
    is_required = models.BooleanField(default=False)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']


class FormResponse(models.Model):
    form = models.ForeignKey(Form, on_delete=models.CASCADE, related_name='responses')
    respondent_name = models.CharField(max_length=255, blank=True, default='')
    respondent_email = models.EmailField(blank=True, default='')
    answers = models.JSONField(default=dict)
    is_consult = models.BooleanField(default=False)
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-submitted_at']


class ResponseComment(models.Model):
    response = models.ForeignKey(FormResponse, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, null=True)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
