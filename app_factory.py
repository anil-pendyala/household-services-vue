# tasks.py

import os
import requests
import csv
from datetime import datetime, timedelta
from celery import Celery
from celery.schedules import crontab
from models import db, ServiceRequest, ServiceProfessional, Customer
from app_factory import create_app, mail

# ----> THIS is now the only app creation
flask_app = create_app()

def make_celery(app):
    celery = Celery(
        app.import_name,
        backend='redis://localhost:6379/0',
        broker='redis://localhost:6379/0'
    )
    celery.conf.update(app.config)

    class ContextTask(celery.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)

    celery.Task = ContextTask
    return celery

celery = make_celery(flask_app)

@celery.task
def send_daily_reminders():
    pending_requests = db.session.query(ServiceProfessional).join(
        ServiceRequest, ServiceProfessional.id == ServiceRequest.professional_id
    ).filter(ServiceRequest.service_status == 'REQUESTED').distinct().all()

    for professional in pending_requests:
        webhook_url = "<your webhook>"
        message = {"text": f"Pending requests alert for Professional {professional.id}"}

        requests.post(webhook_url, json=message)

    print("Reminders sent.")
