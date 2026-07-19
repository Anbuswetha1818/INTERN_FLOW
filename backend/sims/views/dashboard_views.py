"""
SIMS — Dashboard Summary Views
"""
from django.db.models import Count, Sum, Q
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from ..models import UserProfile, AttendanceRecord, PaymentRecord
from ..permissions import IsStaffOrAbove


class AdminDashboardSummaryView(APIView):
    """GET /Sims/admin/dashboard-summary/"""
    permission_classes = [IsAuthenticated, IsStaffOrAbove]

    def get(self, request):
        profile = request.user.profile
        date = request.query_params.get('date', str(timezone.now().date()))

        interns = UserProfile.objects.filter(role='intern', is_deleted=False)
        if not profile.is_global_admin():
            interns = interns.filter(entity=profile.entity)

        # Intern counts
        intern_counts = {
            'total': interns.count(),
            'active': interns.filter(user_status__in=['active', 'inprogress']).count(),
            'completed': interns.filter(user_status='completed').count(),
            'yet_to_join': interns.filter(user_status='yettojoin').count(),
            'on_leave': interns.filter(user_status='onleave').count(),
            'discontinued': interns.filter(user_status='discontinued').count(),
        }

        # Attendance for date
        att = AttendanceRecord.objects.filter(date=date)
        if not profile.is_global_admin():
            att = att.filter(user__entity=profile.entity)
        active_count = intern_counts['active']
        present = att.filter(status='present').count()
        attendance = {
            'pct': round((present / active_count * 100), 1) if active_count > 0 else 0,
            'present': present,
            'total_active': active_count,
        }

        # Payment summary
        payments = PaymentRecord.objects.all()
        if not profile.is_global_admin():
            payments = payments.filter(entity=profile.entity)
        payment_summary = {
            'completed': payments.filter(status='paid').count(),
            'pending': payments.filter(status='pending').count(),
            'overdue': payments.filter(status='overdue').count(),
            'total_amount': float(payments.filter(status='paid').aggregate(s=Sum('amount'))['s'] or 0),
        }

        # Monthly payments for the last 6 months
        import datetime
        now = timezone.now()
        months_data = []
        for i in range(5, -1, -1):
            month = now.month - i
            year = now.year
            while month <= 0:
                month += 12
                year -= 1
            month_payments = payments.filter(status='paid').filter(
                Q(payment_date__year=year, payment_date__month=month) |
                Q(payment_date__isnull=True, created_at__year=year, created_at__month=month)
            )
            stipends = float(month_payments.filter(scheme='stipend').aggregate(s=Sum('amount'))['s'] or 0)
            reimbursements = float(month_payments.filter(scheme='paid').aggregate(s=Sum('amount'))['s'] or 0)
            other = float(month_payments.filter(Q(scheme='') | Q(scheme='free') | Q(scheme__isnull=True)).aggregate(s=Sum('amount'))['s'] or 0)
            month_name = datetime.date(year, month, 1).strftime('%b')
            months_data.append({
                'month': month_name,
                'stipends': stipends,
                'reimbursements': reimbursements,
                'other': other
            })

        # Domain active counts
        domain_counts = list(
            interns.filter(user_status__in=['active', 'inprogress'])
            .values('domain__name')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        return Response({
            'intern_counts': intern_counts,
            'attendance': attendance,
            'payment_summary': payment_summary,
            'dept_active_counts': domain_counts,
            'monthly_payments': months_data,
        })


class DashboardView(APIView):
    """GET /Sims/dashboard/ — General dashboard data."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = request.user.profile
        if profile.role == 'intern':
            tasks = profile.assigned_tasks.filter(is_deleted=False)
            return Response({
                'total_tasks': tasks.count(),
                'completed_tasks': tasks.filter(status__in=['completed', 'verified']).count(),
                'pending_tasks': tasks.filter(status='todo').count(),
                'in_progress_tasks': tasks.filter(status='inprogress').count(),
            })
        return Response({'message': 'Use /admin/dashboard-summary/ for staff dashboards'})
