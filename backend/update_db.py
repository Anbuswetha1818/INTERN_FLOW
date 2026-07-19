import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sims_project.settings')
django.setup()

from django.contrib.auth.models import User
from sims.models import UserProfile, Entity

entity = Entity.objects.first()
if not entity:
    entity = Entity.objects.create(name="VDart Digital", description="VDart Digital Entity")

# 1. Clean up duplicate users created from previous failed runs
if User.objects.filter(username="admin").exists() and User.objects.filter(username="ADM0001").exists():
    # Delete duplicate profile if any
    UserProfile.objects.filter(user__username="ADM0001").delete()
    User.objects.filter(username="ADM0001").delete()

if User.objects.filter(username="superadmin").exists() and User.objects.filter(username="SUADM0001").exists():
    UserProfile.objects.filter(user__username="SUADM0001").delete()
    User.objects.filter(username="SUADM0001").delete()

# 2. Rename superadmin if exists
try:
    su = User.objects.get(username="superadmin")
    su.username = "SUADM0001"
    su.save()
except User.DoesNotExist:
    pass

# Rename admin if exists
try:
    adm = User.objects.get(username="admin")
    adm.username = "ADM0001"
    adm.save()
except User.DoesNotExist:
    pass

# 3. Ensure SUADM0001 user and profile exist
superadmin_user, created = User.objects.get_or_create(
    username="SUADM0001",
    defaults={
        "email": "superadmin@internflow.dev",
        "is_staff": True,
        "is_superuser": True
    }
)
superadmin_user.is_staff = True
superadmin_user.is_superuser = True
superadmin_user.set_password("InternFlow@123")
superadmin_user.save()

# Update or create its profile
UserProfile.objects.update_or_create(
    user=superadmin_user,
    defaults={
        "emp_id": "SUADM0001",
        "role": "superadmin",
        "full_name": "Super Admin",
        "entity": entity,
        "user_status": "active"
    }
)

# 4. Ensure ADM0001 user and profile exist
admin_user, created = User.objects.get_or_create(
    username="ADM0001",
    defaults={
        "email": "admin@internflow.dev",
        "is_staff": True,
        "is_superuser": False
    }
)
admin_user.is_superuser = False
admin_user.is_staff = True
admin_user.set_password("InternFlow@123")
admin_user.save()

# Update or create its profile
UserProfile.objects.update_or_create(
    user=admin_user,
    defaults={
        "emp_id": "ADM0001",
        "role": "admin",
        "full_name": "Admin",
        "entity": entity,
        "user_status": "active"
    }
)

print("Roles updated successfully!")
