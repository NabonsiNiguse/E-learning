from django.db import models
from django.conf import settings


class Notification(models.Model):
    class Type(models.TextChoices):
        ENROLLMENT      = 'enrollment',      'Enrollment'
        PAYMENT_SUCCESS = 'payment_success', 'Payment Success'
        PAYMENT_FAILED  = 'payment_failed',  'Payment Failed'
        COURSE_UPDATE   = 'course_update',   'Course Update'
        ANNOUNCEMENT    = 'announcement',    'Announcement'
        SYSTEM          = 'system',          'System'

    recipient          = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    notification_type  = models.CharField(max_length=20, choices=Type.choices, default=Type.SYSTEM)
    title              = models.CharField(max_length=255)
    message            = models.TextField()
    is_read            = models.BooleanField(default=False)
    related_object_id  = models.PositiveIntegerField(null=True, blank=True)
    created_at         = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f'[{self.notification_type}] {self.recipient.email}: {self.title}'


class Message(models.Model):
    """
    Direct messages between users.
    - Admin → anyone (announcements or direct)
    - Teacher → enrolled students (course updates / replies)
    - Student → teacher (questions)
    """
    class MessageType(models.TextChoices):
        DIRECT       = 'direct',       'Direct Message'
        ANNOUNCEMENT = 'announcement', 'Announcement'   # Admin broadcast
        COURSE_UPDATE = 'course_update', 'Course Update' # Teacher → students

    sender      = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages',
    )
    recipient   = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='received_messages',
        null=True, blank=True,  # null = broadcast
    )
    # For course-scoped messages (teacher updates)
    course      = models.ForeignKey(
        'courses.Course',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='messages',
    )
    message_type = models.CharField(max_length=15, choices=MessageType.choices, default=MessageType.DIRECT)
    subject     = models.CharField(max_length=255)
    body        = models.TextField()
    is_read     = models.BooleanField(default=False)
    parent      = models.ForeignKey(
        'self', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='replies',
    )
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'messages'
        ordering = ['-created_at']

    def __str__(self):
        to = self.recipient.email if self.recipient else 'ALL'
        return f'{self.sender.email} → {to}: {self.subject}'
