from rest_framework import serializers
from .models import Notification, Message
from users.serializers import UserListSerializer


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Notification
        fields = [
            'id', 'notification_type', 'title', 'message',
            'is_read', 'related_object_id', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


# ---------------------------------------------------------------------------
# Messages
# ---------------------------------------------------------------------------
class MessageSerializer(serializers.ModelSerializer):
    sender_detail    = UserListSerializer(source='sender', read_only=True)
    recipient_detail = UserListSerializer(source='recipient', read_only=True)
    reply_count      = serializers.SerializerMethodField()

    class Meta:
        model  = Message
        fields = [
            'id', 'sender', 'sender_detail', 'recipient', 'recipient_detail',
            'course', 'message_type', 'subject', 'body', 'is_read',
            'parent', 'reply_count', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'sender', 'is_read', 'created_at', 'updated_at']

    def get_reply_count(self, obj):
        # Use annotated value if available, otherwise fallback to count()
        return getattr(obj, 'reply_count', obj.replies.count())


class SendMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Message
        fields = ['recipient', 'course', 'message_type', 'subject', 'body', 'parent']

    def validate(self, attrs):
        request      = self.context['request']
        sender       = request.user
        msg_type     = attrs.get('message_type', Message.MessageType.DIRECT)
        recipient    = attrs.get('recipient')
        course       = attrs.get('course')

        if sender.is_student:
            # Students can only send direct messages to teachers of enrolled courses
            if msg_type != Message.MessageType.DIRECT:
                raise serializers.ValidationError('Students can only send direct messages.')
            if not recipient:
                raise serializers.ValidationError('Recipient is required.')
            if not recipient.is_teacher:
                raise serializers.ValidationError('Students can only message teachers.')
            # Verify enrollment
            from enrollments.models import Enrollment
            if course:
                enrolled = Enrollment.objects.filter(
                    student=sender, course=course, status__in=['active', 'completed']
                ).exists()
                if not enrolled:
                    raise serializers.ValidationError('You are not enrolled in this course.')

        elif sender.is_teacher:
            if msg_type == Message.MessageType.ANNOUNCEMENT:
                raise serializers.ValidationError('Teachers cannot send announcements.')
            if msg_type == Message.MessageType.COURSE_UPDATE:
                if not course:
                    raise serializers.ValidationError('Course is required for course updates.')
                if course.teacher != sender:
                    raise serializers.ValidationError('You do not own this course.')
                # recipient is null for broadcast course updates
                attrs['recipient'] = None

        elif sender.is_admin:
            if msg_type == Message.MessageType.ANNOUNCEMENT:
                attrs['recipient'] = None  # broadcast
                attrs['course']    = None

        return attrs

    def create(self, validated_data):
        validated_data['sender'] = self.context['request'].user
        return super().create(validated_data)


class AnnouncementSerializer(serializers.ModelSerializer):
    """Admin-only: create a global announcement."""
    class Meta:
        model  = Message
        fields = ['subject', 'body']

    def create(self, validated_data):
        validated_data['sender']       = self.context['request'].user
        validated_data['message_type'] = Message.MessageType.ANNOUNCEMENT
        validated_data['recipient']    = None
        return super().create(validated_data)
