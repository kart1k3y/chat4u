from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({"error": "Missing username or password"}), 400
        
    username = data['username']
    password = data['password']
    
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already exists"}), 400
        
    new_user = User(username=username)
    new_user.set_password(password) # Hashes securely
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({"message": "User registered successfully", "user": new_user.to_dict()}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({"error": "Missing username or password"}), 400
        
    user = User.query.filter_by(username=data['username']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({"error": "Invalid username or password"}), 401
        
    access_token = create_access_token(identity=user.id)
    return jsonify({"token": access_token, "user": user.to_dict()}), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    return jsonify(user.to_dict()), 200

@auth_bp.route('/users', methods=['GET'])
@jwt_required()
def get_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users]), 200
