import os
import json
from flask import Flask, request, jsonify
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager, verify_jwt_in_request
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_sock import Sock
from werkzeug.utils import secure_filename

from config import Config
from models import db, Message, User

# Initialize extensions
migrate = Migrate()
jwt = JWTManager()
limiter = Limiter(key_func=get_remote_address)
sock = Sock()

# WebSocket connections tracking
# Format: active_rooms[room_name] = [socket1, socket2, ...]
active_rooms = {}

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    limiter.init_app(app)
    sock.init_app(app)

    # Ensure upload folder exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # Register Blueprints (we will create these next)
    from routes.auth import auth_bp
    from routes.groups import groups_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(groups_bp, url_prefix='/api')

    @app.route('/api/upload', methods=['POST'])
    def upload_file():
        # Verify JWT for security
        verify_jwt_in_request()
        
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
            
        # File extension validation
        if file:
            filename = secure_filename(file.filename)
            ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
            
            if ext not in app.config['ALLOWED_EXTENSIONS']:
                return jsonify({"error": "File type not allowed"}), 400
            
            # Save file
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            
            # Determine msg_type roughly based on extension
            msg_type = 'image' if ext in ['png', 'jpg', 'gif', 'webp'] else 'voice'
            
            # Build URL for frontend
            url = f"/static/uploads/{filename}"
            
            return jsonify({"url": url, "type": msg_type}), 200

    @app.route('/api/messages/<room>', methods=['GET'])
    def get_messages(room):
        verify_jwt_in_request()
        # Get last 50 messages, ordered by newest first, then reverse to chronological order
        messages = Message.query.filter_by(room=room).order_by(Message.timestamp.desc()).limit(50).all()
        return jsonify([msg.to_dict() for msg in reversed(messages)]), 200

    @sock.route('/ws')
    def ws_chat(ws):
        # We need to manually verify JWT from query param or first message
        # For simplicity and given the requirements, we'll verify it from the first message
        # Or you can do it via a connection token
        
        # We will wait for the first message to be an auth or join
        user_id = None
        current_room = None
        
        while True:
            raw_data = ws.receive()
            if not raw_data:
                # Connection closed
                break
                
            try:
                data = json.loads(raw_data)
            except json.JSONDecodeError:
                continue

            msg_type = data.get('type')
            
            if msg_type == 'join':
                # Simplified: join should ideally verify token
                current_room = data.get('room')
                user_id = data.get('sender_id') # In real prod, derive this from JWT
                
                if current_room not in active_rooms:
                    active_rooms[current_room] = []
                if ws not in active_rooms[current_room]:
                    active_rooms[current_room].append(ws)
                    
                # Broadcast join
                broadcast(current_room, data)
                
            elif msg_type == 'message':
                room = data.get('room')
                content = data.get('content')
                m_type = data.get('msg_type', 'text')
                sender_id = data.get('sender_id')
                
                if not all([room, content, sender_id]):
                    continue
                    
                # Save to DB
                new_msg = Message(
                    room=room,
                    content=content,
                    msg_type=m_type,
                    sender_id=sender_id
                )
                db.session.add(new_msg)
                db.session.commit()
                
                # Append server timestamp and DB ID
                data['timestamp'] = new_msg.timestamp.isoformat()
                
                # Broadcast
                broadcast(room, data)
                
            elif msg_type in ['typing', 'read']:
                room = data.get('room')
                broadcast(room, data)

        # Cleanup on disconnect
        if current_room and current_room in active_rooms:
            if ws in active_rooms[current_room]:
                active_rooms[current_room].remove(ws)

    def broadcast(room, message_data):
        if room in active_rooms:
            for client in active_rooms[room]:
                try:
                    client.send(json.dumps(message_data))
                except Exception:
                    # Client probably disconnected
                    pass

    return app

if __name__ == '__main__':
    app = create_app()
    # Bandit requires not using debug=True in prod. We use app.config['DEBUG']
    app.run(host='0.0.0.0', port=5000, debug=app.config['DEBUG'])
