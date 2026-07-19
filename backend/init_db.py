import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sims_project.settings')
django.setup()

from django.contrib.auth.models import User
from sims.models import Entity, Branch, Domain, EntityConfig, UserProfile

# Clear existing users, profiles, entities, domains, branches, configs just in case
UserProfile.objects.all().delete()
User.objects.all().delete()
EntityConfig.objects.all().delete()
Branch.objects.all().delete()
Domain.objects.all().delete()
Entity.objects.all().delete()

# Create Entities
entity_names = ["InternFlow Digital", "InternFlow", "InternFlow Inc"]
entities = {}
for name in entity_names:
    entities[name] = Entity.objects.create(
        name=name,
        description=f"{name} Entity"
    )

entity = entities["InternFlow Digital"]

# Create Branch
branch = Branch.objects.create(
    entity=entity,
    name="Chennai HQ",
    location="Chennai"
)

# Create Domains for all Entities
domains = {}
for entity_name, ent_obj in entities.items():
    for domain_name in ["Full Stack", "Data Science", "Design", "QA", "DevOps"]:
        key = f"{domain_name}_{entity_name}"
        domains[key] = Domain.objects.create(
            entity=ent_obj,
            name=domain_name,
            description=f"{domain_name} specialization domain for {entity_name}"
        )

# Create EntityConfig
entity_config = EntityConfig.objects.create(
    entity=entity,
    working_hours={"weekday": "09:00-18:00"},
    shift_definitions=[
        {"name": "Standard Shift", "start": "09:00", "end": "18:00", "late_mark_after": 15}
    ],
    feature_flags={
        "learning_phase": True,
        "stipend": True,
        "task_self_creation": True,
        "ai_features": True
    }
)

# Create superadmin user
superadmin_user = User.objects.create_user(
    username="SUADM0001",
    email="superadmin@internflow.dev",
    password="InternFlow@123",
    is_staff=True,
    is_superuser=True
)
superadmin_profile = UserProfile.objects.create(
    user=superadmin_user,
    emp_id="SUADM0001",
    role="superadmin",
    full_name="Super Admin",
    entity=entity,
    user_status="active"
)

# Create admin user
admin_user = User.objects.create_user(
    username="ADM0001",
    email="admin@internflow.dev",
    password="InternFlow@123",
    is_staff=True,
    is_superuser=False
)
admin_profile = UserProfile.objects.create(
    user=admin_user,
    emp_id="ADM0001",
    role="admin",
    full_name="Admin",
    entity=entity,
    user_status="active"
)

# Create other users
roles_data = [
    {"username": "manager", "email": "manager@internflow.dev", "role": "manager", "emp_id": "MAN0001", "full_name": "Manager", "domain": None},
    {"username": "sme", "email": "sme@internflow.dev", "role": "sme", "emp_id": "SME0001", "full_name": "SME", "domain": None},
    {"username": "mentor", "email": "mentor@internflow.dev", "role": "mentor", "emp_id": "MEN0001", "full_name": "Mentor", "domain": "Full Stack"},
    {"username": "staff", "email": "staff@internflow.dev", "role": "staff", "emp_id": "STA0001", "full_name": "Staff", "domain": None}
]

for data in roles_data:
    user = User.objects.create_user(
        username=data["username"],
        email=data["email"],
        password="InternFlow@123"
    )
    domain_obj = domains.get(f'{data["domain"]}_InternFlow Digital') if data["domain"] else None
    UserProfile.objects.create(
        user=user,
        emp_id=data["emp_id"],
        role=data["role"],
        full_name=data["full_name"],
        entity=entity,
        domain=domain_obj,
        user_status="active"
    )

print("Database seeded successfully!")
