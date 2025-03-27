from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from enum import Enum

# Initialize extensions
db = SQLAlchemy()

class Role(Enum):
    ADMIN = "admin"
    CUSTOMER = "customer"
    PROFESSIONAL = "professional"

class ServiceStatus(Enum):
    REQUESTED = "requested"
    ASSIGNED = "assigned"
    CLOSED = "closed"

class User(db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    role = db.Column(db.Enum(Role), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    # Relationships
    customer = db.relationship('Customer', backref='user', uselist=False, cascade='all, delete-orphan')
    professional = db.relationship('ServiceProfessional', backref='user', uselist=False, cascade='all, delete-orphan')

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)

class Customer(db.Model):
    __tablename__ = 'customer'
    id = db.Column(db.Integer, db.ForeignKey('user.id'), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(100), nullable=True)
    pin_code = db.Column(db.String(10), nullable=True)

    # Relationships
    service_requests = db.relationship('ServiceRequest', backref='customer', lazy='dynamic',
                                       foreign_keys='ServiceRequest.customer_id')
    reviews = db.relationship('Review', backref='customer', lazy='dynamic',
                              foreign_keys='Review.customer_id')


class ServiceProfessional(db.Model):
    __tablename__ = 'service_professional'
    id = db.Column(db.Integer, db.ForeignKey('user.id'), primary_key=True)
    name = db.Column(db.String(100), nullable=False)  # Added name field
    service_id = db.Column(db.Integer, db.ForeignKey('service.id'), nullable=False)
    experience = db.Column(db.Integer, default=0)  # years of experience
    description = db.Column(db.Text, nullable=True)
    is_verified = db.Column(db.Boolean, default=False)
    profile_doc_url = db.Column(db.String(255), nullable=True)
    rating = db.Column(db.Float, default=0.0)

    # Relationships
    service = db.relationship('Service', backref='professionals')
    service_requests = db.relationship('ServiceRequest', backref='professional', lazy='dynamic',
                                      foreign_keys='ServiceRequest.professional_id')
    reviews_received = db.relationship('Review', backref='professional', lazy='dynamic',
                                      foreign_keys='Review.professional_id')

class Service(db.Model):
    __tablename__ = 'service'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    base_price = db.Column(db.Float, nullable=False)
    time_required = db.Column(db.Integer, nullable=False)  # in minutes
    description = db.Column(db.Text, nullable=True)

    # Relationships
    service_requests = db.relationship('ServiceRequest', backref='service', lazy='dynamic')

class ServiceRequest(db.Model):
    __tablename__ = 'service_request'
    id = db.Column(db.Integer, primary_key=True)
    service_id = db.Column(db.Integer, db.ForeignKey('service.id'), nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('customer.id'), nullable=False)
    professional_id = db.Column(db.Integer, db.ForeignKey('service_professional.id'), nullable=True)
    date_of_request = db.Column(db.DateTime, default=datetime.utcnow)
    preferred_date = db.Column(db.DateTime, nullable=True)
    preferred_time = db.Column(db.String(10), nullable=True)
    date_of_completion = db.Column(db.DateTime, nullable=True)
    service_status = db.Column(db.String(20), nullable=False)
    remarks = db.Column(db.Text, nullable=True)
    location = db.Column(db.String(100), nullable=True)
    pin_code = db.Column(db.String(10), nullable=True)

    # Relationships
    review = db.relationship('Review', backref='service_request', uselist=False, cascade='all, delete-orphan')

class Review(db.Model):
    __tablename__ = 'review'
    id = db.Column(db.Integer, primary_key=True)
    service_request_id = db.Column(db.Integer, db.ForeignKey('service_request.id'), nullable=False)
    customer_id = db.Column(db.Integer, db.ForeignKey('customer.id'), nullable=False)
    professional_id = db.Column(db.Integer, db.ForeignKey('service_professional.id'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)  # 1 to 5 stars
    review_text = db.Column(db.Text, nullable=True)
    date_created = db.Column(db.DateTime, default=datetime.utcnow)

# from enum import Enum



# Function to initialize database
def init_db(app):
    db.init_app(app)
    with app.app_context():
        # db.drop_all()
        db.create_all()
