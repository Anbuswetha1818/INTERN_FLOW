"""
SIMS — Role-Based Permission Classes
Every action is gated by the permission engine.

Role mapping:
  superadmin → Admin      (view all, add staff)
  manager    → Manager    (intern approval, certs, payment history, asset view)
  lead       → SME        (all domains, projects, payment management)
  mentor     → Mentor     (single domain, team, tasks, leave approval)
  intern     → Intern     (self-service only)
"""

from rest_framework import permissions


# =============================================================================
# Core Role Permission Classes
# =============================================================================

class IsAdmin(permissions.BasePermission):
    """Only Super Admins or Admins have access."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, 'profile')
            and request.user.profile.role in ('superadmin', 'admin')
        )


# Keep old name as alias for backward compatibility
IsSuperAdmin = IsAdmin


class IsManager(permissions.BasePermission):
    """Only Managers have access."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, 'profile')
            and request.user.profile.role == 'manager'
        )


class IsSME(permissions.BasePermission):
    """Only SMEs (sme role) have access — all domains, projects, payments."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, 'profile')
            and request.user.profile.role == 'sme'
        )


class IsMentorOnly(permissions.BasePermission):
    """Only Mentors have access."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, 'profile')
            and request.user.profile.role == 'mentor'
        )


class IsIntern(permissions.BasePermission):
    """Only interns have access."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, 'profile')
            and request.user.profile.role == 'intern'
        )


# =============================================================================
# Composite Permission Classes (role tiers)
# =============================================================================

class IsManagerOrAbove(permissions.BasePermission):
    """Manager, Admin, or Super Admin access."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, 'profile')
            and request.user.profile.role in ('superadmin', 'admin', 'manager')
        )


# Keep old name for backward compatibility
IsSuperAdminOrManager = IsManagerOrAbove


class IsSMEOrAbove(permissions.BasePermission):
    """SME, Manager, Admin, or Super Admin access."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, 'profile')
            and request.user.profile.role in ('superadmin', 'admin', 'manager', 'sme')
        )


class IsMentorOrAbove(permissions.BasePermission):
    """Mentor, SME, Manager, Admin, or Super Admin access."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, 'profile')
            and request.user.profile.role in ('superadmin', 'admin', 'manager', 'sme', 'mentor')
        )


class IsLeadOrAbove(permissions.BasePermission):
    """Lead/SME, Manager, Admin, or Super Admin access."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, 'profile')
            and request.user.profile.role in ('superadmin', 'admin', 'manager', 'sme')
        )


class IsStaffOrAbove(permissions.BasePermission):
    """Any staff role (not intern) has access."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and hasattr(request.user, 'profile')
            and request.user.profile.role in ('superadmin', 'admin', 'manager', 'sme', 'mentor', 'staff')
        )


# =============================================================================
# Object-level Permission Classes
# =============================================================================

class IsOwnerOrStaff(permissions.BasePermission):
    """Owner of the resource or staff member."""
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated or not hasattr(request.user, 'profile'):
            return False
        profile = request.user.profile
        if profile.is_staff_role:
            return True
        if hasattr(obj, 'user'):
            return obj.user == profile
        if hasattr(obj, 'intern'):
            return obj.intern == profile
        if hasattr(obj, 'assigned_to'):
            return obj.assigned_to == profile
        return False


class EntityScopedPermission(permissions.BasePermission):
    """
    Filters access to data within the user's entity.
    Admin sees all; others see only their entity's data.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and hasattr(request.user, 'profile')

    def has_object_permission(self, request, view, obj):
        profile = request.user.profile
        if profile.is_global_admin():
            return True
        if hasattr(obj, 'entity'):
            return obj.entity == profile.entity
        if hasattr(obj, 'user') and hasattr(obj.user, 'entity'):
            return obj.user.entity == profile.entity
        return True


class DomainScopedPermission(permissions.BasePermission):
    """
    SME can access all domains.
    Mentor can only access data within their own domain.
    Manager and Admin bypass this.
    """
    def has_object_permission(self, request, view, obj):
        profile = request.user.profile
        if profile.role in ('superadmin', 'admin', 'manager', 'sme'):
            return True
        if profile.role == 'mentor' and hasattr(obj, 'domain'):
            return obj.domain == profile.domain
        return True


class AssignedInternPermission(permissions.BasePermission):
    """
    Mentors can only access interns assigned to their teams.
    SME can access interns in their domain.
    """
    def has_object_permission(self, request, view, obj):
        profile = request.user.profile
        if profile.role in ('superadmin', 'admin', 'manager'):
            return True
        if profile.role == 'sme':
            # SME sees all interns in their domain(s)
            if hasattr(obj, 'domain'):
                return True  # SME has all-domain access
            return True
        if profile.role == 'mentor':
            mentor_teams = profile.led_teams.all()
            if hasattr(obj, 'user'):
                return obj.user.teams.filter(id__in=mentor_teams).exists()
            if hasattr(obj, 'intern'):
                return obj.intern.teams.filter(id__in=mentor_teams).exists()
            if hasattr(obj, 'assigned_to'):
                return obj.assigned_to.teams.filter(id__in=mentor_teams).exists()
        return True


# =============================================================================
# Dashboard Access Flags — checked on every protected route mount
# =============================================================================

def get_user_permissions(user_profile):
    """
    Returns dashboard access flags and fine-grained permissions for a user.
    Called by GET /Sims/user-permissions/

    Role → Permission mapping:
      superadmin (Admin)  : View all data + transactions, add staff
      manager (Manager)   : Intern approval, payment history view, cert approval, asset view
      lead (SME)          : All domains, create/assign projects, manage & finalize payments
      mentor (Mentor)     : Own domain, create team, assign tasks, approve leave
      intern              : Self-service only
    """
    role = user_profile.role

    permissions_map = {
        # -----------------------------------------------------------------
        # ADMIN (superadmin) — view everything, add staff, no operational mgmt
        # -----------------------------------------------------------------
        'superadmin': {
            # Dashboard access
            'hasAdminAccess': True,
            'hasInternAccess': True,
            'hasAssetAccess': True,
            'hasAttendanceAccess': True,
            'hasPayrollAccess': True,
            'hasTaskAccess': True,
            'hasAIAccess': True,
            # Staff management
            'canRegisterStaff': True,       # Admin adds manager/SME/mentor/staff
            'canManageStaff': True,
            'canCreateEntity': True,
            'canConfigureEntity': True,
            'canBulkImport': True,
            'canViewAuditLog': True,
            'canManageDelegation': True,
            # Intern lifecycle — view only for admin
            'canApproveOnboarding': True,
            'canApproveCertificates': True,
            'canGenerateCertificates': True,
            # Payments — view only
            'canViewPaymentHistory': True,
            'canManagePaymentStatus': True,
            'canFinalizePayments': True,
            # Projects & tasks — admin does not create
            'canCreateProject': True,
            'canAssignProjectToMentor': True,
            'canAssignTasks': True,
            # Teams
            'canCreateTeam': True,
            'canAssignTeamLead': True,
            # Leave
            'canApproveLeave': True,
            # Domain access
            'canAccessAllDomains': True,
            'canAccessOwnDomainOnly': False,
        },

        'admin': {
            # Dashboard access
            'hasAdminAccess': True,
            'hasInternAccess': True,
            'hasAssetAccess': True,
            'hasAttendanceAccess': True,
            'hasPayrollAccess': True,
            'hasTaskAccess': True,
            'hasAIAccess': True,
            # Staff management
            'canRegisterStaff': True,       # Admin adds manager/SME/mentor/staff
            'canManageStaff': True,
            'canCreateEntity': True,
            'canConfigureEntity': True,
            'canBulkImport': True,
            'canViewAuditLog': True,
            'canManageDelegation': True,
            # Intern lifecycle — view only for admin
            'canApproveOnboarding': False,
            'canApproveCertificates': False,
            'canGenerateCertificates': False,
            # Payments — view only
            'canViewPaymentHistory': True,
            'canManagePaymentStatus': False,
            'canFinalizePayments': False,
            # Projects & tasks — admin does not create
            'canCreateProject': False,
            'canAssignProjectToMentor': False,
            'canAssignTasks': False,
            # Teams
            'canCreateTeam': False,
            'canAssignTeamLead': False,
            # Leave
            'canApproveLeave': False,
            # Domain access
            'canAccessAllDomains': True,
            'canAccessOwnDomainOnly': False,
        },

        # -----------------------------------------------------------------
        # MANAGER — intern approval, payment history (read), cert approval, asset view
        # -----------------------------------------------------------------
        'manager': {
            'hasAdminAccess': True,
            'hasInternAccess': True,
            'hasAssetAccess': True,         # view asset details
            'hasAttendanceAccess': True,
            'hasPayrollAccess': True,       # view payment history
            'hasTaskAccess': False,
            'hasAIAccess': False,
            # Staff management — manager cannot add staff
            'canRegisterStaff': False,
            'canManageStaff': False,
            'canCreateEntity': False,
            'canConfigureEntity': False,
            'canBulkImport': False,
            'canViewAuditLog': False,
            'canManageDelegation': False,
            # Intern lifecycle
            'canApproveOnboarding': True,   # approve intern onboarding
            'canApproveCertificates': True, # approve certificates for completed interns
            'canGenerateCertificates': True,
            # Payments — view only, no modification
            'canViewPaymentHistory': True,
            'canManagePaymentStatus': False,
            'canFinalizePayments': False,
            # Projects & tasks — no access
            'canCreateProject': False,
            'canAssignProjectToMentor': False,
            'canAssignTasks': False,
            # Teams — no access
            'canCreateTeam': False,
            'canAssignTeamLead': False,
            # Leave — no direct approval
            'canApproveLeave': False,
            # Domain access — all (to review interns)
            'canAccessAllDomains': True,
            'canAccessOwnDomainOnly': False,
        },

        # -----------------------------------------------------------------
        # SME (sme) — all domains, create projects, assign mentors, manage payments
        # -----------------------------------------------------------------
        'sme': {
            'hasAdminAccess': True,
            'hasInternAccess': True,
            'hasAssetAccess': False,
            'hasAttendanceAccess': False,
            'hasPayrollAccess': True,       # manage payment status
            'hasTaskAccess': True,          # create projects
            'hasAIAccess': False,
            # Staff management — no
            'canRegisterStaff': False,
            'canManageStaff': False,
            'canCreateEntity': False,
            'canConfigureEntity': False,
            'canBulkImport': False,
            'canViewAuditLog': False,
            'canManageDelegation': False,
            # Intern lifecycle — no
            'canApproveOnboarding': False,
            'canApproveCertificates': False,
            'canGenerateCertificates': False,
            # Payments — full management
            'canViewPaymentHistory': True,
            'canManagePaymentStatus': True, # update pending → paid etc.
            'canFinalizePayments': True,    # finalize intern payments
            # Projects — SME creates and assigns
            'canCreateProject': True,
            'canAssignProjectToMentor': True,
            'canAssignTasks': False,        # mentor assigns tasks, not SME
            # Teams — no
            'canCreateTeam': False,
            'canAssignTeamLead': False,
            # Leave — no
            'canApproveLeave': False,
            # Domain access — all domains
            'canAccessAllDomains': True,
            'canAccessOwnDomainOnly': False,
        },

        # -----------------------------------------------------------------
        # MENTOR — single domain, team management, tasks, leave approval
        # -----------------------------------------------------------------
        'mentor': {
            'hasAdminAccess': True,
            'hasInternAccess': True,        # own team interns
            'hasAssetAccess': False,
            'hasAttendanceAccess': True,    # for leave approval
            'hasPayrollAccess': False,
            'hasTaskAccess': True,          # assign tasks
            'hasAIAccess': False,
            # Staff management — no
            'canRegisterStaff': False,
            'canManageStaff': False,
            'canCreateEntity': False,
            'canConfigureEntity': False,
            'canBulkImport': False,
            'canViewAuditLog': False,
            'canManageDelegation': False,
            # Intern lifecycle — no
            'canApproveOnboarding': False,
            'canApproveCertificates': False,
            'canGenerateCertificates': False,
            # Payments — no
            'canViewPaymentHistory': False,
            'canManagePaymentStatus': False,
            'canFinalizePayments': False,
            # Projects — no create, can view assigned
            'canCreateProject': False,
            'canAssignProjectToMentor': False,
            'canAssignTasks': True,         # assign tasks from project to interns
            # Teams — full control
            'canCreateTeam': True,
            'canAssignTeamLead': True,      # assign team lead from intern pool
            # Leave — approve/reject for own team
            'canApproveLeave': True,
            # Domain access — own domain only
            'canAccessAllDomains': False,
            'canAccessOwnDomainOnly': True,
        },

        # -----------------------------------------------------------------
        # STAFF — limited view, no operational access
        # -----------------------------------------------------------------
        'staff': {
            'hasAdminAccess': False,
            'hasInternAccess': True,
            'hasAssetAccess': False,
            'hasAttendanceAccess': True,
            'hasPayrollAccess': False,
            'hasTaskAccess': False,
            'hasAIAccess': False,
            'canRegisterStaff': False,
            'canManageStaff': False,
            'canCreateEntity': False,
            'canConfigureEntity': False,
            'canBulkImport': False,
            'canViewAuditLog': False,
            'canManageDelegation': False,
            'canApproveOnboarding': False,
            'canApproveCertificates': False,
            'canGenerateCertificates': False,
            'canViewPaymentHistory': False,
            'canManagePaymentStatus': False,
            'canFinalizePayments': False,
            'canCreateProject': False,
            'canAssignProjectToMentor': False,
            'canAssignTasks': False,
            'canCreateTeam': False,
            'canAssignTeamLead': False,
            'canApproveLeave': False,
            'canAccessAllDomains': False,
            'canAccessOwnDomainOnly': False,
        },

        # -----------------------------------------------------------------
        # INTERN — self-service only
        # -----------------------------------------------------------------
        'intern': {
            'hasAdminAccess': False,
            'hasInternAccess': False,
            'hasAssetAccess': False,
            'hasAttendanceAccess': False,
            'hasPayrollAccess': False,
            'hasTaskAccess': False,
            'hasAIAccess': True,
            'canRegisterStaff': False,
            'canManageStaff': False,
            'canCreateEntity': False,
            'canConfigureEntity': False,
            'canBulkImport': False,
            'canViewAuditLog': False,
            'canManageDelegation': False,
            'canApproveOnboarding': False,
            'canApproveCertificates': False,
            'canGenerateCertificates': False,
            'canViewPaymentHistory': False,
            'canManagePaymentStatus': False,
            'canFinalizePayments': False,
            'canCreateProject': False,
            'canAssignProjectToMentor': False,
            'canAssignTasks': False,
            'canCreateTeam': False,
            'canAssignTeamLead': False,
            'canApproveLeave': False,
            'canAccessAllDomains': False,
            'canAccessOwnDomainOnly': False,
        },
    }

    perms = permissions_map.get(role, permissions_map['intern']).copy()
    
    custom_perms = user_profile.custom_permissions or {}
    
    if custom_perms.get('manage_interns') in ('none', False):
        perms['hasInternAccess'] = False
    if custom_perms.get('manage_assets') in ('none', False):
        perms['hasAssetAccess'] = False
    if custom_perms.get('manage_attendance') in ('none', False):
        perms['hasAttendanceAccess'] = False
    if custom_perms.get('manage_projects') in ('none', False):
        perms['hasTaskAccess'] = False
    if custom_perms.get('manage_payments') in ('none', False):
        perms['hasPayrollAccess'] = False
        perms['canViewPaymentHistory'] = False

    perms['manage_interns_level'] = custom_perms.get('manage_interns', 'all')
    perms['manage_assets_level'] = custom_perms.get('manage_assets', 'all')
    perms['manage_attendance_level'] = custom_perms.get('manage_attendance', 'all')
    perms['manage_projects_level'] = custom_perms.get('manage_projects', 'all')
    perms['manage_payments_level'] = custom_perms.get('manage_payments', 'all')

    # Intern features
    if role == 'intern':
        perms['intern_feature_performance'] = custom_perms.get('intern_feature_performance', True)
        perms['intern_feature_ai_assistant'] = custom_perms.get('intern_feature_ai_assistant', True)
        perms['intern_feature_ai_interview'] = custom_perms.get('intern_feature_ai_interview', True)
        perms['intern_feature_resume_builder'] = custom_perms.get('intern_feature_resume_builder', True)
        perms['intern_feature_exit_summary'] = custom_perms.get('intern_feature_exit_summary', True)
        perms['intern_feature_learning'] = custom_perms.get('intern_feature_learning', True)

    return perms
