"""
SIMS — Complete Data Models
25+ models covering the entire intern lifecycle management system.
"""

import uuid
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator


# =============================================================================
# Organization Hierarchy
# =============================================================================

class Entity(models.Model):
    """Top-level container — company or academy. All data belongs to an entity."""
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    logo = models.ImageField(upload_to='entities/logos/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Entities'
        ordering = ['name']

    def __str__(self):
        return self.name


class Branch(models.Model):
    """Physical or logical sub-division of an entity (e.g., Chennai Office, Remote)."""
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='branches')
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255, blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Branches'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.entity.name})"


class Domain(models.Model):
    """Specialization within an entity (Full Stack, ML, DevOps, UI/UX, etc.)."""
    name = models.CharField(max_length=255)
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='domains', null=True, blank=True)
    description = models.TextField(blank=True, default='')
    required_skills = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.entity.name})" if self.entity else self.name



# =============================================================================
# User Profiles
# =============================================================================

class UserProfile(models.Model):
    """Extended profile for all users in the system — staff and interns."""

    ROLE_CHOICES = [
        ('superadmin', 'Super Admin'),
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('sme', 'SME'),
        ('mentor', 'Mentor'),
        ('staff', 'Staff (Intern View)'),
        ('intern', 'Intern'),
    ]

    STATUS_CHOICES = [
        ('yettojoin', 'Yet to Join'),
        ('active', 'Active'),
        ('inprogress', 'In Progress'),
        ('onleave', 'On Leave'),
        ('completed', 'Completed'),
        ('discontinued', 'Discontinued'),
    ]

    SCHEME_CHOICES = [
        ('free', 'Free'),
        ('paid', 'Paid'),
        ('stipend', 'Stipend'),
    ]

    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    ]

    # Core
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    emp_id = models.CharField(max_length=50, unique=True, db_index=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='intern')
    user_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='yettojoin')

    # Personal
    full_name = models.CharField(max_length=255, blank=True, default='')
    phone = models.CharField(max_length=20, blank=True, default='')
    aadhar_number = models.CharField(max_length=20, blank=True, default='')
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True, default='')
    date_of_birth = models.DateField(null=True, blank=True)
    photo = models.ImageField(upload_to='profiles/photos/', blank=True, null=True)

    # Organization
    entity = models.ForeignKey(Entity, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
    domain = models.ForeignKey(Domain, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')

    # Academic (for interns)
    registration_number = models.CharField(max_length=100, blank=True, default='')
    college_name = models.CharField(max_length=255, blank=True, default='')
    college_location = models.CharField(max_length=255, blank=True, default='')
    degree = models.CharField(max_length=255, blank=True, default='')
    college_department = models.CharField(max_length=255, blank=True, default='')
    year_of_passing = models.IntegerField(null=True, blank=True)

    # Internship
    scheme = models.CharField(max_length=20, choices=SCHEME_CHOICES, blank=True, default='free')
    shift_timing = models.CharField(max_length=50, blank=True, default='Standard')
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    terms_agreed = models.BooleanField(default=False)
    doc_aadhar_submitted = models.BooleanField(default=False)
    doc_resume_submitted = models.BooleanField(default=False)
    doc_college_id_submitted = models.BooleanField(default=False)
    doc_photo_submitted = models.BooleanField(default=False)
    payment_completed = models.BooleanField(default=False)
    payment_amount = models.IntegerField(default=0)

    # Settings
    dark_mode = models.BooleanField(default=False)
    language = models.CharField(max_length=10, default='en')
    email_notifications = models.BooleanField(default=True)
    push_notifications = models.BooleanField(default=True)
    notification_digest_mode = models.BooleanField(default=False)

    # System
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # MFA
    mfa_enabled = models.BooleanField(default=False)
    mfa_secret = models.CharField(max_length=100, blank=True, default='')

    # Access & Permissions
    custom_permissions = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.emp_id} — {self.full_name} ({self.get_role_display()})"

    @property
    def is_staff_role(self):
        return self.role in ('superadmin', 'admin', 'manager', 'sme', 'mentor', 'staff')

    def is_global_admin(self):
        """Returns True if the user is a superadmin and is not scoped to any specific entity."""
        return self.role == 'superadmin' and self.entity_id is None


# =============================================================================
# Teams
# =============================================================================

class Team(models.Model):
    """Named group of interns assigned to a Mentor for project work."""
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    mentor = models.ForeignKey(
        UserProfile, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='led_teams', limit_choices_to={'role__in': ['mentor', 'sme']}
    )
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='teams', null=True, blank=True)
    interns = models.ManyToManyField(UserProfile, related_name='teams', blank=True, limit_choices_to={'role': 'intern'})
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


# =============================================================================
# Projects & Tasks
# =============================================================================

class Project(models.Model):
    """Groups related tasks and team members."""
    STATUS_CHOICES = [
        ('planning', 'Planning'),
        ('active', 'Active'),
        ('on_hold', 'On Hold'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    domain = models.ForeignKey(Domain, on_delete=models.SET_NULL, null=True, blank=True, related_name='projects')
    team = models.ForeignKey(Team, on_delete=models.SET_NULL, null=True, blank=True, related_name='projects')
    team_lead = models.ForeignKey(
        UserProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='led_projects'
    )
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='projects', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='planning')
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    document = models.FileField(upload_to='projects/documents/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name


class Task(models.Model):
    """Core task entity with full lifecycle management."""
    STATUS_CHOICES = [
        ('todo', 'To Do'),
        ('inprogress', 'In Progress'),
        ('completed', 'Completed'),
        ('verified', 'Verified'),
    ]

    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]

    TYPE_CHOICES = [
        ('learning', 'Learning'),
        ('project', 'Project'),
        ('custom', 'Custom'),
    ]

    title = models.CharField(max_length=500)
    description = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    task_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='project')

    assigned_to = models.ForeignKey(
        UserProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks'
    )
    created_by = models.ForeignKey(
        UserProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_tasks'
    )
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks')
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='tasks', null=True, blank=True)

    due_date = models.DateField(null=True, blank=True)
    committed_date = models.DateField(null=True, blank=True)
    completed_date = models.DateTimeField(null=True, blank=True)
    progress = models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(100)])

    # Dependencies & SLA
    blocked_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='blocking')
    sla_hours = models.IntegerField(null=True, blank=True)

    # Metadata
    tags = models.JSONField(default=list, blank=True)
    attachments = models.JSONField(default=list, blank=True)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    @property
    def is_overdue(self):
        if self.due_date and self.status not in ('completed', 'verified'):
            return timezone.now().date() > self.due_date
        return False


class Subtask(models.Model):
    """Child tasks within a parent task."""
    STATUS_CHOICES = [
        ('todo', 'To Do'),
        ('inprogress', 'In Progress'),
        ('completed', 'Completed'),
    ]

    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='subtasks')
    title = models.CharField(max_length=500)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')
    order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.task.title} → {self.title}"


class TaskComment(models.Model):
    """Comments on tasks with internal/visible flag."""
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, null=True, related_name='task_comments')
    content = models.TextField()
    is_internal = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Comment on {self.task.title} by {self.author}"


class TaskStatusHistory(models.Model):
    """Version history tracking for task status changes."""
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='status_history')
    old_status = models.CharField(max_length=20, blank=True, default='')
    new_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, null=True)
    changed_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-changed_at']
        verbose_name_plural = 'Task status histories'


# =============================================================================
# Attendance & Time Tracking
# =============================================================================

class AttendanceRecord(models.Model):
    """Daily attendance record for an intern."""
    STATUS_CHOICES = [
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('onleave', 'On Leave'),
        ('halfday', 'Half Day'),
    ]

    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField(db_index=True)

    check_in = models.DateTimeField(null=True, blank=True)
    check_out = models.DateTimeField(null=True, blank=True)
    break_start = models.DateTimeField(null=True, blank=True)
    break_end = models.DateTimeField(null=True, blank=True)

    total_hours = models.FloatField(default=0)
    effective_hours = models.FloatField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='absent')

    is_late = models.BooleanField(default=False)
    late_minutes = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'date']
        ordering = ['-date']

    def __str__(self):
        return f"{self.user.emp_id} — {self.date} — {self.status}"

    def calculate_hours(self):
        """Calculate total and effective hours from check-in/out and breaks."""
        if self.check_in and self.check_out:
            total = (self.check_out - self.check_in).total_seconds() / 3600
            break_hours = 0
            if self.break_start and self.break_end:
                break_hours = (self.break_end - self.break_start).total_seconds() / 3600
            self.total_hours = round(total, 2)
            self.effective_hours = round(total - break_hours, 2)


class LeaveRequest(models.Model):
    """Leave application by an intern."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    LEAVE_TYPE_CHOICES = [
        ('casual', 'Casual Leave'),
        ('sick', 'Sick Leave'),
        ('personal', 'Personal Leave'),
        ('emergency', 'Emergency Leave'),
        ('other', 'Other'),
    ]

    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='leave_requests')
    leave_type = models.CharField(max_length=20, choices=LEAVE_TYPE_CHOICES, default='casual')
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    approved_by = models.ForeignKey(
        UserProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_leaves'
    )
    approver_comment = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.emp_id} — {self.leave_type} ({self.start_date} to {self.end_date})"

    @property
    def days(self):
        return (self.end_date - self.start_date).days + 1


class AttendanceClaim(models.Model):
    """Attendance correction request by an intern."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='attendance_claims')
    date = models.DateField()
    reason = models.TextField()
    check_in_time = models.TimeField(null=True, blank=True)
    check_out_time = models.TimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey(
        UserProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_claims'
    )
    reviewer_comment = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Claim: {self.user.emp_id} — {self.date}"


# =============================================================================
# Asset Management
# =============================================================================

class Asset(models.Model):
    """Physical asset tracking."""
    CONDITION_CHOICES = [
        ('good', 'Good'),
        ('damaged', 'Damaged'),
        ('lost', 'Lost'),
    ]

    STATUS_CHOICES = [
        ('available', 'Available'),
        ('assigned', 'Assigned'),
        ('damaged', 'Damaged'),
        ('lost', 'Lost'),
    ]

    TYPE_CHOICES = [
        ('laptop', 'Laptop'),
        ('idcard', 'ID Card'),
        ('accessories', 'Accessories'),
        ('monitor', 'Monitor'),
        ('keyboard', 'Keyboard'),
        ('mouse', 'Mouse'),
        ('headset', 'Headset'),
        ('other', 'Other'),
    ]

    asset_code = models.CharField(max_length=100, unique=True, db_index=True)
    asset_type = models.CharField(max_length=50, choices=TYPE_CHOICES, default='other')
    name = models.CharField(max_length=255, blank=True, default='')
    serial_number = models.CharField(max_length=255, blank=True, default='')
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default='good')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')

    assigned_to = models.ForeignKey(
        UserProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_assets'
    )
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='assets', null=True, blank=True)
    issue_date = models.DateField(null=True, blank=True)
    expected_return_date = models.DateField(null=True, blank=True)
    actual_return_date = models.DateField(null=True, blank=True)

    notes = models.TextField(blank=True, default='')
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.asset_code} — {self.name or self.asset_type}"


class AssetIssue(models.Model):
    """Issue report for an asset (damage, loss, etc.)."""
    STATUS_CHOICES = [
        ('reported', 'Reported'),
        ('investigating', 'Investigating'),
        ('resolved', 'Resolved'),
        ('replaced', 'Replaced'),
    ]

    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='issues')
    reported_by = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, null=True, related_name='reported_issues')
    description = models.TextField()
    issue_type = models.CharField(max_length=50, default='damage')
    damage_type = models.CharField(max_length=100, blank=True, default='')
    damage_image = models.ImageField(upload_to='assets/damage_images/', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='reported')
    replacement_asset = models.ForeignKey(
        Asset, on_delete=models.SET_NULL, null=True, blank=True, related_name='replaced_for'
    )
    resolution_notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Issue: {self.asset.asset_code} — {self.issue_type}"


class AssetHistory(models.Model):
    """Audit history for asset assignments and status changes."""
    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='history')
    action = models.CharField(max_length=50)  # assigned, returned, damaged, lost, repaired
    user = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, null=True, related_name='asset_history')
    performed_by = models.ForeignKey(
        UserProfile, on_delete=models.SET_NULL, null=True, related_name='asset_actions'
    )
    old_value = models.JSONField(default=dict, blank=True)
    new_value = models.JSONField(default=dict, blank=True)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Asset histories'


# =============================================================================
# Payment / Stipend Management
# =============================================================================

class FeeStructure(models.Model):
    """Configurable payment tier per entity."""
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='fee_structures')
    name = models.CharField(max_length=255)
    scheme = models.CharField(max_length=20, choices=UserProfile.SCHEME_CHOICES, default='paid')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} — ₹{self.amount}"


class PaymentRecord(models.Model):
    """Payment record for an intern."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('submitted', 'Submitted'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    ]

    MODE_CHOICES = [
        ('bank_transfer', 'Bank Transfer'),
        ('cash', 'Cash'),
        ('upi', 'UPI'),
        ('cheque', 'Cheque'),
        ('other', 'Other'),
    ]

    PAYMENT_TYPE_CHOICES = [
        ('full', 'Full Payment'),
        ('part', 'Part Payment / Installment'),
    ]

    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='payment_records')
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='payments', null=True, blank=True)
    fee_structure = models.ForeignKey(
        FeeStructure, on_delete=models.SET_NULL, null=True, blank=True, related_name='payments'
    )

    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPE_CHOICES, default='full')
    installment_number = models.IntegerField(default=1)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_mode = models.CharField(max_length=20, choices=MODE_CHOICES, blank=True, default='')
    payment_date = models.DateField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    scheme = models.CharField(max_length=20, choices=UserProfile.SCHEME_CHOICES, blank=True, default='')

    # Intern Payment Submission
    transaction_id = models.CharField(max_length=100, blank=True, default='')
    screenshot = models.ImageField(upload_to='payment_screenshots/', null=True, blank=True)

    # Cash payment approval
    requires_approval = models.BooleanField(default=False)
    approved_by = models.ForeignKey(
        UserProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_payments'
    )

    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Payment: {self.user.emp_id} — ₹{self.amount} ({self.status})"


class PaymentHistory(models.Model):
    """Version history for payment record changes."""
    payment = models.ForeignKey(PaymentRecord, on_delete=models.CASCADE, related_name='history')
    changed_by = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, null=True)
    old_data = models.JSONField(default=dict)
    new_data = models.JSONField(default=dict)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-changed_at']
        verbose_name_plural = 'Payment histories'


# =============================================================================
# Document Management
# =============================================================================

class Document(models.Model):
    """Document uploaded by or for an intern."""
    DOC_TYPE_CHOICES = [
        ('offer_letter', 'Offer Letter'),
        ('nda', 'NDA'),
        ('resume', 'Resume / CV'),
        ('id_proof', 'ID Proof'),
        ('education_cert', 'Educational Certificate'),
        ('photo', 'Photo'),
        ('other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='documents')
    doc_type = models.CharField(max_length=30, choices=DOC_TYPE_CHOICES)
    title = models.CharField(max_length=255, blank=True, default='')
    file = models.FileField(upload_to='documents/')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    version = models.IntegerField(default=1)

    reviewed_by = models.ForeignKey(
        UserProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_documents'
    )
    reviewer_comment = models.TextField(blank=True, default='')
    reviewed_at = models.DateTimeField(null=True, blank=True)

    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='documents', null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.emp_id} — {self.get_doc_type_display()} v{self.version}"


# =============================================================================
# Feedback & Performance
# =============================================================================

class Feedback(models.Model):
    """Performance feedback from Mentor/Lead for an intern."""
    RECOMMENDATION_CHOICES = [
        ('selected', 'Selected'),
        ('not_selected', 'Not Selected'),
        ('pending', 'Pending Decision'),
    ]

    intern = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='received_feedback')
    reviewer = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, null=True, related_name='given_feedback')
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='feedback', null=True, blank=True)

    # Scores (1–10)
    performance_score = models.IntegerField(
        default=5, validators=[MinValueValidator(1), MaxValueValidator(10)]
    )
    attitude_score = models.IntegerField(
        default=5, validators=[MinValueValidator(1), MaxValueValidator(10)]
    )
    progress_score = models.IntegerField(
        default=5, validators=[MinValueValidator(1), MaxValueValidator(10)]
    )
    quality_score = models.IntegerField(
        default=5, validators=[MinValueValidator(1), MaxValueValidator(10)]
    )

    qualitative_notes = models.TextField(blank=True, default='')
    recommendation = models.CharField(max_length=20, choices=RECOMMENDATION_CHOICES, default='pending')
    is_final_evaluation = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Feedback: {self.intern.emp_id} by {self.reviewer.emp_id if self.reviewer else 'N/A'}"

    @property
    def average_score(self):
        return round((self.performance_score + self.attitude_score + self.progress_score + self.quality_score) / 4, 2)


class StudentStaffFeedback(models.Model):
    """Feedback submitted by interns about their Mentor/Lead."""
    intern = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='staff_feedback_given')
    staff = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='staff_feedback_received')

    rating = models.IntegerField(default=5, validators=[MinValueValidator(1), MaxValueValidator(5)])
    feedback_text = models.TextField()
    is_anonymous = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


# =============================================================================
# Onboarding
# =============================================================================

class OnboardingSubmission(models.Model):
    """Intern onboarding form submission — pre-account creation."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    # Personal
    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    aadhar_number = models.CharField(max_length=20, blank=True, default='')
    gender = models.CharField(max_length=10, blank=True, default='')
    date_of_birth = models.DateField(null=True, blank=True)
    photo = models.ImageField(upload_to='onboarding/photos/', blank=True, null=True)

    # Academic
    registration_number = models.CharField(max_length=100, blank=True, default='')
    college_location = models.CharField(max_length=255, blank=True, default='')
    college_name = models.CharField(max_length=255, blank=True, default='')
    degree = models.CharField(max_length=255, blank=True, default='')
    college_department = models.CharField(max_length=255, blank=True, default='')
    year_of_passing = models.IntegerField(null=True, blank=True)

    # Internship
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    shift_timing = models.CharField(max_length=50, blank=True, default='Standard')
    scheme = models.CharField(max_length=20, choices=UserProfile.SCHEME_CHOICES, default='free')
    domain = models.ForeignKey(Domain, on_delete=models.SET_NULL, null=True, blank=True)
    terms_agreed = models.BooleanField(default=False)

    # Entity
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, related_name='onboarding_submissions', null=True, blank=True)

    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    emp_id = models.CharField(max_length=50, blank=True, default='')
    reviewed_by = models.ForeignKey(
        UserProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_onboardings'
    )
    review_notes = models.TextField(blank=True, default='')
    credentials_sent = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Onboarding: {self.full_name} ({self.status})"


# =============================================================================
# Notifications
# =============================================================================

class Notification(models.Model):
    """In-app notification for a user."""
    PRIORITY_CHOICES = [
        ('critical', 'Critical'),
        ('attention', 'Attention'),
        ('informational', 'Informational'),
    ]

    TYPE_CHOICES = [
        ('task_assigned', 'Task Assigned'),
        ('task_status', 'Task Status Changed'),
        ('leave_status', 'Leave Status'),
        ('payment_status', 'Payment Status'),
        ('document_status', 'Document Status'),
        ('attendance_claim', 'Attendance Claim'),
        ('escalation', 'Escalation Alert'),
        ('ai_report', 'AI Report Ready'),
        ('general', 'General'),
        ('announcement', 'Announcement'),
    ]

    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255, blank=True, default='')
    message = models.TextField()
    notification_type = models.CharField(max_length=30, choices=TYPE_CHOICES, default='general')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='informational')

    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)

    # Optional link to related entity
    related_type = models.CharField(max_length=50, blank=True, default='')
    related_id = models.IntegerField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification: {self.user.emp_id} — {self.title or self.message[:50]}"


# =============================================================================
# Activity / Audit Log
# =============================================================================

class ActivityLog(models.Model):
    """Immutable audit log — append-only. Tracks all write operations."""
    user = models.ForeignKey(UserProfile, on_delete=models.SET_NULL, null=True, related_name='activity_logs')
    user_name = models.CharField(max_length=255, blank=True, default='')
    entity = models.ForeignKey(Entity, on_delete=models.SET_NULL, null=True, blank=True)

    table_name = models.CharField(max_length=100)
    action = models.CharField(max_length=50)  # create, update, delete, approve, reject, etc.
    record_id = models.IntegerField(null=True, blank=True)

    old_data = models.JSONField(default=dict, blank=True)
    new_data = models.JSONField(default=dict, blank=True)

    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        # Audit logs should never be edited or deleted
        managed = True

    def __str__(self):
        return f"Log: {self.user_name} — {self.action} on {self.table_name}"


# =============================================================================
# Profile Update Requests
# =============================================================================

class ProfileUpdateRequest(models.Model):
    """Profile change request by an intern, requiring manager approval."""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='profile_update_requests')
    field_changes = models.JSONField(default=dict)  # {field_name: {old: x, new: y}}
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    reviewed_by = models.ForeignKey(
        UserProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_profile_updates'
    )
    reviewer_comment = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']


# =============================================================================
# Entity Configuration
# =============================================================================

class EntityConfig(models.Model):
    """Entity-level configuration for shifts, leave, payments, feature flags, etc."""
    entity = models.OneToOneField(Entity, on_delete=models.CASCADE, related_name='config')

    # Working hours & shifts
    working_hours = models.JSONField(default=dict, blank=True)
    shift_definitions = models.JSONField(default=list, blank=True)
    # Example: [{"name": "Morning", "start": "09:00", "end": "17:00", "late_mark_after": 15}]

    # Leave policy
    leave_quota = models.JSONField(default=dict, blank=True)
    # Example: {"casual": 12, "sick": 6, "personal": 3}
    carry_forward_rules = models.JSONField(default=dict, blank=True)
    leave_approval_chain = models.JSONField(default=list, blank=True)
    # Example: ["mentor", "lead", "manager"]

    # Payment
    payment_cycle = models.CharField(max_length=20, default='monthly')  # weekly, bi-weekly, monthly
    company_upi_id = models.CharField(max_length=255, blank=True, default='')

    # Feature flags
    feature_flags = models.JSONField(default=dict, blank=True)
    # Example: {"learning_phase": true, "stipend": true, "task_self_creation": false, "ai_features": true}

    # SLA defaults
    sla_default_hours = models.IntegerField(default=48)
    escalation_delay_hours = models.IntegerField(default=24)

    # Upload restrictions
    allowed_upload_types = models.JSONField(default=list, blank=True)
    max_upload_size_mb = models.IntegerField(default=10)

    # Notification templates
    notification_templates = models.JSONField(default=dict, blank=True)

    # AI feature toggles per role
    ai_feature_config = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Config: {self.entity.name}"


# =============================================================================
# Role Delegation
# =============================================================================

class RoleDelegation(models.Model):
    """Temporary permission delegation from one user to another."""
    delegator = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='delegations_given')
    delegate = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='delegations_received')
    permissions = models.JSONField(default=list)  # List of permission strings
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    reason = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Delegation: {self.delegator.emp_id} → {self.delegate.emp_id}"

    @property
    def is_expired(self):
        return timezone.now() > self.end_date


# =============================================================================
# Certificates
# =============================================================================

class Certificate(models.Model):
    """Generated certificate record."""
    CERT_TYPE_CHOICES = [
        ('completion', 'Completion Certificate'),
        ('offer_letter', 'Offer Letter'),
        ('task', 'Task Certificate'),
        ('attendance', 'Attendance Certificate'),
        ('partial', 'Partial Completion Certificate'),
    ]

    intern = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='certificates')
    cert_type = models.CharField(max_length=20, choices=CERT_TYPE_CHOICES)
    file = models.FileField(upload_to='certificates/', null=True, blank=True)
    generated_by = models.ForeignKey(
        UserProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='generated_certificates'
    )
    metadata = models.JSONField(default=dict, blank=True)  # Extra data used in generation
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-generated_at']

    def __str__(self):
        return f"Certificate: {self.intern.emp_id} — {self.get_cert_type_display()}"


# =============================================================================
# Promotion History
# =============================================================================

class Promotion(models.Model):
    """Records intern promotion through the pathway."""
    intern = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='promotions')
    from_scheme = models.CharField(max_length=20, choices=UserProfile.SCHEME_CHOICES)
    to_scheme = models.CharField(max_length=20, choices=UserProfile.SCHEME_CHOICES)
    from_role = models.CharField(max_length=20, choices=UserProfile.ROLE_CHOICES, blank=True, default='')
    to_role = models.CharField(max_length=20, choices=UserProfile.ROLE_CHOICES, blank=True, default='')
    approved_by = models.ForeignKey(
        UserProfile, on_delete=models.SET_NULL, null=True, related_name='approved_promotions'
    )
    basis = models.TextField(blank=True, default='')  # Performance basis for promotion
    promoted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-promoted_at']

    def __str__(self):
        return f"Promotion: {self.intern.emp_id} — {self.from_scheme} → {self.to_scheme}"


# =============================================================================
# OTP for Password Reset
# =============================================================================

class PasswordResetOTP(models.Model):
    """OTP storage for password reset flow."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_otps')
    otp = models.CharField(max_length=6)
    is_verified = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

class LoginOTP(models.Model):
    """OTP storage for login verification flow."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='login_otps')
    otp = models.CharField(max_length=6)
    is_verified = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at
