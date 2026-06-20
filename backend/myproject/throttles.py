"""
Custom DRF throttle classes for the Learnly API.

Strategy:
  • Authenticated users  — throttled by user ID (fairer than IP alone)
  • Anonymous requests   — throttled by IP address
  • Auth endpoints       — tighter limits to resist brute-force

Usage in views:
    from myproject.throttles import LoginRateThrottle, RegisterRateThrottle

    class MyView(APIView):
        throttle_classes = [LoginRateThrottle]
"""

from rest_framework.throttling import UserRateThrottle, AnonRateThrottle, SimpleRateThrottle


class BurstRateThrottle(UserRateThrottle):
    """
    Short-window limit applied to all authenticated requests.
    Rate: 60/min — prevents scripted abuse without blocking normal use.
    """
    scope = 'burst'


class SustainedRateThrottle(UserRateThrottle):
    """
    Long-window limit for authenticated requests.
    Rate: 1000/day — catches sustained scraping/abuse.
    """
    scope = 'sustained'


class AnonBurstThrottle(AnonRateThrottle):
    """
    Anonymous (unauthenticated) burst limiter.
    Only public endpoints (register, login) are accessible without auth,
    so this mostly protects against DDoS on the login page.
    Rate: 30/min per IP.
    """
    scope = 'burst'

    def get_rate(self):
        return '30/min'


class LoginRateThrottle(SimpleRateThrottle):
    """
    Strict brute-force protection for the token-obtain endpoint.
    Keyed by IP so it works even for unauthenticated requests.
    Rate: 10 attempts/min per IP.
    """
    scope = 'login'

    def get_cache_key(self, request, view):
        ident = self.get_ident(request)  # IP address
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident,
        }


class RegisterRateThrottle(SimpleRateThrottle):
    """
    Prevents mass account creation.
    Rate: 5 registrations/min per IP.
    """
    scope = 'register'

    def get_cache_key(self, request, view):
        ident = self.get_ident(request)
        return self.cache_format % {
            'scope': self.scope,
            'ident': ident,
        }
