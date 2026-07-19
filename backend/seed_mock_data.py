import os
import django
import random
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sims_project.settings')
django.setup()

from django.contrib.auth.models import User
from sims.models import Entity, Domain, UserProfile, Team, Project, Task

def seed_data():
    entity = Entity.objects.filter(name="InternFlow Digital").first()
    if not entity:
        entity = Entity.objects.first()
    if not entity:
        print("No Entity found. Run init_db.py first.")
        return

    domains = list(Domain.objects.filter(entity=entity))
    if not domains:
        print("No Domains found.")
        return

    mentors = list(UserProfile.objects.filter(role__in=['mentor', 'sme']))
    if not mentors:
        print("No mentors found.")
        return

    print("Creating Interns...")
    # Create Interns
    interns = []
    for i in range(1, 16):  # 15 interns
        username = f"INT00{i}"
        user, _ = User.objects.get_or_create(username=username, email=f"intern{i}@internflow.dev")
        user.set_password("InternFlow@123")
        user.save()

        profile, _ = UserProfile.objects.update_or_create(
            user=user,
            defaults={
                "emp_id": username,
                "role": "intern",
                "full_name": f"Intern User {i}",
                "entity": entity,
                "domain": random.choice(domains),
                "user_status": random.choice(['active', 'inprogress', 'active']),
                "phone": f"98765432{i:02d}",
                "scheme": random.choice(['stipend', 'paid', 'free']),
                "gender": random.choice(['male', 'female'])
            }
        )
        interns.append(profile)

    print("Creating Teams...")
    # Create Teams
    teams = []
    for i in range(1, 4):  # 3 teams
        team, _ = Team.objects.update_or_create(
            name=f"Alpha Squad {i}",
            defaults={
                "description": f"Team Alpha {i} working on awesome projects",
                "mentor": random.choice(mentors),
                "entity": entity,
                "is_active": True
            }
        )
        team.interns.set(random.sample(interns, k=5))
        teams.append(team)

    print("Creating Projects...")
    # Create Projects
    projects = []
    for i, team in enumerate(teams):
        project, _ = Project.objects.update_or_create(
            name=f"Project Titan {i+1}",
            defaults={
                "description": f"A flagship project {i+1}",
                "domain": team.interns.first().domain if team.interns.exists() else None,
                "team": team,
                "entity": entity,
                "status": "active"
            }
        )
        projects.append(project)

    print("Creating Tasks...")
    # Create Tasks for projects
    for project in projects:
        for i in range(5):
            Task.objects.update_or_create(
                project=project,
                title=f"Setup module {i+1} for {project.name}",
                defaults={
                    "description": "Initial setup and configuration",
                    "assigned_to": random.choice(list(project.team.interns.all())) if project.team and project.team.interns.exists() else None,
                    "created_by": project.team.mentor if project.team else None,
                    "status": random.choice(['todo', 'inprogress', 'completed']),
                    "priority": random.choice(['low', 'medium', 'high'])
                }
            )

    print("Mock Data Seeded Successfully!")

if __name__ == "__main__":
    seed_data()
