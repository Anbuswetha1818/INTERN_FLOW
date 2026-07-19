import os
import re

path = r'd:\VDart\SIMS\our verision sims\backend\sims\views\task_views.py'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update ProjectListCreateView get
target1 = """        if profile.role != 'superadmin':
            queryset = queryset.filter(entity=profile.entity)
        # Mentor sees projects assigned to them directly or to their teams
        if profile.role == 'mentor':"""

replacement1 = """        if profile.role != 'superadmin':
            queryset = queryset.filter(entity=profile.entity)
        
        # SME scoping
        if profile.role == 'sme':
            queryset = queryset.filter(domain=profile.domain)

        # Mentor sees projects assigned to them directly or to their teams
        if profile.role == 'mentor':"""

if target1 in content:
    content = content.replace(target1, replacement1)

# 2. Update ProjectListCreateView post
target2 = """        serializer = ProjectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(entity=profile.entity)"""

replacement2 = """        serializer = ProjectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Enforce SME domain
        if profile.role == 'sme':
            serializer.save(entity=profile.entity, domain=profile.domain)
        else:
            serializer.save(entity=profile.entity)"""

if target2 in content:
    content = content.replace(target2, replacement2)

# 3. Update AvailableInternsView
target3 = """        all_interns = UserProfile.objects.filter(role='intern', is_deleted=False)
        if profile.role != 'superadmin':
            all_interns = all_interns.filter(entity=profile.entity)
        assigned = UserProfile.objects.filter(teams__isnull=False, role='intern').distinct()"""

replacement3 = """        all_interns = UserProfile.objects.filter(role='intern', is_deleted=False)
        if profile.role != 'superadmin':
            all_interns = all_interns.filter(entity=profile.entity)
            
        if profile.role == 'sme':
            all_interns = all_interns.filter(domain=profile.domain)
            
        assigned = UserProfile.objects.filter(teams__isnull=False, role='intern').distinct()"""

if target3 in content:
    content = content.replace(target3, replacement3)

# 4. Update TeamLeadsView
target4 = """        if hasattr(request.user, 'userprofile') and request.user.userprofile.entity:
            leads = leads.filter(entity=request.user.userprofile.entity)
            
        leads = leads.distinct()"""

replacement4 = """        if hasattr(request.user, 'userprofile') and request.user.userprofile.entity:
            profile = request.user.userprofile
            leads = leads.filter(entity=profile.entity)
            
            if profile.role == 'sme':
                leads = leads.filter(domain=profile.domain)
                
        leads = leads.distinct()"""

if target4 in content:
    content = content.replace(target4, replacement4)


with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("task_views.py updated successfully!")
