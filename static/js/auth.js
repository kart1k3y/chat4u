// Auth Javascript Utilities

function togglePassword(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.innerHTML = '🙈'; 
    } else {
        input.type = 'password';
        icon.innerHTML = '👁️';
    }
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${message}</span>
        <button style="background:none; border:none; color:white; cursor:pointer;" onclick="this.parentElement.remove()">✕</button>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

function checkPasswordStrength(password) {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength += 25;
    if (password.match(/\d/)) strength += 25;
    if (password.match(/[^a-zA-Z\d]/)) strength += 25;
    
    const bar = document.getElementById('strength-bar');
    const text = document.getElementById('strength-text');
    
    if (!bar) return;
    
    bar.style.width = strength + '%';
    
    if (strength <= 25) {
        bar.style.backgroundColor = '#ef4444';
        text.textContent = 'Weak';
        text.style.color = '#ef4444';
    } else if (strength <= 50) {
        bar.style.backgroundColor = '#f59e0b';
        text.textContent = 'Fair';
        text.style.color = '#f59e0b';
    } else if (strength <= 75) {
        bar.style.backgroundColor = '#3b82f6';
        text.textContent = 'Good';
        text.style.color = '#3b82f6';
    } else {
        bar.style.backgroundColor = '#10b981';
        text.textContent = 'Strong';
        text.style.color = '#10b981';
    }
    
    return strength;
}

// Attach listener to registration form password input if it exists
document.addEventListener('DOMContentLoaded', () => {
    const regPassword = document.getElementById('reg-password');
    if (regPassword) {
        regPassword.addEventListener('input', (e) => checkPasswordStrength(e.target.value));
    }
});
