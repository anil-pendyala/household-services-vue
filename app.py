from flask import Flask
from application.database import db
from application.models import User, Role
from application.config import LocalDevelopmentConfig
from flask_security import Security, SQLAlchemyUserDatastore
from flask_security import hash_password

def create_app():
    app = Flask(__name__)
    app.config.from_object(LocalDevelopmentConfig)
    db.init_app(app)

    datastore = SQLAlchemyUserDatastore(db, User, Role)
    app.security = Security(app, datastore)

    app.app_context().push()
    return app

app = create_app()

with app.app_context():
     db.create_all()

     app.security.datastore.find_or_create_role(name = "admin", description = "Administrator")
     app.security.datastore.find_or_create_role(name = "user", description = "User")
     db.session.commit()

     if not app.security.datastore.find_user(email = "admin@abc.com"):
         user = app.security.datastore.create_user(email = "admin@abc.com", password = "admin", roles = ['admin'])

     if not app.security.datastore.find_user(email = "user1@abc.com"):
         user = app.security.datastore.create_user(email = "user1@abc.com", password = "user1", roles = ['user'])

     db.session.commit()

# hashed_password = bcrypt(password, salt)

if __name__ == "__main__":
    app.run()
