# Generated migration to add locked field to Course model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('courses', '0002_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='course',
            name='locked',
            field=models.BooleanField(default=False, help_text='If True, no more grade changes allowed.'),
        ),
        migrations.AddField(
            model_name='course',
            name='results_submitted_at',
            field=models.DateTimeField(blank=True, null=True, help_text='When final results were submitted.'),
        ),
    ]
