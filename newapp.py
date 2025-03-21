from flask import Flask, request, jsonify
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from models import db, User, Customer, Role, Service, ServiceProfessional, init_db
from flask_jwt_extended import JWTManager, create_access_token


app = Flask(__name__)
bcrypt = Bcrypt(app)
CORS(app)  # Allow frontend to communicate with backend
# jwt = JWTManager(app)

# Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///household.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# app.config['JWT_SECRET_KEY'] = 'super-secret'

# Initialize database
init_db(app)

@app.route('/register-customer', methods=['POST'])
def register_customer():
    data = request.json

    # Check if the email already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"error": "Email already registered"}), 400

    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')

    # Create User
    new_user = User(
        email=data['email'],
        password_hash=hashed_password,
        role=Role.CUSTOMER
    )
    db.session.add(new_user)
    db.session.commit()  # Commit to generate user ID

    # Create Customer
    new_customer = Customer(
        id=new_user.id,  # Use the user ID
        name=data['name'],
        location=data.get('location'),
        pin_code=data.get('pin_code')
    )

    db.session.add(new_customer)
    db.session.commit()

    return jsonify({"message": f"Registered successfully! You can now login, {data['name']}"}), 201


@app.route('/register-professional', methods=['POST'])
def register_professional():
    data = request.json

    # Check if the email already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"error": "Email already registered"}), 400

    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')

    # Create User
    new_user = User(
        email=data['email'],
        password_hash=hashed_password,
        role=Role.PROFESSIONAL
    )
    db.session.add(new_user)
    db.session.commit()

    # Create Professional
    new_professional = ServiceProfessional(
        id=new_user.id,
        name=data['name'],
        service_id=data['service_id'],
        experience=data.get('experience', 0),
        description=data.get('description', ''),
        profile_doc_url=data.get('profile_doc_url'),
        is_verified=False
    )

    db.session.add(new_professional)
    db.session.commit()

    return jsonify({"message": "Registered successfully! You will be able to login once your documents are verified."}), 201

# Route to fetch all available services
@app.route('/services', methods=['GET'])
def get_services():
    services = Service.query.all()
    service_list = [{"id": service.id, "name": service.name} for service in services]
    return jsonify(service_list)

@app.route('/add-service', methods=['POST'])
def add_service():
    data = request.json
    service_name = data.get("name")
    base_price = data.get("base_price")
    time_required = data.get("time_required")
    description = data.get("description", "")

    if not service_name or base_price is None or time_required is None:
        return jsonify({"error": "Service name, base price, and time required are mandatory"}), 400

    # Add service to the database
    new_service = Service(
        name=service_name,
        base_price=base_price,
        time_required=time_required,
        description=description
    )
    db.session.add(new_service)
    db.session.commit()

    return jsonify({"message": "Service added successfully!"}), 201


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    if email == 'admin@abc.com' and password == 'admin':
        return jsonify({"userRole":"admin"}), 200

    user = User.query.filter_by(email=email).first()

    if user and bcrypt.check_password_hash(user.password_hash, password) and user.is_active:
        return jsonify({"userId": user.id, "userRole": str(user.role.name)}), 200

    elif user and bcrypt.check_password_hash(user.password_hash, password) and not user.is_active:
        return jsonify({'error': 'Your account is blocked!'}), 401

    else:
        return jsonify({'error': 'Invalid email or password'}), 401

if __name__ == '__main__':
    app.run(debug=True)
