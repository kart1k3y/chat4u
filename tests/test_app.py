import unittest
from app import app

class AppTestCase(unittest.TestCase):
    def setUp(self):
        # Configure app for testing
        app.config['TESTING'] = True
        self.ctx = app.app_context()
        self.ctx.push()
        self.client = app.test_client()

    def tearDown(self):
        self.ctx.pop()

    def test_home_page(self):
        """Test that the homepage loads successfully."""
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)

    def test_chat_empty_message(self):
        """Test the chat API response with an empty message."""
        response = self.client.post('/api/chat', json={})
        self.assertEqual(response.status_code, 200)
        self.assertIn('response', response.get_json())
        self.assertEqual(response.get_json()['response'], 'Hello! How can I assist you today?')

    def test_chat_greeting(self):
        """Test the chat API response to greeting messages."""
        for greet in ['hello', 'hi', 'hey']:
            response = self.client.post('/api/chat', json={'message': greet})
            self.assertEqual(response.status_code, 200)
            self.assertIn("Hello! I am Chat4U", response.get_json()['response'])

    def test_chat_docker_topic(self):
        """Test the chat API response to docker topics."""
        response = self.client.post('/api/chat', json={'message': 'Tell me about docker'})
        self.assertEqual(response.status_code, 200)
        self.assertIn("We can containerize this Flask application", response.get_json()['response'])

    def test_chat_help_topic(self):
        """Test the chat API response to help topic."""
        response = self.client.post('/api/chat', json={'message': 'help'})
        self.assertEqual(response.status_code, 200)
        self.assertIn("I can discuss GitHub Actions", response.get_json()['response'])

if __name__ == '__main__':
    unittest.main()
