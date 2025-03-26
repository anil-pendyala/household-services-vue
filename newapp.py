from flask import Flask, request, jsonify
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from models import db, User, Customer, Role, Service, ServiceProfessional, ServiceRequest, Review, init_db
from datetime import datetime


app = Flask(__name__)
bcrypt = Bcrypt(app)
CORS(app)  # Allow frontend to communicate with backend

# Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///household.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

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
def get_all_services():
    services = Service.query.all()
    service_list = [{"id": service.id, "name": service.name, "base_price": service.base_price, "time_required": service.time_required, "description": service.description} for service in services]
    return jsonify(service_list)

# Add a new service
@app.route('/services', methods=['POST'])
def add_service():
    data = request.get_json()

    # Validate required fields
    if not data.get('name') or not data.get('base_price') or not data.get('time_required'):
        return jsonify({"error": "Service name, base price, and time required are mandatory"}), 400

    # Create new service
    service = Service(
        name=data.get('name'),
        base_price=float(data.get('base_price')),
        time_required=int(data.get('time_required')),
        description=data.get('description', '')
    )

    # Add to database
    db.session.add(service)

    try:
        db.session.commit()
        return jsonify({"message": "Service added successfully", "id": service.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to add service: {str(e)}"}), 500

# Update an existing service
@app.route('/services/<int:service_id>', methods=['PUT'])
def update_service(service_id):
    service = Service.query.get(service_id)

    if not service:
        return jsonify({"error": "Service not found"}), 404

    data = request.get_json()

    # Update service fields
    if 'name' in data:
        service.name = data['name']
    if 'base_price' in data:
        service.base_price = float(data['base_price'])
    if 'time_required' in data:
        service.time_required = int(data['time_required'])
    if 'description' in data:
        service.description = data['description']

    try:
        db.session.commit()
        return jsonify({"message": "Service updated successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to update service: {str(e)}"}), 500

# Delete a service
@app.route('/services/<int:service_id>', methods=['DELETE'])
def delete_service(service_id):
    service = Service.query.get(service_id)

    if not service:
        return jsonify({"error": "Service not found"}), 404

    try:
        if len(service.professionals) > 0 or len(service.service_requests) > 0:
            return jsonify({
                "error": "Cannot delete service as it is associated with professionals or service requests"
            }), 400

        db.session.delete(service)
        db.session.commit()
        return jsonify({"message": "Service deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to delete service: {str(e)}"}), 500

@app.route('/customers', methods=['GET'])
def get_all_customers():
    """
    Get a list of all customers with their account status
    """
    # Join User and Customer tables to get all customer information
    customers = db.session.query(
        Customer.id,
        Customer.name,
        User.email,
        Customer.location,
        Customer.pin_code,
        User.is_active
    ).join(
        User, Customer.id == User.id
    ).all()

    # Convert query results to a list of dictionaries
    customer_list = [{
        'id': c.id,
        'name': c.name,
        'email': c.email,
        'location': c.location,
        'pin_code': c.pin_code,
        'is_active': c.is_active
    } for c in customers]

    return jsonify(customer_list)

@app.route('/users/<int:user_id>/block', methods=['PUT'])
def block_user(user_id):
    """
    Block a user account (set is_active to False)
    """
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    if not user.is_active:
        return jsonify({"error": "User is already blocked"}), 400

    user.is_active = False

    try:
        db.session.commit()
        return jsonify({"message": "User blocked successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to block user: {str(e)}"}), 500

@app.route('/users/<int:user_id>/unblock', methods=['PUT'])
def unblock_user(user_id):
    """
    Unblock a user account (set is_active to True)
    """
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.is_active:
        return jsonify({"error": "User is already active"}), 400

    user.is_active = True

    try:
        db.session.commit()
        return jsonify({"message": "User unblocked successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to unblock user: {str(e)}"}), 500

@app.route('/professionals', methods=['GET'])
def get_all_professionals():
    """
    Get a list of all service professionals with their account status and service details
    """
    # Join User, ServiceProfessional, and Service tables to get all professional information
    professionals = db.session.query(
        ServiceProfessional.id,
        ServiceProfessional.name,
        User.email,
        ServiceProfessional.service_id,
        Service.name.label('service_name'),
        ServiceProfessional.experience,
        ServiceProfessional.description,
        ServiceProfessional.is_verified,
        ServiceProfessional.profile_doc_url,
        User.is_active
    ).join(
        User, ServiceProfessional.id == User.id
    ).join(
        Service, ServiceProfessional.service_id == Service.id
    ).all()

    # Convert query results to a list of dictionaries
    professional_list = [{
        'id': p.id,
        'name': p.name,
        'email': p.email,
        'service_id': p.service_id,
        'service_name': p.service_name,
        'experience': p.experience,
        'description': p.description,
        'is_verified': p.is_verified,
        'profile_doc_url': p.profile_doc_url,
        'is_active': p.is_active
    } for p in professionals]

    return jsonify(professional_list)

@app.route('/professionals/<int:professional_id>', methods=['GET'])
def get_professional(professional_id):
    """
    Get detailed information about a specific service professional
    """
    # Join User, ServiceProfessional, and Service tables to get professional information
    professional = db.session.query(
        ServiceProfessional.id,
        ServiceProfessional.name,
        User.email,
        ServiceProfessional.service_id,
        Service.name.label('service_name'),
        ServiceProfessional.experience,
        ServiceProfessional.description,
        ServiceProfessional.is_verified,
        ServiceProfessional.profile_doc_url,
        User.is_active,
        ServiceProfessional.rating
    ).join(
        User, ServiceProfessional.id == User.id
    ).join(
        Service, ServiceProfessional.service_id == Service.id
    ).filter(
        ServiceProfessional.id == professional_id
    ).first()

    if not professional:
        return jsonify({"error": "Professional not found"}), 404

    # Convert query result to a dictionary
    result = {
        'id': professional.id,
        'name': professional.name,
        'email': professional.email,
        'service_id': professional.service_id,
        'service_name': professional.service_name,
        'experience': professional.experience,
        'description': professional.description,
        'is_verified': professional.is_verified,
        'profile_doc_url': professional.profile_doc_url,
        'is_active': professional.is_active,
        'rating': professional.rating
    }

    return jsonify(result)

@app.route('/professionals/<int:professional_id>/verify', methods=['PUT'])
def verify_professional(professional_id):
    """
    Verify a service professional (set is_verified to True)
    """
    professional = ServiceProfessional.query.get(professional_id)

    if not professional:
        return jsonify({"error": "Professional not found"}), 404

    if professional.is_verified:
        return jsonify({"error": "Professional is already verified"}), 400

    professional.is_verified = True

    try:
        db.session.commit()
        return jsonify({"message": "Professional verified successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to verify professional: {str(e)}"}), 500

@app.route('/service-requests', methods=['POST'])
def create_service_request():
    data = request.json

    # Validate required fields
    required_fields = ['customer_id', 'service_id', 'preferred_date', 'preferred_time', 'location', 'pin_code']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400

    # Create new service request
    new_request = ServiceRequest(
        service_id=data['service_id'],
        customer_id=data['customer_id'],
        preferred_date=datetime.fromisoformat(data['preferred_date'].replace('Z', '+00:00')),
        preferred_time=data['preferred_time'],
        location=data['location'],
        pin_code=data['pin_code'],
        remarks=data.get('remarks', ''),
        service_status='REQUESTED'
    )

    db.session.add(new_request)

    try:
        db.session.commit()
        return jsonify({"message": "Service request created successfully", "id": new_request.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to create service request: {str(e)}"}), 500

@app.route('/service-requests/<int:request_id>', methods=['PUT'])
def update_service_request(request_id):
    serv_request = ServiceRequest.query.get(request_id)

    if not serv_request:
        return jsonify({"error": "Service request not found"}), 404

    if serv_request.service_status != 'REQUESTED':
        return jsonify({"error": "Cannot update a request that is not in 'requested' status"}), 400

    data = request.json

    # Update fields
    if 'preferred_date' in data:
        serv_request.preferred_date = datetime.fromisoformat(data['preferred_date'].replace('Z', '+00:00'))
    if 'preferred_time' in data:
        serv_request.preferred_time = data['preferred_time']
    if 'location' in data:
        serv_request.location = data['location']
    if 'pin_code' in data:
        serv_request.pin_code = data['pin_code']
    if 'remarks' in data:
        serv_request.remarks = data['remarks']

    try:
        db.session.commit()
        return jsonify({"message": "Service request updated successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to update service request: {str(e)}"}), 500

@app.route('/service-requests/<int:request_id>/cancel', methods=['PUT'])
def cancel_service_request(request_id):
    request_obj = ServiceRequest.query.get(request_id)

    if not request_obj:
        return jsonify({"error": "Service request not found"}), 404

    if request_obj.service_status != 'REQUESTED':
        return jsonify({"error": "Cannot cancel a request that is not in 'requested' status"}), 400

    request_obj.service_status = 'CANCELLED'

    try:
        db.session.commit()
        return jsonify({"message": "Service request cancelled successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to cancel service request: {str(e)}"}), 500

@app.route('/customers/<int:customer_id>/service-requests', methods=['GET'])
def get_customer_service_requests(customer_id):
    # Query to get all service requests with service name
    requests = db.session.query(
        ServiceRequest,
        Service.name.label('service_name'),
        ServiceProfessional.name.label('professional_name')
    ).join(
        Service, ServiceRequest.service_id == Service.id
    ).outerjoin(
        ServiceProfessional, ServiceRequest.professional_id == ServiceProfessional.id
    ).filter(
        ServiceRequest.customer_id == customer_id
    ).all()

    # Format results
    result = []
    for req, service_name, professional_name in requests:
        request_data = {
            'id': req.id,
            'service_id': req.service_id,
            'service_name': service_name,
            'date_of_request': req.date_of_request.isoformat(),
            'preferred_date': req.preferred_date.isoformat() if req.preferred_date else None,
            'preferred_time': req.preferred_time,
            'location': req.location,
            'pin_code': req.pin_code,
            'service_status': req.service_status,
            'remarks': req.remarks,
            'professional_id': req.professional_id,
            'professional_name': professional_name,
            'date_of_completion': req.date_of_completion.isoformat() if req.date_of_completion else None,
            'has_review': False  # Set this based on your model relationship
        }

        # Check if the request has a review if your model includes this relationship
        if hasattr(req, 'review') and req.review is not None:
            request_data['has_review'] = True

        result.append(request_data)

    return jsonify(result)

@app.route('/customers/<int:customer_id>', methods=['GET'])
def get_customer_info(customer_id):
    customer = Customer.query.get(customer_id)

    if not customer:
        return jsonify({"error": "Customer not found"}), 404

    result = {
        'id': customer.id,
        'name': customer.name,
        'location': customer.location,
        'pin_code': customer.pin_code
    }

    return jsonify(result)

@app.route('/professionals/<int:professional_id>/assignments', methods=['GET'])
def get_professional_assignments(professional_id):
    # Ensure professional exists
    professional = ServiceProfessional.query.get_or_404(professional_id)

    # Get all service requests assigned to this professional
    assignments = ServiceRequest.query.filter_by(professional_id=professional_id).all()

    result = []
    for assignment in assignments:
        # Get customer info
        customer = Customer.query.get(assignment.customer_id)

        # Get review if service is completed
        review_data = None
        if assignment.service_status == 'CLOSED' and hasattr(assignment, 'review') and assignment.review:
            review_data = {
                'rating': assignment.review.rating,
                'review_text': assignment.review.review_text
            }

        result.append({
            'id': assignment.id,
            'service_id': assignment.service_id,
            'service_name': Service.query.get(assignment.service_id).name,
            'customer_id': assignment.customer_id,
            'customer_name': customer.name,
            'date_of_assignment': assignment.date_of_request.isoformat(),
            'preferred_date': assignment.preferred_date.isoformat() if assignment.preferred_date else None,
            'preferred_time': assignment.preferred_time,
            'date_of_completion': assignment.date_of_completion.isoformat() if assignment.date_of_completion else None,
            'service_status': assignment.service_status,
            'remarks': assignment.remarks,
            'location': assignment.location,
            'pin_code': assignment.pin_code,
            'review': review_data
        })

    return jsonify(result)

@app.route('/professionals/<int:professional_id>/available-requests', methods=['GET'])
def get_available_requests(professional_id):
    # Ensure professional exists
    professional = ServiceProfessional.query.get_or_404(professional_id)

    # Get all service requests that match the professional's service type and are in "REQUESTED" status
    available_requests = ServiceRequest.query.join(Service).filter(
        ServiceRequest.service_id == professional.service_id,
        ServiceRequest.service_status == 'REQUESTED',
        ServiceRequest.professional_id.is_(None)  # Not yet assigned to any professional
    ).all()

    result = []
    for request in available_requests:
        # Get customer info
        customer = Customer.query.get(request.customer_id)

        result.append({
            'id': request.id,
            'service_id': request.service_id,
            'service_name': Service.query.get(request.service_id).name,
            'customer_id': request.customer_id,
            'customer_name': customer.name,
            'date_of_request': request.date_of_request.isoformat(),
            'preferred_date': request.preferred_date.isoformat() if request.preferred_date else None,
            'preferred_time': request.preferred_time,
            'service_status': request.service_status,
            'remarks': request.remarks,
            'location': request.location,
            'pin_code': request.pin_code
        })

    return jsonify(result)

@app.route('/service-requests/<int:request_id>/accept', methods=['POST'])
def accept_service_request(request_id):
    # Get the service request
    service_request = ServiceRequest.query.get_or_404(request_id)

    # Check if the request is already assigned
    if service_request.service_status != 'REQUESTED':
        return jsonify({'error': 'This service request is no longer available'}), 400

    # Get professional ID from request body
    data = request.json
    professional_id = data.get('professional_id')

    # Validate professional
    professional = ServiceProfessional.query.get_or_404(professional_id)

    # Check if professional is verified
    if not professional.is_verified:
        return jsonify({'error': 'Your account must be verified to accept requests'}), 403

    # Check if professional provides the requested service
    if professional.service_id != service_request.service_id:
        return jsonify({'error': 'You can only accept requests that match your service category'}), 400

    # Update the service request
    service_request.professional_id = professional_id
    service_request.service_status = 'ASSIGNED'

    # Save to database
    try:
        db.session.commit()
        return jsonify({'message': 'Service request accepted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/service-requests/<int:request_id>/complete', methods=['PUT'])
def complete_service_request(request_id):
    # Get the service request
    service_request = ServiceRequest.query.get_or_404(request_id)

    # Check if the request is in assigned status
    if service_request.service_status != 'ASSIGNED':
        return jsonify({'error': 'Only assigned service requests can be marked as completed'}), 400

    # Update the service request
    service_request.service_status = 'CLOSED'
    service_request.date_of_completion = datetime.utcnow()

    # Save to database
    try:
        db.session.commit()
        return jsonify({'message': 'Service request marked as completed successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    if email == 'admin@abc.com' and password == 'admin':
        return jsonify({"userId": -1, "userRole": 'ADMIN'}), 200

    user = User.query.filter_by(email=email).first()

    if user and bcrypt.check_password_hash(user.password_hash, password) and user.is_active:
        return jsonify({"userId": user.id, "userRole": str(user.role.name)}), 200

    elif user and bcrypt.check_password_hash(user.password_hash, password) and not user.is_active:
        return jsonify({'error': 'Your account is blocked!'}), 401

    else:
        return jsonify({'error': 'Invalid email or password'}), 401

@app.route('/service-requests/<int:request_id>/review', methods=['POST'])
def add_review(request_id):
    # Get the service request
    service_request = ServiceRequest.query.get_or_404(request_id)

    # Check if the request is completed
    if service_request.service_status != 'CLOSED':
        return jsonify({'error': 'Only completed service requests can be reviewed'}), 400

    # Check if a review already exists
    if hasattr(service_request, 'review') and service_request.review:
        return jsonify({'error': 'A review already exists for this service request'}), 400

    data = request.json

    # Create new review
    review = Review(
        service_request_id=request_id,
        customer_id=service_request.customer_id,
        professional_id=service_request.professional_id,
        rating=data.get('rating'),
        review_text=data.get('review_text', '')
    )

    # Add to database
    db.session.add(review)

    # Update professional's average rating
    professional = ServiceProfessional.query.get(service_request.professional_id)
    reviews = Review.query.filter_by(professional_id=professional.id).all()
    total_rating = sum(r.rating for r in reviews) + data.get('rating')
    professional.rating = total_rating / (len(reviews) + 1)

    # Save to database
    try:
        db.session.commit()
        return jsonify({'message': 'Review added successfully'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500





















@app.route('/reviews', methods=['POST'])
def submit_review():
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ['service_request_id', 'professional_id', 'customer_id', 'rating', 'review_text']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        # Check if review already exists for this service request
        existing_review = Review.query.filter_by(service_request_id=data['service_request_id']).first()
        if existing_review:
            return jsonify({"error": "Review already submitted for this service request"}), 400

        # Create new review
        new_review = Review(
            service_request_id=data['service_request_id'],
            customer_id=data['customer_id'],
            professional_id=data['professional_id'],
            rating=data['rating'],
            review_text=data.get('review_text', '')
        )
        db.session.add(new_review)

        # Update the service request status
        service_request = ServiceRequest.query.get(data['service_request_id'])
        if not service_request:
            db.session.rollback()
            return jsonify({"error": "Service request not found"}), 404

        # Update professional's overall rating
        professional = ServiceProfessional.query.get(data['professional_id'])
        if professional:
            # Calculate new average rating
            reviews = Review.query.filter_by(professional_id=professional.id).all()
            total_reviews = len(reviews) + 1  # Including new review
            total_rating = sum(review.rating for review in reviews) + data['rating']
            professional.rating = total_rating / total_reviews

        db.session.commit()
        return jsonify({"message": "Review submitted successfully"}), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error submitting review: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/service-requests/<int:request_id>/review', methods=['GET'])
def get_review_for_request(request_id):
    try:
        review = Review.query.filter_by(service_request_id=request_id).first()
        if not review:
            return jsonify({"has_review": False}), 200

        return jsonify({
            "has_review": True,
            "rating": review.rating,
            "review_text": review.review_text
        }), 200

    except Exception as e:
        print(f"Error fetching review: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

















@app.route('/professionals/<int:professional_id>/profile', methods=['GET'])
def get_professional_profile(professional_id):
    """
    Retrieve professional profile details
    """
    professional = ServiceProfessional.query.get_or_404(professional_id)

    # Count completed and ongoing services
    completed_services = ServiceRequest.query.filter_by(
        professional_id=professional_id,
        service_status='CLOSED'
    ).count()

    ongoing_services = ServiceRequest.query.filter(
        ServiceRequest.professional_id == professional_id,
        ServiceRequest.service_status.in_(['ASSIGNED', 'IN_PROGRESS'])
    ).count()

    # Fetch recent reviews
    reviews = Review.query.filter_by(professional_id=professional_id)\
        .order_by(Review.date_created.desc())\
        .limit(5)\
        .all()

    review_list = [{
        'id': review.id,
        'customer_name': review.customer.name,
        'rating': review.rating,
        'review_text': review.review_text,
        'date_created': review.date_created.isoformat(),
        'service_name': review.service_request.service.name
    } for review in reviews]

    return jsonify({
        'name': professional.name,
        'service_name': professional.service.name,
        'is_verified': professional.is_verified,
        'rating': professional.rating,
        'description': professional.description,
        'email': professional.user.email,
        'experience': professional.experience,
        'completed_services': completed_services,
        'ongoing_services': ongoing_services,
        'reviews': review_list
    })

@app.route('/professionals/<int:professional_id>/extended-statistics', methods=['GET'])
def get_professional_extended_statistics(professional_id):
    """
    Retrieve extended professional statistics
    """
    # Calculate requested services
    requested_services = ServiceRequest.query.filter_by(
        professional_id=professional_id,
        service_status='requested'
    ).count()

    # Calculate total earnings
    service_requests = ServiceRequest.query.filter_by(
        professional_id=professional_id,
        service_status='closed'
    ).all()

    total_earnings = sum(
        request.service.base_price for request in service_requests
    )

    # Pending earnings (services completed but not yet paid)
    pending_service_requests = ServiceRequest.query.filter_by(
        professional_id=professional_id,
        service_status='completed_unpaid'
    ).all()

    pending_earnings = sum(
        request.service.base_price for request in pending_service_requests
    )

    # Calculate average service price
    completed_services = len(service_requests)
    average_service_price = total_earnings / completed_services if completed_services > 0 else 0

    return jsonify({
        'requested_services': requested_services,
        'total_earnings': total_earnings,
        'pending_earnings': pending_earnings,
        'average_service_price': average_service_price
    })

@app.route('/professionals/<int:professional_id>/profile', methods=['PATCH'])
def update_professional_profile(professional_id):
    """
    Update professional profile details
    """
    professional = ServiceProfessional.query.get_or_404(professional_id)
    user = professional.user

    data = request.get_json()

    # Update description
    if 'description' in data:
        professional.description = data['description']

    # Update name and email
    if 'name' in data:
        professional.name = data['name']
        user.name = data['name']

    if 'email' in data:
        # Check if email is unique
        existing_user = User.query.filter(
            User.email == data['email'],
            User.id != professional_id
        ).first()

        if existing_user:
            return jsonify({"error": "Email already in use"}), 400

        user.email = data['email']

    try:
        db.session.commit()
        return jsonify({"message": "Profile updated successfully"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to update profile", "details": str(e)}), 500

@app.route('/professionals/upload-profile-picture', methods=['POST'])
def upload_profile_picture():
    """
    Upload professional profile picture
    """
    # Check if file is present in the request
    if 'profile_picture' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['profile_picture']

    # Check if filename is empty
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    # Generate a unique filename
    filename = f"{uuid.uuid4()}_{file.filename}"

    # Define upload directory
    upload_folder = 'uploads/profile_pictures'
    os.makedirs(upload_folder, exist_ok=True)

    # Save file
    file_path = os.path.join(upload_folder, filename)
    file.save(file_path)

    # You'll need to update the professional's profile picture URL in the database
    professional_id = request.form.get('professional_id')  # Assume this is passed
    professional = ServiceProfessional.query.get_or_404(professional_id)
    professional.profile_doc_url = f"/uploads/profile_pictures/{filename}"

    try:
        db.session.commit()
        return jsonify({
            "message": "Profile picture uploaded successfully",
            "profile_picture_url": professional.profile_doc_url
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to upload profile picture", "details": str(e)}), 500



if __name__ == '__main__':
    app.run(debug=True)
