from django.contrib import admin
from .models import (
    Entity, Branch, Domain,
    UserProfile, Team, Project, Task, Subtask,
    AttendanceRecord, LeaveRequest, AttendanceClaim,
    Asset, AssetIssue, PaymentRecord, FeeStructure,
    Document, Feedback, OnboardingSubmission,
    Notification, ActivityLog, EntityConfig,
    Certificate, Promotion, RoleDelegation,
)


@admin.register(Entity)
class EntityAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'created_at']

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['emp_id', 'full_name', 'role', 'user_status', 'entity']
    list_filter = ['role', 'user_status', 'entity']
    search_fields = ['emp_id', 'full_name', 'user__email']

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'status', 'priority', 'assigned_to', 'due_date']
    list_filter = ['status', 'priority', 'task_type']

@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'status', 'team', 'team_lead']

@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ['name', 'mentor', 'is_active']

@admin.register(AttendanceRecord)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ['user', 'date', 'status', 'total_hours']
    list_filter = ['status', 'date']

@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ['asset_code', 'asset_type', 'status', 'assigned_to']

@admin.register(PaymentRecord)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['user', 'amount', 'status', 'payment_mode']

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ['user', 'doc_type', 'status', 'version']

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'title', 'notification_type', 'is_read']

# Register remaining models
for model in [Branch, Domain, Subtask,
              LeaveRequest, AttendanceClaim, AssetIssue, FeeStructure,
              Feedback, OnboardingSubmission, ActivityLog, EntityConfig,
              Certificate, Promotion, RoleDelegation]:
    admin.site.register(model)
