from celery import Celery
from flask import current_app

celery = Celery(
    'my_project',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/0'
)

# Explicitly import tasks to register them
import tasks

def make_celery(app):
    celery.conf.update(app.config)

    class ContextTask(celery.Task):
        def __call__(self, *args, **kwargs):
            with app.app_context():
                return self.run(*args, **kwargs)

    celery.Task = ContextTask
    return celery

def init_celery(app):
    """
    Initialize Celery with the Flask app context.
    This is a wrapper around make_celery to match the import in newapp.py.
    """
    global celery
    celery = make_celery(app)
    return celery
