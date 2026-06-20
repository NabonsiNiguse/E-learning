from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    """
    Wraps all DRF errors in a consistent envelope:
    { "success": false, "message": "...", "errors": {...} }
    """
    response = exception_handler(exc, context)

    if response is not None:
        errors = response.data

        # Flatten single-key non-field errors for cleaner messages
        message = 'An error occurred.'
        if isinstance(errors, dict):
            if 'detail' in errors:
                message = str(errors['detail'])
                errors = {}
            else:
                # Use first field's first error as the top-level message
                first_val = next(iter(errors.values()), None)
                if isinstance(first_val, list) and first_val:
                    message = str(first_val[0])
        elif isinstance(errors, list) and errors:
            message = str(errors[0])

        response.data = {
            'success': False,
            'message': message,
            'errors': errors if isinstance(errors, dict) else {},
        }

    return response
