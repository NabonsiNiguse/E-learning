import logging
import uuid
from django.db import transaction, IntegrityError
from .models import Payment
from enrollments.models import Enrollment
from courses.models import Course, CourseOffering
from notifications.services import create_notification

logger = logging.getLogger(__name__)

def process_payment(student, course_id: int, payment_method: str, simulate: str) -> dict:
    """
    Processes payment with strict ACID compliance.
    """
    try:
        course = Course.objects.get(pk=course_id)
    except Course.DoesNotExist:
        return {'success': False, 'message': 'Course not found.'}

    if not course.is_premium:
        return {'success': False, 'message': 'This course does not require payment.'}

    # Resolve course offering
    offering = CourseOffering.objects.filter(course=course, semester__is_active=True).first()
    if not offering:
        offering = CourseOffering.objects.filter(course=course).first()

    if not offering:
        return {'success': False, 'message': 'No active course offering available for enrollment.'}

    is_success = (simulate == 'success')
    target_status = Payment.Status.SUCCESS if is_success else Payment.Status.FAILED
    failure_reason = None if is_success else 'Simulated payment failure.'
    
    reference = f'PAY-{uuid.uuid4().hex.upper()}' 
    
    notification_kwargs = {}

    try:
        with transaction.atomic():
            existing = Payment.objects.filter(
                student=student, course=course, status=Payment.Status.SUCCESS
            ).exists()
            
            if existing:
                return {'success': False, 'message': 'You have already paid for this course.'}

            payment = Payment.objects.create(
                student=student,
                course=course,
                amount=course.price,
                reference=reference,
                payment_method=payment_method,
                status=target_status,
                failure_reason=failure_reason
            )

            if is_success:
                enrollment, created = Enrollment.objects.get_or_create(
                    student=student,
                    course_offering=offering,
                    defaults={'status': Enrollment.Status.ACTIVE},
                )
                if not created and enrollment.status == Enrollment.Status.LOCKED:
                    enrollment.status = Enrollment.Status.ACTIVE
                    enrollment.save(update_fields=['status']) 
                
                notification_kwargs = {
                    'recipient': student,
                    'notification_type': 'payment_success',
                    'title': 'Payment Successful',
                    'message': f'Your payment for "{course.title}" was successful.',
                    'related_object_id': payment.id,
                }
                
                response_payload = {
                    'success': True,
                    'message': 'Payment successful. Course unlocked.',
                    'payment': payment,
                    'enrollment': enrollment,
                }
            else:
                notification_kwargs = {
                    'recipient': student,
                    'notification_type': 'payment_failed',
                    'title': 'Payment Failed',
                    'message': f'Your payment for "{course.title}" failed. Please try again.',
                    'related_object_id': payment.id,
                }
                
                response_payload = {
                    'success': False,
                    'message': 'Payment failed.',
                    'payment': payment,
                }

            transaction.on_commit(lambda: create_notification(**notification_kwargs))

        return response_payload

    except IntegrityError as e:
        logger.error(f"Concurrency conflict during payment allocation for student {student.id}: {str(e)}")
        return {'success': False, 'message': 'Payment processing conflict. Please try again.'}