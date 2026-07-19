"""
SIMS — Signals for automatic notifications and audit logging.
"""

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone

from .models import (
    Task, LeaveRequest, AttendanceClaim, Document,
    PaymentRecord, Notification, OnboardingSubmission, AssetIssue
)


@receiver(post_save, sender=Task)
def notify_task_assignment(sender, instance, created, **kwargs):
    """Notify intern when a task is assigned to them."""
    if created and instance.assigned_to:
        Notification.objects.create(
            user=instance.assigned_to,
            title='New Task Assigned',
            message=f'You have been assigned a new task: "{instance.title}"',
            notification_type='task_assigned',
            priority='attention',
            related_type='task',
            related_id=instance.pk,
        )


@receiver(pre_save, sender=Task)
def notify_task_status_change(sender, instance, **kwargs):
    """Notify on task status change."""
    if instance.pk:
        try:
            old_instance = Task.objects.get(pk=instance.pk)
            if old_instance.status != instance.status and instance.assigned_to:
                Notification.objects.create(
                    user=instance.assigned_to,
                    title='Task Status Updated',
                    message=f'Task "{instance.title}" status changed to {instance.get_status_display()}',
                    notification_type='task_status',
                    priority='informational',
                    related_type='task',
                    related_id=instance.pk,
                )
        except Task.DoesNotExist:
            pass


@receiver(pre_save, sender=LeaveRequest)
def notify_leave_status(sender, instance, **kwargs):
    """Notify intern when leave is approved or rejected."""
    if instance.pk:
        try:
            old_instance = LeaveRequest.objects.get(pk=instance.pk)
            if old_instance.status != instance.status and instance.status in ('approved', 'rejected'):
                Notification.objects.create(
                    user=instance.user,
                    title=f'Leave {instance.status.title()}',
                    message=f'Your leave request from {instance.start_date} to {instance.end_date} has been {instance.status}.',
                    notification_type='leave_status',
                    priority='attention',
                    related_type='leave_request',
                    related_id=instance.pk,
                )
        except LeaveRequest.DoesNotExist:
            pass


@receiver(pre_save, sender=AttendanceClaim)
def notify_claim_status(sender, instance, **kwargs):
    """Notify intern when attendance claim is approved or rejected."""
    if instance.pk:
        try:
            old_instance = AttendanceClaim.objects.get(pk=instance.pk)
            if old_instance.status != instance.status and instance.status in ('approved', 'rejected'):
                Notification.objects.create(
                    user=instance.user,
                    title=f'Attendance Claim {instance.status.title()}',
                    message=f'Your attendance claim for {instance.date} has been {instance.status}.',
                    notification_type='attendance_claim',
                    priority='informational',
                    related_type='attendance_claim',
                    related_id=instance.pk,
                )
        except AttendanceClaim.DoesNotExist:
            pass


@receiver(pre_save, sender=Document)
def notify_document_status(sender, instance, **kwargs):
    """Notify intern when document is approved or rejected."""
    if instance.pk:
        try:
            old_instance = Document.objects.get(pk=instance.pk)
            if old_instance.status != instance.status and instance.status in ('approved', 'rejected'):
                Notification.objects.create(
                    user=instance.user,
                    title=f'Document {instance.status.title()}',
                    message=f'Your {instance.get_doc_type_display()} has been {instance.status}.',
                    notification_type='document_status',
                    priority='attention',
                    related_type='document',
                    related_id=instance.pk,
                )
        except Document.DoesNotExist:
            pass


@receiver(pre_save, sender=PaymentRecord)
def notify_payment_status(sender, instance, **kwargs):
    """Notify intern when payment status changes."""
    if instance.pk:
        try:
            old_instance = PaymentRecord.objects.get(pk=instance.pk)
            if old_instance.status != instance.status:
                Notification.objects.create(
                    user=instance.user,
                    title=f'Payment {instance.status.title()}',
                    message=f'Your payment of ₹{instance.amount} has been marked as {instance.status}.',
                    notification_type='payment_status',
                    priority='attention',
                    related_type='payment',
                    related_id=instance.pk,
                )
        except PaymentRecord.DoesNotExist:
            pass


@receiver(post_save, sender=PaymentRecord)
def notify_payment_created(sender, instance, created, **kwargs):
    """Notify intern when a new payment is requested."""
    if created:
        Notification.objects.create(
            user=instance.user,
            title='Payment Requested',
            message=f'A fee payment of ₹{instance.amount} has been requested.',
            notification_type='payment_status',
            priority='attention',
            related_type='payment',
            related_id=instance.pk,
        )


@receiver(post_save, sender=OnboardingSubmission)
def notify_onboarding_submission(sender, instance, created, **kwargs):
    """Notify only managers when a new intern onboarding submission is received."""
    if created:
        from .models import UserProfile
        staff_users = UserProfile.objects.filter(
            role='manager',
            is_deleted=False,
            user_status='active'
        )
        for staff in staff_users:
            Notification.objects.create(
                user=staff,
                title='New Internship Application',
                message=f'New internship application received from {instance.full_name} ({instance.email}).',
                notification_type='general',
                priority='attention',
                related_type='onboarding_submission',
                related_id=instance.pk,
            )


@receiver(post_save, sender=AssetIssue)
def notify_sme_asset_damage(sender, instance, created, **kwargs):
    """Notify all SMEs when an asset damage is reported."""
    if created and instance.issue_type == 'damage':
        from .models import UserProfile
        sme_users = UserProfile.objects.filter(
            role='sme',
            is_deleted=False,
            user_status='active'
        )
        assigned_intern = instance.asset.assigned_to
        intern_name = assigned_intern.full_name if assigned_intern else "Unassigned"
        
        for sme in sme_users:
            Notification.objects.create(
                user=sme,
                title='Asset Damage Reported',
                message=(
                    f"Asset {instance.asset.asset_code} ({instance.asset.name}) assigned to {intern_name} "
                    f"has been reported as damaged. Type: {instance.damage_type}. "
                    f"Notes: {instance.description}"
                ),
                notification_type='escalation',
                priority='critical',
                related_type='asset_issue',
                related_id=instance.pk,
            )


@receiver(post_save, sender=LeaveRequest)
def notify_sme_leave_request(sender, instance, created, **kwargs):
    """Notify SMEs of the intern's entity when a new leave request is created."""
    if created:
        from .models import UserProfile
        intern = instance.user
        sme_users = UserProfile.objects.filter(
            role='sme',
            entity=intern.entity,
            is_deleted=False,
            user_status='active'
        )
        # If no SMEs in this entity, fallback to all active SMEs
        if not sme_users.exists():
            sme_users = UserProfile.objects.filter(
                role='sme',
                is_deleted=False,
                user_status='active'
            )
        
        for sme in sme_users:
            Notification.objects.create(
                user=sme,
                title='New Leave Request',
                message=f'Intern {intern.full_name} ({intern.emp_id}) has requested leave from {instance.start_date} to {instance.end_date}. Reason: {instance.reason}',
                notification_type='leave_status',
                priority='attention',
                related_type='leave_request',
                related_id=instance.pk,
            )


@receiver(post_save, sender=AttendanceClaim)
def notify_sme_attendance_claim(sender, instance, created, **kwargs):
    """Notify SMEs of the intern's entity when a new attendance claim is created."""
    if created:
        from .models import UserProfile
        intern = instance.user
        sme_users = UserProfile.objects.filter(
            role='sme',
            entity=intern.entity,
            is_deleted=False,
            user_status='active'
        )
        if not sme_users.exists():
            sme_users = UserProfile.objects.filter(
                role='sme',
                is_deleted=False,
                user_status='active'
            )
        
        for sme in sme_users:
            Notification.objects.create(
                user=sme,
                title='New Attendance Claim',
                message=f'Intern {intern.full_name} ({intern.emp_id}) has requested attendance correction for {instance.date}. Reason: {instance.reason}',
                notification_type='attendance_claim',
                priority='attention',
                related_type='attendance_claim',
                related_id=instance.pk,
            )
