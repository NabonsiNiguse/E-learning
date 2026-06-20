from rest_framework import serializers
from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Payment
        fields = [
            'id', 'student', 'course', 'amount', 'status',
            'reference', 'payment_method', 'failure_reason',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'student', 'status', 'reference',
            'failure_reason', 'created_at', 'updated_at',
        ]


class InitiatePaymentSerializer(serializers.Serializer):
    """Payload to start a mock payment."""
    course_id      = serializers.IntegerField()
    payment_method = serializers.ChoiceField(
        choices=['mock_card', 'mock_bank', 'mock_wallet'],
        default='mock_card',
    )
    # Simulate outcome: 'success' or 'fail' — frontend passes this for testing
    simulate       = serializers.ChoiceField(
        choices=['success', 'fail'],
        default='success',
    )
