from celery.schedules import crontab
from tasks import send_daily_reminders

celery.conf.beat_schedule = {
    "send-daily-reminders": {
        "task": "tasks.send_daily_reminders",
        "schedule": crontab(hour=18, minute=0),  # Runs daily at 6 PM
    },
}
