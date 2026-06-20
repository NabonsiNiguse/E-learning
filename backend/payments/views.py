from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Payment
from .serializers import PaymentSerializer, InitiatePaymentSerializer
from .services import process_payment
from users.permissions import IsAdmin, IsStudent


class PaymentListView(generics.ListAPIView):
    """
    Students see their own payments.
    Admins see all payments.
    """
    serializer_class   = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs   = Payment.objects.select_related('student', 'course')
        if user.is_admin:
            return qs
        return qs.filter(student=user)


class InitiatePaymentView(APIView):
    """
    POST /api/v1/payments/initiate/
    Students initiate a mock payment for a premium course.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not request.user.is_student:
            return Response(
                {'success': False, 'message': 'Only students can make payments.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = InitiatePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        result = process_payment(
            student        = request.user,
            course_id      = data['course_id'],
            payment_method = data['payment_method'],
            simulate       = data['simulate'],
        )

        http_status = status.HTTP_200_OK if result['success'] else status.HTTP_402_PAYMENT_REQUIRED
        response_data = {
            'success': result['success'],
            'message': result['message'],
        }
        if 'payment' in result:
            response_data['payment'] = PaymentSerializer(result['payment']).data
        if 'enrollment' in result:
            from enrollments.serializers import EnrollmentSerializer
            response_data['enrollment'] = EnrollmentSerializer(result['enrollment']).data

        return Response(response_data, status=http_status)


class PaymentDetailView(generics.RetrieveAPIView):
    """Retrieve a specific payment record."""
    serializer_class   = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Payment.objects.all()
        return Payment.objects.filter(student=user)
