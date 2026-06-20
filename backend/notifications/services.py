from .models import Notification


def create_notification(recipient, notification_type, title, message, related_object_id=None):
    """Helper to create a notification from any service."""
    return Notification.objects.create(
        recipient         = recipient,
        notification_type = notification_type,
        title             = title,
        message           = message,
        related_object_id = related_object_id,
    )
