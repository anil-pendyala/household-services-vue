import requests
from celery import Celery
from models import db, ServiceProfessional, ServiceRequest
from sqlalchemy import func
from datetime import datetime, timedelta
from flask import current_app
from celery.schedules import crontab
from newapp import app


# Setup Celery
celery = Celery('tasks', broker='redis://localhost:6379/0')
celery.conf.beat_schedule = {
    'send-daily-reminders': {
        'task': 'tasks.send_daily_reminders',
        'schedule': crontab(hour=18, minute=0),  # Run every day at 6 PM
    },
}

def send_google_chat_notification(webhook_url, message):
    """
    Send a notification to Google Chat using a webhook
    """
    try:
        payload = {
            "text": message
        }
        response = requests.post(webhook_url, json=payload)
        return response.status_code == 200
    except Exception as e:
        print(f"Error sending Google Chat notification: {e}")
        return False

@celery.task(name='tasks.send_daily_reminders')
def send_daily_reminders():
    """
    Send daily reminders to service professionals about pending service requests
    """
    with app.app_context():
        # Find professionals with pending service requests
        pending_requests = db.session.query(
            ServiceProfessional.id,
            ServiceProfessional.name,
            ServiceProfessional.email,
            func.count(ServiceRequest.id).label('pending_request_count')
        ).join(
            ServiceRequest, ServiceProfessional.id == ServiceRequest.professional_id
        ).filter(
            ServiceRequest.service_status == 'REQUESTED'
        ).group_by(
            ServiceProfessional.id,
            ServiceProfessional.name,
            ServiceProfessional.email
        ).all()

        google_chat_webhook = current_app.config.get('GOOGLE_CHAT_WEBHOOK')

        for professional in pending_requests:
            message = (
                f"Daily Reminder: You have {professional.pending_request_count} "
                f"pending service request(s) awaiting your action. "
                f"Please log in to your account to review and respond."
            )

            # Send Google Chat notification
            if google_chat_webhook:
                send_google_chat_notification(google_chat_webhook, message)

            # Optional: Add email or SMS notification logic here

        return f"Sent reminders to {len(pending_requests)} professionals"
