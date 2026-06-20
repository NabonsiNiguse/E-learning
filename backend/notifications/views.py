from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count, Exists, OuterRef

from .models import Notification, Message
from .serializers import (
    NotificationSerializer, MessageSerializer,
    SendMessageSerializer, AnnouncementSerializer,
)
from users.permissions import IsAdmin


# ---------------------------------------------------------------------------
# Notifications
# ---------------------------------------------------------------------------
class NotificationListView(generics.ListAPIView):
    serializer_class   = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)


class UnreadNotificationCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(recipient=request.user, is_read=False).count()
        return Response({'success': True, 'unread_count': count})


class MarkNotificationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            n = Notification.objects.get(pk=pk, recipient=request.user)
        except Notification.DoesNotExist:
            return Response({'success': False, 'message': 'Not found.'}, status=404)
        n.is_read = True
        n.save()
        return Response({'success': True, 'message': 'Marked as read.'})


class MarkAllReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({'success': True, 'message': 'All notifications marked as read.'})


# ---------------------------------------------------------------------------
# Messages — Inbox
# ---------------------------------------------------------------------------
class InboxView(generics.ListAPIView):
    """
    Returns messages received by the current user, including:
    - Direct messages sent to them
    - Announcements (recipient=null, type=announcement)
    - Course updates for courses they're enrolled in (recipient=null, type=course_update)
    """
    serializer_class   = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs   = Message.objects.select_related('sender', 'recipient', 'course').annotate(
            reply_count=Count('replies')
        )

        if user.is_admin:
            # Admin sees everything
            return qs

        if user.is_teacher:
            # Teacher sees: direct messages to them + their own sent messages
            return qs.filter(
                Q(recipient=user) |
                Q(sender=user)
            ).distinct()

        if user.is_student:
            # Student sees: direct messages to them + announcements + course updates for enrolled courses
            from enrollments.models import Enrollment
            from django.db.models import Exists, OuterRef
            
            # Use Exists subquery for better performance
            enrolled_subquery = Enrollment.objects.filter(
                student=user,
                status__in=['active', 'completed'],
                course_id=OuterRef('course_id')
            )

            return qs.filter(
                Q(recipient=user) |
                Q(message_type=Message.MessageType.ANNOUNCEMENT, recipient__isnull=True) |
                Q(message_type=Message.MessageType.COURSE_UPDATE,
                  recipient__isnull=True,
                  course_id__isnull=False) & Q(Exists(enrolled_subquery))
            ).distinct()

        return Message.objects.none()


class SentView(generics.ListAPIView):
    """Messages sent by the current user."""
    serializer_class   = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Message.objects.filter(sender=self.request.user).select_related(
            'recipient', 'course'
        ).annotate(reply_count=Count('replies'))


class SendMessageView(generics.CreateAPIView):
    serializer_class   = SendMessageSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        message = serializer.save()

        # Create a notification for the recipient if it's a direct message
        if message.recipient:
            from notifications.services import create_notification
            create_notification(
                recipient         = message.recipient,
                notification_type = 'system',
                title             = f'New message from {request.user.full_name}',
                message           = message.subject,
                related_object_id = message.id,
            )

        return Response({
            'success': True,
            'message': 'Message sent.',
            'data': MessageSerializer(message).data,
        }, status=status.HTTP_201_CREATED)


class AnnouncementView(generics.CreateAPIView):
    """Admin-only: broadcast a global announcement."""
    serializer_class   = AnnouncementSerializer
    permission_classes = [IsAdmin]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        announcement = serializer.save()

        # Notify all active users (batch insert for performance)
        from users.models import User
        from notifications.services import create_notification
        users = User.objects.filter(is_active=True).exclude(pk=request.user.pk)
        notifications = [
            Notification(
                recipient         = u,
                notification_type = 'announcement',
                title             = announcement.subject,
                message           = announcement.body,
                related_object_id = announcement.id,
            )
            for u in users
        ]
        Notification.objects.bulk_create(notifications, batch_size=500)

        return Response({
            'success': True,
            'message': f'Announcement sent to {len(notifications)} users.',
            'data': MessageSerializer(announcement).data,
        }, status=status.HTTP_201_CREATED)


class MessageDetailView(generics.RetrieveAPIView):
    serializer_class   = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Message.objects.filter(
            Q(sender=user) | Q(recipient=user) | Q(recipient__isnull=True)
        )

    def retrieve(self, request, *args, **kwargs):
        message = self.get_object()
        # Mark as read when retrieved by recipient
        if message.recipient == request.user and not message.is_read:
            message.is_read = True
            message.save()
        return Response({'success': True, 'data': self.get_serializer(message).data})


class MarkMessageReadView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            msg = Message.objects.get(pk=pk)
        except Message.DoesNotExist:
            return Response({'success': False, 'message': 'Not found.'}, status=404)
        if msg.recipient == request.user or msg.recipient is None:
            msg.is_read = True
            msg.save()
        return Response({'success': True, 'message': 'Marked as read.'})


class UnreadMessageCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = self.request.user
        count = Message.objects.filter(
            Q(recipient=user) | Q(recipient__isnull=True, message_type=Message.MessageType.ANNOUNCEMENT),
            is_read=False,
        ).exclude(sender=user).count()
        return Response({'success': True, 'unread_count': count})


class MessageRepliesView(generics.ListAPIView):
    """Get all replies to a message thread."""
    serializer_class   = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Message.objects.filter(parent_id=self.kwargs['pk']).select_related('sender', 'recipient')
