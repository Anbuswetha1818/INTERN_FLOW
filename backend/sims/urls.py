"""
SIMS — URL Configuration
100+ endpoints covering the complete API surface.
"""

from django.urls import path
from .views import *

urlpatterns = [
    # =========================================================================
    # Authentication
    # =========================================================================
    path('login/', LoginView.as_view(), name='login'),
    path('login/verify-otp/', LoginVerifyOTPView.as_view(), name='login-verify-otp'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('register/', RegisterView.as_view(), name='register'),
    path('password-reset/request/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset/verify/', PasswordResetVerifyView.as_view(), name='password-reset-verify'),
    path('password-reset/update/', PasswordResetUpdateView.as_view(), name='password-reset-update'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
    path('user-permissions/', UserPermissionsView.as_view(), name='user-permissions'),

    # =========================================================================
    # Users & Profiles
    # =========================================================================
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/bulk-import/', BulkImportView.as_view(), name='bulk-import'),
    path('interns/', InternListView.as_view(), name='intern-list'),
    path('interns/stats/', InternStatsView.as_view(), name='intern-stats'),
    path('interns/full-list/', InternFullListView.as_view(), name='intern-full-list'),
    path('all-user-data/', UserListView.as_view(), name='all-user-data'),
    path('user-data/<str:emp_id>/', UserDataView.as_view(), name='user-data'),
    path('user/update/<str:emp_id>/', UserUpdateView.as_view(), name='user-update'),
    path('fulldetail/', FullDetailView.as_view(), name='full-detail'),
    path('staffs-details/', StaffDetailsView.as_view(), name='staffs-details'),
    path('staffs/', StaffListView.as_view(), name='staffs'),
    path('users/reporting-staff/', ReportingStaffView.as_view(), name='reporting-staff'),
    path('deleted-users/', DeletedUsersView.as_view(), name='deleted-users'),
    path('next-emp-id/', NextEmpIdView.as_view(), name='next-emp-id'),
    path('intern-count-by-domain/', InternCountByDomainView.as_view(), name='intern-count-by-domain'),
    path('intern-task-summary/', InternTaskSummaryView.as_view(), name='intern-task-summary'),
    path('personal-data/<str:emp_id>/', PersonalDataView.as_view(), name='personal-data'),
    path('college-details/<str:emp_id>/', CollegeDetailsView.as_view(), name='college-details'),

    # Profile Update Requests
    path('submit-personal-update/', SubmitPersonalUpdateView.as_view(), name='submit-personal-update'),
    path('profile-update-request/', ProfileUpdateRequestListView.as_view(), name='profile-update-request'),
    path('approve-profile/<int:pk>/', ApproveProfileView.as_view(), name='approve-profile'),
    path('reject-profile/<int:pk>/', RejectProfileView.as_view(), name='reject-profile'),

    # Onboarding
    path('onboarding/submit/', OnboardingSubmitView.as_view(), name='onboarding-submit'),
    path('onboarding/list/', OnboardingListView.as_view(), name='onboarding-list'),
    path('onboarding/enable/<int:response_id>/', OnboardingEnableView.as_view(), name='onboarding-enable'),
    path('onboarding/send_credentials/<str:intern_id>/', OnboardingSendCredentialsView.as_view(), name='onboarding-send-credentials'),

    # Promotions
    path('promotions/', PromotionListView.as_view(), name='promotions'),

    # =========================================================================
    # Organization Hierarchy
    # =========================================================================
    path('entities/', EntityListCreateView.as_view(), name='entities'),
    path('entities/<int:pk>/', EntityDetailView.as_view(), name='entity-detail'),
    path('branches/', BranchListCreateView.as_view(), name='branches'),
    path('branches/<int:pk>/', BranchDetailView.as_view(), name='branch-detail'),
    path('domains/', DomainListCreateView.as_view(), name='domains'),
    path('domains/<int:pk>/', DomainDetailView.as_view(), name='domain-detail'),
    path('entity-hierarchy/', EntityHierarchyView.as_view(), name='entity-hierarchy'),
    path('entity-config/<int:entity_id>/', EntityConfigView.as_view(), name='entity-config'),

    # =========================================================================
    # Attendance
    # =========================================================================
    path('attendance/', AttendanceListView.as_view(), name='attendance-list'),
    path('attendances/user/', UserAttendanceView.as_view(), name='user-attendance'),
    path('attendance/live-on/', LiveCheckInView.as_view(), name='live-check-in'),
    path('attendance/live-off/', LiveCheckOutView.as_view(), name='live-check-out'),
    path('attendance/break-start/', BreakStartView.as_view(), name='break-start'),
    path('attendance/break-end/', BreakEndView.as_view(), name='break-end'),
    path('attendance/<str:emp_id>/', AttendanceByUserView.as_view(), name='attendance-by-user'),
    path('attendancedaterange/', AttendanceDateRangeView.as_view(), name='attendance-date-range'),
    path('simpleattendancedata/', SimpleAttendanceDataView.as_view(), name='simple-attendance'),
    path('attendanceanalysis/', AttendanceAnalysisView.as_view(), name='attendance-analysis'),

    # Leave
    path('attendances/leave_request/', LeaveRequestView.as_view(), name='leave-request'),
    path('attendances/leave_request/<int:pk>/', LeaveRequestDetailView.as_view(), name='leave-request-detail'),
    path('attendances/leave_history/', LeaveHistoryView.as_view(), name='leave-history'),
    path('attendances/leave_history/<str:emp_id>/', LeaveHistoryByUserView.as_view(), name='leave-history-user'),
    path('attendances/leave_approval/', LeaveApprovalListView.as_view(), name='leave-approval-list'),
    path('attendances/leave_approval/<int:leave_id>/', LeaveApprovalView.as_view(), name='leave-approval'),
    path('attendances/leave_balance/', LeaveBalanceView.as_view(), name='leave-balance'),
    path('leave-status/', LeaveStatusView.as_view(), name='leave-status'),

    # Claims
    path('attendance-claims/', AttendanceClaimListCreateView.as_view(), name='attendance-claims'),
    path('attendance-claims/my-claims/', MyClaimsView.as_view(), name='my-claims'),
    path('attendance-claims/pending-approval/', PendingClaimsView.as_view(), name='pending-claims'),
    path('attendance-claims/<int:pk>/approve/', ApproveClaimView.as_view(), name='approve-claim'),
    path('attendance-claims/<int:pk>/reject/', RejectClaimView.as_view(), name='reject-claim'),

    # =========================================================================
    # Tasks & Projects
    # =========================================================================
    path('tasks/', TaskListCreateView.as_view(), name='tasks'),
    path('tasks/<int:pk>/', TaskDetailView.as_view(), name='task-detail'),
    path('tasks/<int:pk>/update-status-auto-next/', TaskStatusAutoNextView.as_view(), name='task-auto-next'),
    path('tasks/due-today/', DueTodayTasksView.as_view(), name='due-today'),
    path('tasks/assigned-history/', TaskAssignedHistoryView.as_view(), name='assigned-history'),
    path('tasks/monthly-count/', MonthlyTaskCountView.as_view(), name='monthly-count'),
    path('tasks/weekly-performance/', WeeklyPerformanceView.as_view(), name='weekly-performance'),
    path('completion-review/', CompletionReviewView.as_view(), name='completion-review'),

    # Projects
    path('projects/', ProjectListCreateView.as_view(), name='projects'),
    path('projects/<int:pk>/', ProjectDetailView.as_view(), name='project-detail'),
    path('projects/dashboard/', ProjectDashboardView.as_view(), name='project-dashboard'),
    path('projects/<int:pk>/assign-team/', ProjectAssignTeamView.as_view(), name='project-assign-team'),
    path('projects/<int:pk>/assign-team-lead/', ProjectAssignTeamLeadView.as_view(), name='project-assign-lead'),
    path('team-lead/projects/', TeamLeadProjectsView.as_view(), name='team-lead-projects'),

    # Teams
    path('teams/', TeamListCreateView.as_view(), name='teams'),
    path('teams/<int:pk>/', TeamDetailView.as_view(), name='team-detail'),
    path('teams/<int:team_id>/interns/', TeamInternsView.as_view(), name='team-interns'),
    path('teams/<int:team_id>/assign-interns/', AssignInternsToTeamView.as_view(), name='assign-interns'),
    path('teams/<int:team_id>/remove-intern/', RemoveInternFromTeamView.as_view(), name='remove-intern'),
    path('teams/available-interns/', AvailableInternsView.as_view(), name='available-interns'),
    path('team-leads/', TeamLeadsView.as_view(), name='team-leads'),

    # =========================================================================
    # Assets
    # =========================================================================
    path('assert-stock/', AssetListCreateView.as_view(), name='assets'),
    path('assert-stock/<int:pk>/', AssetDetailView.as_view(), name='asset-detail'),
    path('assert-stock-count/', AssetCountView.as_view(), name='asset-count'),
    path('asset-trend/', AssetTrendView.as_view(), name='asset-trend'),
    path('available-assets/', AvailableAssetsView.as_view(), name='available-assets'),
    path('asset-lookup/<str:code>/', AssetLookupView.as_view(), name='asset-lookup'),
    path('asset-logs/', AssetLogsView.as_view(), name='asset-logs'),
    path('asserthistory/', AssetHistoryView.as_view(), name='asset-history'),
    path('assertuserhistory/', AssetUserHistoryView.as_view(), name='asset-user-history'),
    path('assert-issue/', AssetIssueListCreateView.as_view(), name='asset-issues'),
    path('assert-issue/<int:pk>/replacement-assets/', AssetReplacementView.as_view(), name='replacement-assets'),
    path('assert-issue/<int:pk>/assign-new-asset/', AssetAssignReplacementView.as_view(), name='assign-replacement'),

    # =========================================================================
    # Payments
    # =========================================================================
    path('fees/', PaymentListCreateView.as_view(), name='payments'),
    path('fees/bulk-import/', PaymentBulkImportView.as_view(), name='payment-bulk-import'),
    path('fees/<int:pk>/', PaymentDetailView.as_view(), name='payment-detail'),
    path('fees/<int:pk>/submit/', SubmitPaymentView.as_view(), name='payment-submit'),
    path('fees/<str:emp_id>/', PaymentByUserView.as_view(), name='payment-by-user'),
    path('fee-structure/', FeeStructureListCreateView.as_view(), name='fee-structure'),

    # =========================================================================
    # Documents
    # =========================================================================
    path('documents/', DocumentListCreateView.as_view(), name='documents'),
    path('documents/<int:pk>/', DocumentDetailView.as_view(), name='document-detail'),
    path('documents/emp/<str:emp_id>/', DocumentsByUserView.as_view(), name='documents-by-user'),
    path('documents/<int:pk>/download/', DocumentDownloadView.as_view(), name='document-download'),
    path('approve-document/<int:pk>/', ApproveDocumentView.as_view(), name='approve-document'),
    path('reject-document/<int:pk>/', RejectDocumentView.as_view(), name='reject-document'),
    path('intern-approval-dashboard/', InternApprovalDashboardView.as_view(), name='intern-approval-dashboard'),

    # =========================================================================
    # Feedback & Performance
    # =========================================================================
    path('feedback/', FeedbackListCreateView.as_view(), name='feedback'),
    path('feedback/<int:pk>/', FeedbackDetailView.as_view(), name='feedback-detail'),
    path('performance/', PerformanceView.as_view(), name='performance'),
    path('api/intern/monthly-performance/', MonthlyPerformanceView.as_view(), name='monthly-performance'),
    path('student-staff-feedback/', StudentStaffFeedbackView.as_view(), name='student-staff-feedback'),

    # =========================================================================
    # Certificates
    # =========================================================================
    path('certificates/', CertificateListView.as_view(), name='certificates-list'),
    path('generate-completion-certificate/', GenerateCompletionCertificateView.as_view(), name='gen-completion'),
    path('generate-offer-letter/', GenerateOfferLetterView.as_view(), name='gen-offer'),
    path('generate-task-certificate/', GenerateTaskCertificateView.as_view(), name='gen-task-cert'),
    path('generate-attendance-certificate/', GenerateAttendanceCertificateView.as_view(), name='gen-attendance-cert'),
    path('generate-partial-certificate/', GeneratePartialCertificateView.as_view(), name='gen-partial'),

    # =========================================================================
    # Dashboard & Notifications
    # =========================================================================
    path('dashboard/', DashboardView.as_view(), name='dashboard'),
    path('admin/dashboard-summary/', AdminDashboardSummaryView.as_view(), name='admin-dashboard-summary'),
    path('notifications/', NotificationListView.as_view(), name='notifications'),
    path('notifications/create/', CreateNotificationView.as_view(), name='create-notification'),
    path('notifications/<int:pk>/mark_read/', MarkNotificationReadView.as_view(), name='mark-read'),
    path('notifications/mark_all_read/', MarkAllReadView.as_view(), name='mark-all-read'),

    # =========================================================================
    # Logs
    # =========================================================================
    path('logs/', ActivityLogListView.as_view(), name='logs'),
    path('logs/<str:emp_id>/', ActivityLogByUserView.as_view(), name='logs-by-user'),
]
