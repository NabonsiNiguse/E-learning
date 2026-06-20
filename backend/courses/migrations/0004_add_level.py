# Generated migration to add 'level' field to Course model
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0003_course_locked'),
    ]

    operations = [
        migrations.AddField(
            model_name='course',
            name='level',
            field=models.CharField(default='Beginner', max_length=50, blank=True),
        ),
    ]
