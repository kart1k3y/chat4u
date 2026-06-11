from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Group, GroupMember, User

groups_bp = Blueprint('groups', __name__)


@groups_bp.route('/groups', methods=['POST'])
@jwt_required()
def create_group():
    data = request.get_json()

    if not data or not data.get('name'):
        return jsonify({"error": "Group name is required"}), 400

    current_user_id = get_jwt_identity()

    new_group = Group(name=data['name'], created_by=current_user_id)
    db.session.add(new_group)
    db.session.flush()  # To get the new_group.id

    # Add creator as a member
    member = GroupMember(group_id=new_group.id, user_id=current_user_id)
    db.session.add(member)
    db.session.commit()

    return jsonify({"message": "Group created successfully", "group": new_group.to_dict()}), 201


@groups_bp.route('/groups', methods=['GET'])
@jwt_required()
def get_my_groups():
    current_user_id = get_jwt_identity()

    memberships = GroupMember.query.filter_by(user_id=current_user_id).all()
    groups = [m.group.to_dict() for m in memberships if m.group]

    return jsonify(groups), 200


@groups_bp.route('/groups/<int:group_id>/members', methods=['POST'])
@jwt_required()
def add_member(group_id):
    data = request.get_json()

    if not data or not data.get('user_id'):
        return jsonify({"error": "User ID is required"}), 400

    group = Group.query.get(group_id)
    if not group:
        return jsonify({"error": "Group not found"}), 404

    user_to_add = User.query.get(data['user_id'])
    if not user_to_add:
        return jsonify({"error": "User not found"}), 404

    # Check if already a member
    existing_member = GroupMember.query.filter_by(group_id=group_id, user_id=user_to_add.id).first()
    if existing_member:
        return jsonify({"error": "User is already a member of this group"}), 400

    new_member = GroupMember(group_id=group_id, user_id=user_to_add.id)
    db.session.add(new_member)
    db.session.commit()

    return jsonify({"message": "User added to group successfully", "member": new_member.to_dict()}), 201


@groups_bp.route('/groups/<int:group_id>/members', methods=['GET'])
@jwt_required()
def get_group_members(group_id):
    group = Group.query.get(group_id)
    if not group:
        return jsonify({"error": "Group not found"}), 404

    members = GroupMember.query.filter_by(group_id=group_id).all()
    return jsonify([member.to_dict() for member in members]), 200
