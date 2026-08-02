from django.urls import path
from users.views import UserListView, UserDetailView, ResetAccessView

urlpatterns = [
    path('',        UserListView.as_view(),   name='user-list'),
    path('<int:pk>/', UserDetailView.as_view(), name='user-detail'),
    path('<int:pk>/reset-access/', ResetAccessView.as_view(), name='user-reset-access'),
]
