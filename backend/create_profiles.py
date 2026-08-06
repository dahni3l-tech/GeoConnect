import os
import sys

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import django
django.setup()

from accounts.models import User, GuardianProfile

for uid in [1, 3, 11]:
    try:
        user = User.objects.get(id=uid)
        GuardianProfile.objects.get_or_create(
            user=user,
            defaults={
                "guardian_name": f"{user.username} Profile",
                "guardian_phone": "+1234567890",
                "guardian_email": f"{user.username}@test.com",
                "guardian_relation": "Father",
            },
        )
        print(f"Profile created/exists for user id={uid} username={user.username}")
    except Exception as e:
        print(f"Error for user id={uid}: {e}")