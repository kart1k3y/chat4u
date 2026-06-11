FROM python:3.11-slim

WORKDIR /app

# Set environment variables to prevent Python from writing .pyc files
# and to ensure stdout/stderr are flushed immediately
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install system dependencies (needed for psycopg2)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

# Use Gunicorn with threads to handle WebSockets via flask-sock
# Avoid debug=True as per Bandit requirements
CMD ["gunicorn", "--worker-class", "gthread", "--threads", "50", "--bind", "0.0.0.0:5000", "app:create_app()"]
