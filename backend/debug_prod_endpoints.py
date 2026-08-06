import os
import sys

os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
os.environ['DB_ENGINE'] = 'django.db.backends.postgresql'
os.environ['DB_NAME'] = 'geoconnect_tuas'
os.environ['DB_USER'] = 'geoconnect_tuas_user'
os.environ['DB_PASSWORD'] = 'tLC4jFxeKq1y3fSRx8nY3RWcztUzxbqI'
os.environ['DB_HOST'] = 'dpg-d9n8nee1egvs73fjmnn0-a.oregon-postgres.render.com'
os.environ['DB_PORT'] = '5432'

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import django
django.setup()

import traceback
from rest_framework.test import APIRequestFactory, force_authenticate
from django.contrib.auth import get_user_model
from accounts.views import (
    FamilyInvitationView,
    LocationPermissionView,
    SOSAlertListCreateView,
    ActivityLogView,
    FamilyMapDataView,
)

User = get_user_model()

# Get a guardian user from production
try:
    guardian = User.objects.filter(is_guardian=True).first()
    if not guardian:
        print("No guardian user found in production!")
        sys.exit(1)
    print(f"Using guardian: id={guardian.id} username={guardian.username} is_guardian={guardian.is_guardian}")
except Exception as e:
    print(f"Error getting guardian: {e}")
    traceback.print_exc()
    sys.exit(1)

# Create DRF request factory
factory = APIRequestFactory()

# Test each endpoint
endpoints = [
    ("GET", "/api/guardian/invitations/", FamilyInvitationView),
    ("GET", "/api/guardian/permissions/", LocationPermissionView),
    ("GET", "/api/guardian/sos/", SOSAlertListCreateView),
    ("GET", "/api/guardian/activity/", ActivityLogView),
    ("GET", "/api/guardian/map-data/", FamilyMapDataView),
]

for method, path, view_class in endpoints:
    print(f"\n{'='*60}")
    print(f"Testing {method} {path}")
    print(f"{'='*60}")
    
    try:
        if method == "GET":
            request = factory.get(path)
            force_authenticate(request, user=guardian)
            
            view = view_class.as_view()
            response = view(request)
            print(f"Status: {response.status_code}")
            if hasattr(response, 'data'):
                print(f"Data: {response.data}")
    except Exception as e:
        print(f"EXCEPTION: {type(e).__name__}: {e}")
        traceback.print_exc()

print("\nDone!")
