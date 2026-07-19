"""
SIMS — Task & Project Management Views
Tasks CRUD, Projects, Teams, Completion Review, Due Today, Performance Stats
"""

from datetime import timedelta
from django.db.models import Count, Q
from django.utils import timezone

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from ..models import (
    Task, Subtask, TaskComment, TaskStatusHistory,
    Project, Team, UserProfile
)
from ..serializers import (
    TaskSerializer, TaskListSerializer, SubtaskSerializer,
    TaskCommentSerializer, TaskStatusHistorySerializer,
    ProjectSerializer, TeamSerializer, UserProfileListSerializer,
)
from ..permissions import IsStaffOrAbove, IsMentorOrAbove, IsSMEOrAbove, IsSME, IsMentorOnly


class TaskListCreateView(APIView):
    """GET/POST /Sims/tasks/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = request.user.profile
        queryset = Task.objects.filter(is_deleted=False)

        if profile.role == 'intern':
            queryset = queryset.filter(assigned_to=profile)
        elif not profile.is_global_admin():
            queryset = queryset.filter(entity=profile.entity)

        # Filters
        for param, field in [('status', 'status'), ('priority', 'priority'), ('task_type', 'task_type'),
                              ('project', 'project_id'), ('assigned_to', 'assigned_to_id')]:
            value = request.query_params.get(param)
            if value:
                queryset = queryset.filter(**{field: value})

        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(Q(title__icontains=search) | Q(description__icontains=search))

        serializer = TaskListSerializer(queryset[:200], many=True)
        return Response(serializer.data)

    def post(self, request):
        """Only Mentor (or above) can create/assign tasks from projects."""
        profile = request.user.profile
        if profile.role not in ('mentor', 'sme', 'superadmin', 'manager'):
            return Response({'error': 'Only Mentor or above can create tasks'},
                            status=status.HTTP_403_FORBIDDEN)
        serializer = TaskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        task = serializer.save(
            created_by=request.user.profile,
            entity=request.user.profile.entity
        )

        # Create subtasks if provided
        subtasks = request.data.get('subtasks', [])
        for i, st in enumerate(subtasks):
            Subtask.objects.create(task=task, title=st.get('title', ''), order=i)

        # Log status history
        TaskStatusHistory.objects.create(task=task, new_status=task.status, changed_by=request.user.profile)

        return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)


class TaskDetailView(APIView):
    """GET/PATCH/DELETE /Sims/tasks/{pk}/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            task = Task.objects.get(pk=pk, is_deleted=False)
            serializer = TaskSerializer(task)
            data = serializer.data
            data['comments'] = TaskCommentSerializer(task.comments.all(), many=True).data
            data['status_history'] = TaskStatusHistorySerializer(task.status_history.all(), many=True).data
            return Response(data)
        except Task.DoesNotExist:
            return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, pk):
        try:
            task = Task.objects.get(pk=pk, is_deleted=False)
            old_status = task.status
            serializer = TaskSerializer(task, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()

            if old_status != task.status:
                TaskStatusHistory.objects.create(
                    task=task, old_status=old_status, new_status=task.status,
                    changed_by=request.user.profile
                )

            return Response(serializer.data)
        except Task.DoesNotExist:
            return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        try:
            task = Task.objects.get(pk=pk)
            task.is_deleted = True
            task.save()
            return Response({'message': 'Task deleted'})
        except Task.DoesNotExist:
            return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)


class TaskStatusAutoNextView(APIView):
    """PATCH /Sims/tasks/{pk}/update-status-auto-next/ — Move to next status."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            task = Task.objects.get(pk=pk, is_deleted=False)
            old = task.status
            status_flow = {'todo': 'inprogress', 'inprogress': 'completed', 'completed': 'verified'}

            # Check dependencies
            if task.blocked_by and task.blocked_by.status not in ('completed', 'verified'):
                return Response({'error': 'Blocked by prerequisite task'}, status=status.HTTP_400_BAD_REQUEST)

            next_status = status_flow.get(old)
            if not next_status:
                return Response({'error': 'No next status'}, status=status.HTTP_400_BAD_REQUEST)

            task.status = next_status
            if next_status == 'completed':
                task.progress = 100
                task.completed_date = timezone.now()
            task.save()

            TaskStatusHistory.objects.create(task=task, old_status=old, new_status=next_status, changed_by=request.user.profile)
            return Response(TaskSerializer(task).data)
        except Task.DoesNotExist:
            return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)


class DueTodayTasksView(APIView):
    """GET /Sims/tasks/due-today/ — Tasks due today for current user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = request.user.profile
        today = timezone.now().date()
        if profile.role == 'intern':
            queryset = Task.objects.filter(assigned_to=profile, due_date=today, is_deleted=False)
        else:
            queryset = Task.objects.filter(entity=profile.entity, due_date=today, is_deleted=False)
        serializer = TaskListSerializer(queryset, many=True)
        return Response(serializer.data)


class TaskAssignedHistoryView(APIView):
    """GET /Sims/tasks/assigned-history/ — Task assignment history."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = request.user.profile
        queryset = TaskStatusHistory.objects.all()
        if profile.role == 'intern':
            queryset = queryset.filter(task__assigned_to=profile)
        elif not profile.is_global_admin():
            queryset = queryset.filter(task__entity=profile.entity)
        serializer = TaskStatusHistorySerializer(queryset[:100], many=True)
        return Response(serializer.data)


class MonthlyTaskCountView(APIView):
    """GET /Sims/tasks/monthly-count/ — Monthly task count for chart."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = request.user.profile
        queryset = Task.objects.filter(is_deleted=False)
        if profile.role == 'intern':
            queryset = queryset.filter(assigned_to=profile)
        elif not profile.is_global_admin():
            queryset = queryset.filter(entity=profile.entity)

        months = []
        for i in range(11, -1, -1):
            d = timezone.now().date().replace(day=1) - timedelta(days=i * 30)
            month_tasks = queryset.filter(created_at__year=d.year, created_at__month=d.month)
            months.append({
                'month': d.strftime('%b %Y'),
                'total': month_tasks.count(),
                'completed': month_tasks.filter(status__in=['completed', 'verified']).count(),
            })
        return Response(months)


class WeeklyPerformanceView(APIView):
    """GET /Sims/tasks/weekly-performance/ — Weekly task completion performance."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = request.user.profile
        queryset = Task.objects.filter(is_deleted=False)
        if profile.role == 'intern':
            queryset = queryset.filter(assigned_to=profile)

        weeks = []
        for i in range(7, -1, -1):
            start = timezone.now().date() - timedelta(weeks=i + 1)
            end = timezone.now().date() - timedelta(weeks=i)
            week_tasks = queryset.filter(created_at__date__gte=start, created_at__date__lt=end)
            weeks.append({
                'week': f"Week {8 - i}",
                'start': str(start),
                'total': week_tasks.count(),
                'completed': week_tasks.filter(status__in=['completed', 'verified']).count(),
            })
        return Response(weeks)


class CompletionReviewView(APIView):
    """GET/POST /Sims/completion-review/ — Task completion review queue."""
    permission_classes = [IsAuthenticated, IsMentorOrAbove]

    def get(self, request):
        profile = request.user.profile
        queryset = Task.objects.filter(status='completed', is_deleted=False)
        if not profile.is_global_admin():
            queryset = queryset.filter(entity=profile.entity)
        serializer = TaskListSerializer(queryset, many=True)
        return Response(serializer.data)


# =============================================================================
# Projects
# =============================================================================

class ProjectListCreateView(APIView):
    """GET/POST /Sims/projects/ — SME creates projects; all staff can view."""
    permission_classes = [IsAuthenticated, IsStaffOrAbove]

    def get(self, request):
        profile = request.user.profile
        queryset = Project.objects.filter(is_deleted=False)
        if not profile.is_global_admin():
            queryset = queryset.filter(entity=profile.entity)
        
        # SME scoping
        if profile.role == 'sme':
            queryset = queryset.filter(domain=profile.domain)

        # Mentor sees projects assigned to them directly or to their teams
        if profile.role == 'mentor':
            from django.db.models import Q
            mentor_teams = profile.led_teams.values_list('id', flat=True)
            queryset = queryset.filter(Q(team_lead=profile) | Q(team_id__in=mentor_teams))
        serializer = ProjectSerializer(queryset, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Only SME (lead) can create projects."""
        profile = request.user.profile
        if profile.role not in ('sme', 'superadmin'):
            return Response({'error': 'Only SME or Super Admin can create projects'},
                            status=status.HTTP_403_FORBIDDEN)
        serializer = ProjectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Enforce SME domain
        if profile.role == 'sme':
            serializer.save(entity=profile.entity, domain=profile.domain)
        else:
            serializer.save(entity=profile.entity)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ProjectDetailView(APIView):
    """GET/PATCH/DELETE /Sims/projects/{pk}/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            project = Project.objects.get(pk=pk, is_deleted=False)
            data = ProjectSerializer(project).data
            data['tasks'] = TaskListSerializer(project.tasks.filter(is_deleted=False), many=True).data
            return Response(data)
        except Project.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, pk):
        try:
            project = Project.objects.get(pk=pk, is_deleted=False)
            serializer = ProjectSerializer(project, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        except Project.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        try:
            project = Project.objects.get(pk=pk)
            project.is_deleted = True
            project.save()
            return Response({'message': 'Project deleted'})
        except Project.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


class ProjectDashboardView(APIView):
    """GET /Sims/projects/dashboard/ — Project dashboard stats."""
    permission_classes = [IsAuthenticated, IsStaffOrAbove]

    def get(self, request):
        profile = request.user.profile
        queryset = Project.objects.filter(is_deleted=False)
        if not profile.is_global_admin():
            queryset = queryset.filter(entity=profile.entity)
        return Response({
            'total': queryset.count(),
            'active': queryset.filter(status='active').count(),
            'completed': queryset.filter(status='completed').count(),
            'planning': queryset.filter(status='planning').count(),
            'on_hold': queryset.filter(status='on_hold').count(),
        })


class ProjectAssignTeamView(APIView):
    """POST /Sims/projects/{pk}/assign-team/ — Mentor assigns teams to projects."""
    permission_classes = [IsAuthenticated, IsMentorOrAbove]

    def post(self, request, pk):
        try:
            project = Project.objects.get(pk=pk)
            team_id = request.data.get('team_id')
            if not team_id or team_id == 'unassigned':
                project.team = None
            else:
                team = Team.objects.get(pk=team_id)
                project.team = team
            project.save()
            return Response({'message': 'Team assignment updated'})
        except (Project.DoesNotExist, Team.DoesNotExist):
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


class ProjectAssignTeamLeadView(APIView):
    """POST /Sims/projects/{pk}/assign-team-lead/ — SME assigns mentor to project."""
    permission_classes = [IsAuthenticated, IsSMEOrAbove]

    def post(self, request, pk):
        try:
            project = Project.objects.get(pk=pk)
            lead_id = request.data.get('lead_id')
            if not lead_id or lead_id == 'unassigned':
                project.team_lead = None
            else:
                lead = UserProfile.objects.get(pk=lead_id)
                project.team_lead = lead
            project.save()
            return Response({'message': 'Team lead assignment updated'})
        except (Project.DoesNotExist, UserProfile.DoesNotExist):
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


class TeamLeadProjectsView(APIView):
    """GET /Sims/team-lead/projects/ — Projects for current team lead."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = Project.objects.filter(team_lead=request.user.profile, is_deleted=False)
        serializer = ProjectSerializer(queryset, many=True)
        return Response(serializer.data)


# =============================================================================
# Teams
# =============================================================================

class TeamListCreateView(APIView):
    """GET/POST /Sims/teams/ — Mentor creates and manages teams."""
    permission_classes = [IsAuthenticated, IsMentorOrAbove]

    def get(self, request):
        profile = request.user.profile
        queryset = Team.objects.filter(is_active=True)
        if not profile.is_global_admin():
            queryset = queryset.filter(entity=profile.entity)
        # Mentor sees only their own teams
        if profile.role == 'mentor':
            queryset = queryset.filter(mentor=profile)
        serializer = TeamSerializer(queryset, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Only Mentor can create teams."""
        profile = request.user.profile
        if profile.role not in ('mentor', 'superadmin', 'manager'):
            return Response({'error': 'Only Mentor, Manager or Super Admin can create teams'},
                            status=status.HTTP_403_FORBIDDEN)
        serializer = TeamSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # Auto-assign the creating mentor as the team mentor
        team = serializer.save(
            entity=profile.entity,
            mentor=profile if profile.role == 'mentor' else serializer.validated_data.get('mentor')
        )
        return Response(TeamSerializer(team).data, status=status.HTTP_201_CREATED)


class TeamDetailView(APIView):
    """GET/PATCH/DELETE /Sims/teams/{pk}/"""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            team = Team.objects.get(pk=pk)
            return Response(TeamSerializer(team).data)
        except Team.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, pk):
        try:
            team = Team.objects.get(pk=pk)
            serializer = TeamSerializer(team, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        except Team.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        try:
            team = Team.objects.get(pk=pk)
            team.is_active = False
            team.save()
            return Response({'message': 'Team deactivated'})
        except Team.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


class TeamInternsView(APIView):
    """GET /Sims/teams/{teamId}/interns/ — Interns in team."""
    permission_classes = [IsAuthenticated]

    def get(self, request, team_id):
        try:
            team = Team.objects.get(pk=team_id)
            serializer = UserProfileListSerializer(team.interns.filter(is_deleted=False), many=True)
            return Response(serializer.data)
        except Team.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


class AssignInternsToTeamView(APIView):
    """POST /Sims/teams/{teamId}/assign-interns/"""
    permission_classes = [IsAuthenticated, IsMentorOrAbove]

    def post(self, request, team_id):
        try:
            team = Team.objects.get(pk=team_id)
            intern_ids = request.data.get('intern_ids', [])
            interns = UserProfile.objects.filter(id__in=intern_ids, role='intern')
            team.interns.add(*interns)
            return Response({'message': f'{interns.count()} interns assigned'})
        except Team.DoesNotExist:
            return Response({'error': 'Team not found'}, status=status.HTTP_404_NOT_FOUND)


class RemoveInternFromTeamView(APIView):
    """POST /Sims/teams/{teamId}/remove-intern/"""
    permission_classes = [IsAuthenticated, IsMentorOrAbove]

    def post(self, request, team_id):
        try:
            team = Team.objects.get(pk=team_id)
            intern_id = request.data.get('intern_id')
            intern = UserProfile.objects.get(pk=intern_id)
            team.interns.remove(intern)
            return Response({'message': 'Intern removed from team'})
        except (Team.DoesNotExist, UserProfile.DoesNotExist):
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)


class AvailableInternsView(APIView):
    """GET /Sims/teams/available-interns/ — Interns not yet in a team."""
    permission_classes = [IsAuthenticated, IsMentorOrAbove]

    def get(self, request):
        profile = request.user.profile
        all_interns = UserProfile.objects.filter(role='intern', is_deleted=False)
        if not profile.is_global_admin():
            all_interns = all_interns.filter(entity=profile.entity)
            
        if profile.role in ('sme', 'mentor'):
            all_interns = all_interns.filter(domain=profile.domain)
            
        assigned = UserProfile.objects.filter(teams__isnull=False, role='intern').distinct()
        available = all_interns.exclude(id__in=assigned)
        serializer = UserProfileListSerializer(available, many=True)
        return Response(serializer.data)


class TeamLeadsView(APIView):
    """GET /Sims/team-leads/ — All team leads."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        leads = UserProfile.objects.filter(
            role='mentor', is_deleted=False
        )
        if hasattr(request.user, 'userprofile') and request.user.userprofile.entity:
            profile = request.user.userprofile
            leads = leads.filter(entity=profile.entity)
            
            if profile.role == 'sme' and profile.domain:
                leads = leads.filter(domain=profile.domain)
                
        leads = leads.distinct()
        serializer = UserProfileListSerializer(leads, many=True)
        return Response(serializer.data)
