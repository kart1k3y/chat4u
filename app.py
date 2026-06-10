from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json or {}
    message = data.get('message', '')
    
    if not message:
        return jsonify({'response': 'Hello! How can I assist you today?'})
        
    message_lower = message.lower()
    if any(greet in message_lower for greet in ['hello', 'hi', 'hey']):
        response = "Hello! I am Chat4U, your template assistant. I'm here to help you test this deployment template."
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
