from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timezone

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    def set_password(self, password):
        # Uses werkzeug's generate_password_hash for secure hashing
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username
        }

class Message(db.Model):
    __tablename__ = 'messages'

    id = db.Column(db.Integer, primary_key=True)
    room = db.Column(db.String(100), nullable=False, index=True)
    content = db.Column(db.Text, nullable=False)
    msg_type = db.Column(db.String(20), nullable=False, default='text') # text, image, voice
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationship to user for easy access
    sender = db.relationship('User', backref=db.backref('messages', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'room': self.room,
            'content': self.content,
            'msg_type': self.msg_type,
            'sender_id': self.sender_id,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }

class Group(db.Model):
    __tablename__ = 'groups'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Relationship
    creator = db.relationship('User', backref=db.backref('created_groups', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'created_by': self.created_by
        }

class GroupMember(db.Model):
    __tablename__ = 'group_members'

    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('groups.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Unique constraint so a user isn't added multiple times to the same group
    __table_args__ = (
        db.UniqueConstraint('group_id', 'user_id', name='unique_group_member'),
    )

    group = db.relationship('Group', backref=db.backref('members', lazy=True, cascade='all, delete-orphan'))
    user = db.relationship('User', backref=db.backref('group_memberships', lazy=True, cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id': self.id,
            'group_id': self.group_id,
            'user_id': self.user_id,
            'username': self.user.username if self.user else None
        }
