"""
Assigns a high-quality Unsplash thumbnail URL to every course that has none.
Usage:  python manage.py add_course_thumbnails
"""
from django.core.management.base import BaseCommand
from courses.models import Course

# Unsplash URLs — 800×450, cropped, no auth required
CATEGORY_THUMBNAILS = {
    "Development":   "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop&auto=format",
    "Programming":   "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop&auto=format",
    "Design":        "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=450&fit=crop&auto=format",
    "UX Design":     "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=450&fit=crop&auto=format",
    "Data":          "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop&auto=format",
    "Data Science":  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop&auto=format",
    "Marketing":     "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop&auto=format",
    "Business":      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=450&fit=crop&auto=format",
    "Science":       "https://images.unsplash.com/photo-1532094349884-543559059a6b?w=800&h=450&fit=crop&auto=format",
    "Math":          "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&h=450&fit=crop&auto=format",
    "Language":      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=450&fit=crop&auto=format",
    "Machine Learning": "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&h=450&fit=crop&auto=format",
}

DEFAULT_THUMBNAIL = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop&auto=format"


class Command(BaseCommand):
    help = "Assign Unsplash thumbnail URLs to courses that have no thumbnail"

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Overwrite existing thumbnails too",
        )

    def handle(self, *args, **options):
        force   = options["force"]
        qs      = Course.objects.all() if force else Course.objects.filter(thumbnail="")
        updated = 0

        for course in qs:
            url = CATEGORY_THUMBNAILS.get(course.category, DEFAULT_THUMBNAIL)
            # ImageField stores a string path; we store the URL directly
            Course.objects.filter(pk=course.pk).update(thumbnail=url)
            updated += 1
            self.stdout.write(self.style.SUCCESS(
                f"  ✓  [{course.category or 'default'}]  {course.title}"
            ))

        self.stdout.write(self.style.SUCCESS(f"\nDone — {updated} course(s) updated."))
