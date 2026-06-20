from django.db import models
from django.conf import settings


class Payment(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        SUCCESS = 'success', 'Success'
        FAILED  = 'failed',  'Failed'

    student         = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payments',
    )
    course          = models.ForeignKey(
        'courses.Course',
        on_delete=models.CASCADE,
        related_name='payments',
    )
    amount          = models.DecimalField(max_digits=8, decimal_places=2)
    status          = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    # Mock payment reference — in production this would be a gateway transaction ID
    reference       = models.CharField(max_length=100, unique=True)
    payment_method  = models.CharField(max_length=50, default='mock_card')
    failure_reason  = models.CharField(max_length=255, blank=True)
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payments'
        ordering = ['-created_at']

    def __str__(self):
        return f'Payment({self.reference}) — {self.student.email} — {self.status}'
