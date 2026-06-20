from django.urls import path
from .views import PaymentListView, InitiatePaymentView, PaymentDetailView

urlpatterns = [
    path('',             PaymentListView.as_view(),    name='payment-list'),
    path('initiate/',    InitiatePaymentView.as_view(), name='payment-initiate'),
    path('<int:pk>/',    PaymentDetailView.as_view(),  name='payment-detail'),
]
