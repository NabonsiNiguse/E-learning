import django_filters
from .models import Course


class CourseFilter(django_filters.FilterSet):
    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte')
    teacher   = django_filters.NumberFilter(field_name='teacher__id')

    class Meta:
        model  = Course
        fields = ['status', 'is_premium', 'category', 'teacher', 'min_price', 'max_price']
