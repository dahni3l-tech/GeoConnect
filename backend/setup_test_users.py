import os
import sys

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import django
django.setup()

from accounts.models import User, GuardianProfile

daniel = User.objects.create_user(
    id=1,
    username="Daniel",
    email="daniel@test.com",
    password="testpass123",
    is_guardian=True,
)
GuardianProfile.objects.create(
    user=daniel,
    guardian_name="Daniel Guardian",
    guardian_phone="+1234567890",
    guardian_email="daniel@test.com",
    guardian_relation="Father",
)

lovekay = User.objects.create_user(
    id=3,
    username="Lovekay",
    email="lovekay@test.com",
    password="testpass123",
    is_guardian=False,
)

other = User.objects.create_user(
    id=2,
    username="OtherUser",
    email="other@test.com",
    password="testpass123",
    is_guardian=False,
)

print("Users created:")
for u in User.objects.all():
    print(f"  id={u.id} username={u.username} is_guardian={u.is_guardian}")