"""
Integration smoke test for the authentication flow.
This file is intentionally kept as a script placeholder and is NOT
picked up by 'manage.py test' (no TestCase classes).
Run manually: python test_integration.py (with the dev server running).
"""
import os
import sys

# ── Standalone execution only ──────────────────────────────────────────────
if __name__ == '__main__':
    import django
    import json

    try:
        import requests
    except ImportError:
        print("requests not installed. Run: pip install requests")
        sys.exit(1)

    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')
    django.setup()

    from django.contrib.auth import get_user_model
    from rest_framework.test import APIClient

    User = get_user_model()
    BASE_URL = "http://localhost:8000/api/v1"

    print("=" * 70)
    print("INTEGRATION TEST: Frontend-Backend Authentication Flow")
    print("=" * 70)

    client = APIClient()

    # 1. Login
    response = requests.post(
        f"{BASE_URL}/auth/login/",
        json={"email": "admin@example.com", "password": "admin123"},
    )
    print(f"[1] Login → {response.status_code}")
    if response.status_code != 200:
        print("    FAILED:", response.text)
        sys.exit(1)

    tokens = response.json()
    access = tokens.get("access")
    print(f"    Token obtained: {'YES' if access else 'NO'}")

    # 2. /me endpoint
    me_response = requests.get(
        f"{BASE_URL}/auth/me/",
        headers={"Authorization": f"Bearer {access}"},
    )
    print(f"[2] /me → {me_response.status_code}")
    if me_response.status_code == 200:
        print(f"    User: {me_response.json().get('email')}")

    print("=" * 70)
    print("DONE")