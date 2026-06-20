"""
Payments admin — payment records with status management, revenue stats,
and data integrity (reference is immutable, amounts are read-only).
"""
from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Sum, Count
from .models import Payment


class PaymentAdmin(admin.ModelAdmin):
    list_display  = [
        'reference', 'student_link', 'course_link',
        'amount_display', 'method_badge', 'status_badge',
        'created_at',
    ]
    list_filter   = ['status', 'payment_method', 'created_at']
    search_fields = ['reference', 'student__email', 'student__first_name', 'course__title']
    readonly_fields = ['reference', 'created_at', 'updated_at']
    raw_id_fields   = ['student', 'course']
    date_hierarchy  = 'created_at'
    list_per_page   = 30
    actions         = ['mark_success', 'mark_failed']

    fieldsets = (
        ('Payment Details', {
            'fields': ('reference', 'student', 'course', 'amount', 'payment_method'),
        }),
        ('Status', {
            'fields': ('status', 'failure_reason'),
        }),
        ('Timestamps', {
            'classes': ('collapse',),
            'fields': ('created_at', 'updated_at'),
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('student', 'course')

    def changelist_view(self, request, extra_context=None):
        """Add revenue summary to the top of the list."""
        qs = self.get_queryset(request)
        stats = qs.aggregate(
            total_revenue=Sum('amount', filter=__import__('django.db.models', fromlist=['Q']).Q(status='success')),
            total_payments=Count('id'),
            successful=Count('id', filter=__import__('django.db.models', fromlist=['Q']).Q(status='success')),
        )
        extra_context = extra_context or {}
        extra_context['stats'] = stats
        return super().changelist_view(request, extra_context=extra_context)

    @admin.display(description='Student')
    def student_link(self, obj):
        return format_html(
            '<a href="/admin/users/user/{}/change/">{}</a>',
            obj.student_id, obj.student.full_name
        )

    @admin.display(description='Course')
    def course_link(self, obj):
        return format_html(
            '<a href="/admin/courses/course/{}/change/">{}</a>',
            obj.course_id, obj.course.title
        )

    @admin.display(description='Amount')
    def amount_display(self, obj):
        return format_html('<strong>${}</strong>', obj.amount)

    @admin.display(description='Method')
    def method_badge(self, obj):
        labels = {
            'mock_card':   ('💳', 'Card'),
            'mock_bank':   ('🏦', 'Bank'),
            'mock_wallet': ('👛', 'Wallet'),
        }
        icon, label = labels.get(obj.payment_method, ('💰', obj.payment_method))
        return format_html('{} {}', icon, label)

    @admin.display(description='Status')
    def status_badge(self, obj):
        styles = {
            'success': ('background:#d1fae5;color:#065f46', '✓ Success'),
            'pending': ('background:#fef3c7;color:#92400e', '⏳ Pending'),
            'failed':  ('background:#fee2e2;color:#991b1b', '✗ Failed'),
        }
        style, label = styles.get(obj.status, ('background:#f3f4f6;color:#374151', obj.status))
        return format_html(
            '<span style="{};padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600;">{}</span>',
            style, label
        )

    # ── Actions ──────────────────────────────────────────────────────────
    @admin.action(description='✓ Mark selected as success')
    def mark_success(self, request, queryset):
        updated = queryset.update(status=Payment.Status.SUCCESS)
        self.message_user(request, f'{updated} payment(s) marked as success.')

    @admin.action(description='✗ Mark selected as failed')
    def mark_failed(self, request, queryset):
        updated = queryset.update(status=Payment.Status.FAILED)
        self.message_user(request, f'{updated} payment(s) marked as failed.')
