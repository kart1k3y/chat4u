// static/js/auth.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const errorMsg = document.getElementById('error-msg');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = loginForm.username.value;
            const password = loginForm.password.value;
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            
            try {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Logging in...';
                errorMsg.textContent = '';

                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem('jwt', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    window.location.href = '/chat';
                } else {
                    errorMsg.textContent = data.error || 'Login failed';
                }
            } catch (err) {
                errorMsg.textContent = 'Network error. Please try again.';
                console.error('Login error:', err);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Login';
            }
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = signupForm.username.value;
            const password = signupForm.password.value;
            const confirmPassword = signupForm.confirm_password.value;
            const submitBtn = signupForm.querySelector('button[type="submit"]');

            if (password !== confirmPassword) {
                errorMsg.textContent = 'Passwords do not match';
                return;
            }

            try {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Creating account...';
                errorMsg.textContent = '';

                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (response.ok) {
                    // Registration successful, redirect to login
                    window.location.href = '/login?registered=true';
                } else {
                    errorMsg.textContent = data.error || 'Registration failed';
                }
            } catch (err) {
                errorMsg.textContent = 'Network error. Please try again.';
                console.error('Signup error:', err);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign Up';
            }
        });
    }
});
