import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Ensure DEBUG is False by default for Bandit/DevSecOps requirements
    DEBUG = os.environ.get('FLASK_ENV') == 'development'
    
    # Database
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///chat4u.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'default-dev-secret-key')
    
    # File Uploads
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', 'static/uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload size
    
    # Allowed extensions to satisfy DevSecOps
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'gif', 'webp', 'mp3', 'ogg', 'webm'}
