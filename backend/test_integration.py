"""
Integration test to verify frontend-backend authentication flow.
Tests:
1. User exists in database
2. Login endpoint works
3. JWT tokens are issued
4. /me endpoint returns user data
5. Logout works
"""
import os
import django
import json
import requests

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()
BASE_URL = "http://localhost:8000/api/v1"

print("=" * 70)
print("INTEGRATION TEST: Frontend-Backend Authe