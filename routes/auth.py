from flask import Blueprint, request, jsonify, render_template
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from datetime import datetime, timedelta
import re
import secrets
from models import db, User, UserSession, PasswordReset

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

def validate_password(password):
    if len(password) < 8: return False
    if not re.search(r"[a-z]", password): return False
    if not re.search(r"[A-Z]", password): return False
    if not re.search(r"[0-9]", password): return False
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password): return False
    return True

@auth_bp.route('/login', methods=['GET'])
def login_page():
    return render_template('auth/login.html')

@auth_bp.route('/register', methods=['GET'])
def register_page():
    return render_template('auth/register.html')

@auth_bp.route('/forgot-password', methods=['GET'])
def forgot_password_page():
    return render_template('auth/forgot_password.html')

@auth_bp.route('/api/register', methods=['POST'])
def api_register():
    data = request.json
    full_name = data.get('full_name')
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    
    if not all([full_name, username, email, password]):
        return jsonify({"message": "All fields are required"}), 400
        
    if not validate_password(password):
        return jsonify({"message": "Password does not meet complexity requirements"}), 400
        
    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email already registered"}), 400
        
    if User.query.filter_by(username=username).first():
        return jsonify({"message": "Username already taken"}), 400
        
    password_hash = generate_password_hash(password)
    
    new_user = User(
        full_name=full_name,
        username=username,
        email=email,
        password_hash=password_hash
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({"message": "Registration successful"}), 201

@auth_bp.route('/api/login', methods=['POST'])
def api_login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"message": "Invalid email or password"}), 401
        
    user.last_login = datetime.utcnow()
    
    access_token = create_access_token(identity=str(user.id))
    
    # Record session
    ip_address = request.remote_addr
    session_record = UserSession(
        user_id=user.id,
        session_token=access_token,
        ip_address=ip_address
    )
    db.session.add(session_record)
    db.session.commit()
    
    return jsonify({
        "message": "Login successful", 
        "token": access_token,
        "user": {
            "username": user.username,
            "full_name": user.full_name,
            "profile_image": user.profile_image,
            "last_login": user.last_login.isoformat()
        }
    }), 200

@auth_bp.route('/api/forgot-password', methods=['POST'])
def api_forgot_password():
    data = request.json
    email = data.get('email')
    
    user = User.query.filter_by(email=email).first()
    if user:
        reset_token = secrets.token_urlsafe(32)
        expires = datetime.utcnow() + timedelta(hours=1)
        
        pr = PasswordReset(user_id=user.id, reset_token=reset_token, expires_at=expires)
        db.session.add(pr)
        db.session.commit()
        # Mocking email sending
        print(f"MOCK EMAIL: Sent password reset token {reset_token} to {email}")
        
    # Always return success to prevent email enumeration
    return jsonify({"message": "If your email is registered, a reset link has been sent."}), 200

@auth_bp.route('/api/user', methods=['GET'])
@jwt_required()
def get_user():
    current_user_id = str(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
        
    return jsonify({
        "username": user.username,
        "full_name": user.full_name,
        "profile_image": user.profile_image,
        "last_login": user.last_login.isoformat() if user.last_login else None
    }), 200
