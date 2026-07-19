import os
import django
import random
import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sims_project.settings')
django.setup()

from sims.models import UserProfile, PaymentRecord, Entity

# Get all active interns
interns = list(UserProfile.objects.filter(role='intern'))
entity = Entity.objects.first()

if not entity:
    print("No entity found")
    exit()

# Clear existing payment records
PaymentRecord.objects.all().delete()

# Schemes choices: stipend, paid, free (free is 0)
# We want to create records for the last 6 months
# Each month will have some paid stipends, some paid fees, and some other payments.
schemes = ['stipend', 'paid', '']
statuses = ['paid', 'pending', 'overdue']

now = datetime.date.today()

# Generate records for each of the last 6 months
for i in range(6):
    month = now.month - i
    year = now.year
    if month <= 0:
        month += 12
        year -= 1
        
    # Create 5 to 10 payment records for this month
    num_records = random.randint(6, 12)
    for _ in range(num_records):
        intern = random.choice(interns)
        scheme = random.choice(schemes)
        # Higher probability of status = 'paid' for realistic dashboard history
        status = random.choice(['paid', 'paid', 'paid', 'pending', 'overdue'])
        
        # Amount based on scheme
        if scheme == 'stipend':
            amount = random.choice([5000, 7500, 10000, 12000])
        elif scheme == 'paid':
            amount = random.choice([15000, 20000, 25000])
        else:
            # Other payments (reimbursements, accessories, dynamic claims etc)
            amount = random.choice([1500, 2500, 3000, 5000])
            
        due_day = random.randint(5, 25)
        due_date = datetime.date(year, month, due_day)
        
        # Payment date is usually on or slightly before/after due date if paid
        payment_date = due_date if status == 'paid' else None
        
        PaymentRecord.objects.create(
            user=intern,
            entity=entity,
            amount=amount,
            scheme=scheme,
            status=status,
            payment_mode='upi' if status == 'paid' else '',
            due_date=due_date,
            payment_date=payment_date,
            notes=f"Automatic seed record for {due_date.strftime('%B %Y')}"
        )

print("Database seeded with payments successfully!")
