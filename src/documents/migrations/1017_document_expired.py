# Generated by Django 3.2.6 on 2022-02-27 12:09

from django.db import migrations, models
from django.db.migrations import RunPython
from django_q.models import Schedule
from django_q.tasks import schedule

class Migration(migrations.Migration):

    def add_schedules(apps, schema_editor):
        schedule('documents.tasks.remove_expired_documents', name="Remove Expired Documents", schedule_type=Schedule.DAILY)

    def remove_schedules(apps, schema_editor):
        schedule.objects.filter(func='documents.tasks.remove_expired_documents').delete()

    dependencies = [
        ('documents', '1016_auto_20210317_1351'),
    ]

    operations = [
        migrations.AddField(
            model_name='document',
            name='expired',
            field=models.DateTimeField(blank=True, db_index=True, help_text='The expire date of the archived document.', null=True, verbose_name='expired'),
        ),
        RunPython(add_schedules, remove_schedules)
    ]
