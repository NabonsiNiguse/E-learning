"""
Notifications admin — in-app notifications and messages with bulk
read/unread management and broadcast support.
"""
from django.contrib import admin
from django.utils.html import format_html
from .models import Notification, Message


# ---------------------------------------------------------------------------
# Notification
# ---------------------------------------------------------------------------
class NotificationAdmin(admin.ModelAdmin):
    list_display  = [
        'recipient_link', 'type_badge', 'title',
        'is_read_icon', 'created_at',
    ]
    list_filter   = ['notification_type', 'is_read', 'created_at']
    search_fields = ['recipient__email', 'recipient__first_name', 'title', 'message']
    readonly_fields = ['created_at']
    raw_id_fields   = ['recipient']
    date_hierarchy  = 'created_at'
    list_per_page   = 40
    actions         = ['mark_read', 'mark_unread']

    @admin.display(description='Recipient')
    def recipient_link(self, obj):
        return format_html(
            '<a href="/admin/users/user/{}/change/">{}</a>',
            obj.recipient_id, obj.recipient.full_name
        )

    @admin.display(description='Type')
    def type_badge(self, obj):
        colors = {
            'announcement':    ('#7c3aed', '#ede9fe'),
            'course_update':   ('#0284c7', '#e0f2fe'),
            'enrollment':      ('#059669', '#d1fae5'),
            'payment_success': ('#059669', '#d1fae5'),
            'payment_failed':  ('#dc2626', '#fee2e2'),
            'system':          ('#6b7280', '#f3f4f6'),
            'message':         ('#d97706', '#fef3c7'),
        }
        fg, bg = colors.get(obj.notification_type, ('#6b7280', '#f3f4f6'))
        return format_html(
            '<span style="background:{};color:{};padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;">{}</span>',
            bg, fg, obj.notification_type.replace('_', ' ').title()
        )

    @admin.display(description='Read', boolean=True)
    def is_read_icon(self, obj):
        return obj.is_read

    @admin.action(description='✓ Mark selected as read')
    def mark_read(self, request, queryset):
        updated = queryset.update(is_read=True)
        self.message_user(request, f'{updated} notification(s) marked as read.')

    @admin.action(description='○ Mark selected as unread')
    def mark_unread(self, request, queryset):
        updated = queryset.update(is_read=False)
        self.message_user(request, f'{updated} notification(s) marked as unread.')


# ---------------------------------------------------------------------------
# Message
# ---------------------------------------------------------------------------
class MessageAdmin(admin.ModelAdmin):
    list_display  = [
        'sender_link', 'recipient_display', 'type_badge',
        'subject', 'is_read_icon', 'created_at',
    ]
    list_filter   = ['message_type', 'is_read', 'created_at']
    search_fields = ['sender__email', 'recipient__email', 'subject', 'body']
    readonly_fields = ['created_at', 'updated_at']
    raw_id_fields   = ['sender', 'recipient', 'course', 'parent']
    date_hierarchy  = 'created_at'
    list_per_page   = 30

    @admin.display(description='Sender')
    def sender_link(self, obj):
        return format_html(
            '<a href="/admin/users/user/{}/change/">{}</a>',
            obj.sender_id, obj.sender.full_name
        )

    @admin.display(description='Recipient')
    def recipient_display(self, obj):
        if obj.recipient:
            return format_html(
                '<a href="/admin/users/user/{}/change/">{}</a>',
                obj.recipient_id, obj.recipient.full_name
            )
        return format_html('<em style="color:#6b7280;">Broadcast</em>')

    @admin.display(description='Type')
    def type_badge(self, obj):
        colors = {
            'direct':        ('#2563eb', '#dbeafe'),
            'announcement':  ('#7c3aed', '#ede9fe'),
            'course_update': ('#059669', '#d1fae5'),
        }
        fg, bg = colors.get(obj.message_type, ('#6b7280', '#f3f4f6'))
        return format_html(
            '<span style="background:{};color:{};padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600;">{}</span>',
            bg, fg, obj.message_type.replace('_', ' ').title()
        )

    @admin.display(description='Read', boolean=True)
    def is_read_icon(self, obj):
        return obj.is_read
