import os
from flask import Flask, render_template, request, jsonify
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from config import Config
from models import db
from routes.auth import auth_bp

app = Flask(__name__)
app.config.from_object(Config)

# Initialize extensions
db.init_app(app)
jwt = JWTManager(app)
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

# Register Blueprints
app.register_blueprint(auth_bp)

@app.context_processor
def inject_app_name():
    return dict(app_name=os.getenv('APP_NAME', 'Chat4U'))

with app.app_context():
    db.create_all()
    
    # Create test admin user
    from models import User
    from werkzeug.security import generate_password_hash
    if not User.query.filter_by(username='admin').first():
        admin_user = User(
            full_name='Admin User',
            username='admin',
            email='admin@example.com',
            password_hash=generate_password_hash('admin'),
            is_verified=True,
            role='admin'
        )
        db.session.add(admin_user)
        db.session.commit()
        print("Created test user: admin / admin")

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
@limiter.limit("20 per minute")
@jwt_required(optional=True) # Optional for now so unauthenticated users can still test it, or we can make it mandatory
def chat():
    data = request.json or {}
    message = data.get('message', '')
    
    # Check if user is logged in
    current_user_id = get_jwt_identity()
    user_context = "Guest"
    if current_user_id:
        from models import User
        user = User.query.get(current_user_id)
        if user:
            user_context = user.full_name
    
    if not message:
        return jsonify({'response': f'Hello {user_context}! How can I assist you today?'})
        
    message_lower = message.lower()
    if any(greet in message_lower for greet in ['hello', 'hi', 'hey']):
        response = f"Hello {user_context}! I am Chat4U, your template assistant."
    elif 'pipeline' in message_lower or 'github' in message_lower or 'actions' in message_lower:
        response = "This app is ready to be run in a GitHub Actions pipeline! It's a great setup for automated Docker builds and Semantic Versioning."
    elif 'docker' in message_lower:
        response = "We can containerize this Flask application easily with a Dockerfile, run it locally, or deploy it to any cloud provider."
    elif 'help' in message_lower:
        response = "I can discuss GitHub Actions, Docker, Semantic Versioning, or just echo your messages back to you!"
    else:
        response = f"I received your message: '{message}'. This template is fully interactive!"
        
    return jsonify({'response': response})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
