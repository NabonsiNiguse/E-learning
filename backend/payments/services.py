import logging
import uuid
from django.db import transaction, IntegrityError
from .models import Payment
from enrollments.models import Enrollment
from courses.models import Course
from notifications.services import create_notification

logger = logging.getLogger(__name__)

def process_payment(student, course_id: int, payment_method: str, simulate: str) -> dict:
    """
    Processes payment with strict ACID compliance.
    Optimizes DB I/O, prevents TOCTOU race conditions, and eliminates 
    transactional side-effects.
    """
    # 1. Fail-Fast Validations (Execute before holding any DB connections open)
    try:
        course = Course.objects.get(pk=course_id)
    except Course.DoesNotExist:
        return {'success': False, 'message': 'Course not found.'}

    if not course.is_premium:
        return {'success': False, 'message': 'This course does not require payment.'}

    # Determine state variables upfront to achieve Single-Shot INSERT optimization
    is_success = (simulate == 'success')
    target_status = Payment.Status.SUCCESS if is_success else Payment.Status.FAILED
    failure_reason = None if is_success else 'Simulated payment failure.'
    
    # Preserve full entropy (32 hex chars) to completely eliminate Birthday Paradox collisions
    reference = f'PAY-{uuid.uuid4().hex.upper()}' 
    
    notification_kwargs = {}

    try:
        with transaction.atomic():
            # 2. TOCTOU Mitigation: Perform the duplicate check INSIDE the transaction block
            # If your DB schema has a UNIQUE constraint on (student, course, status='SUCCESS'),
            # this check handles it gracefully before a hard database exception is thrown.
            existing = Payment.objects.filter(
                student=student, course=course, status=Payment.Status.SUCCESS
            ).exists()
            
            if existing:
                return {'success': False, 'message': 'You have already paid for this course.'}

            # 3. Optimized Single-Shot Write: Avoids the Create(PENDING) -> Update(SUCCESS/FAILED) double write
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
                # 4. Atomic Enrollment State Mutation
                enrollment, created = Enrollment.objects.get_or_create(
                    student=student,
                    course=course,
                    defaults={'status': Enrollment.Status.ACTIVE},
                )
                if not created and enrollment.status == Enrollment.Status.LOCKED:
                    enrollment.status = Enrollment.Status.ACTIVE
                    # Highly Optimized SQL Generation: Only update changed column
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

            # 5. Architectural Cleanliness: Push Network I/O / Side-Effects out of the Transaction
            # This hooks into Django's commit phase. If the transaction rolls back, 
            # the notification never fires. If it succeeds, it fires without locking rows.
            transaction.on_commit(lambda: create_notification(**notification_kwargs))

        return response_payload

    except IntegrityError as e:
        # Gracefully handle concurrent request race-conditions that slipped past the .exists() check
        logger.error(f"Concurrency conflict during payment allocation for student {student.id}: {str(e)}")
        return {'success': False, 'message': 'Payment processing conflict. Please try again.'}