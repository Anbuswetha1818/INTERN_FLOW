import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sims_project.settings')
django.setup()

from django.contrib.auth.models import User
from sims.models import UserProfile, OnboardingSubmission, Entity, Domain
import random

# 1. Delete existing interns
interns = UserProfile.objects.filter(role='intern')
users = User.objects.filter(id__in=interns.values_list('user_id', flat=True))
print(f"Deleting {interns.count()} intern profiles and {users.count()} users...")
interns.delete()
users.delete()

# 2. Delete existing onboarding submissions
OnboardingSubmission.objects.all().delete()

# 3. Create 15 Onboarding Submissions
entity = Entity.objects.first()
domains = list(Domain.objects.filter(entity=entity))
if not domains:
    domains = list(Domain.objects.all())

print("Creating 15 Onboarding Submissions...")
for i in range(1, 16):
    domain = random.choice(domains) if domains else None
    OnboardingSubmission.objects.create(
        full_name=f"Intern Applicant {i}",
        email=f"applicant{i}@internflow.dev",
        phone=f"98765432{i:02d}",
        domain=domain,
        entity=entity,
        status='pending',
        college_name="Tech University",
        degree="B.Tech",
        college_department="Computer Science",
        year_of_passing=2026
    )

print("Done.")
