// API Base URL
const API_URL = 'http://localhost:5000/api';

// Check if user is logged in
function isLoggedIn() {
    return !!localStorage.getItem('token');
}

// Get current user
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('user') || '{}');
}

// Register user
async function register(userData) {
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
        }

        // Store token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.data));

        // Update UI
        updateAuthUI();
        
        return data;
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
}

// Login user
async function login(credentials) {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        // Store token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.data));

        // Update UI
        updateAuthUI();
        
        return data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
}

// Logout user
async function logout() {
    try {
        const response = await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Logout failed');
        }

        // Clear local storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Update UI
        updateAuthUI();
        
        // Redirect to home page
        window.location.href = '/';
    } catch (error) {
        console.error('Logout error:', error);
        throw error;
    }
}

// Update user details
async function updateUserDetails(userData) {
    try {
        const response = await fetch(`${API_URL}/auth/updatedetails`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to update user details');
        }

        // Update stored user data
        localStorage.setItem('user', JSON.stringify(data.data));

        // Update UI
        updateAuthUI();
        
        return data;
    } catch (error) {
        console.error('Update user details error:', error);
        throw error;
    }
}

// Update password
async function updatePassword(passwordData) {
    try {
        const response = await fetch(`${API_URL}/auth/updatepassword`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(passwordData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to update password');
        }

        // Update stored token
        localStorage.setItem('token', data.token);
        
        return data;
    } catch (error) {
        console.error('Update password error:', error);
        throw error;
    }
}

// Update UI based on auth state
function updateAuthUI() {
    const isAuthenticated = isLoggedIn();
    const user = getCurrentUser();
    const loginBtn = document.getElementById('loginBtn');
    const userMenuBtn = document.createElement('div');

    if (isAuthenticated) {
        // Replace login button with user menu
        userMenuBtn.className = 'relative';
        userMenuBtn.innerHTML = `
            <button class="flex items-center space-x-2 text-white focus:outline-none">
                <span>${user.username}</span>
                <i class="fas fa-chevron-down"></i>
            </button>
            <div class="hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2">
                <a href="/profile" class="block px-4 py-2 text-gray-800 hover:bg-gray-100">
                    <i class="fas fa-user mr-2"></i>Profile
                </a>
                ${user.role === 'Admin' ? `
                    <a href="/admin" class="block px-4 py-2 text-gray-800 hover:bg-gray-100">
                        <i class="fas fa-cog mr-2"></i>Admin Panel
                    </a>
                ` : ''}
                <button onclick="logout()" class="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100">
                    <i class="fas fa-sign-out-alt mr-2"></i>Logout
                </button>
            </div>
        `;

        // Toggle user menu on click
        userMenuBtn.querySelector('button').addEventListener('click', () => {
            userMenuBtn.querySelector('div').classList.toggle('hidden');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!userMenuBtn.contains(e.target)) {
                userMenuBtn.querySelector('div').classList.add('hidden');
            }
        });

        loginBtn.parentNode.replaceChild(userMenuBtn, loginBtn);
    } else {
        // Show login button
        if (!loginBtn) {
            const nav = document.querySelector('nav .md\\:flex');
            const newLoginBtn = document.createElement('button');
            newLoginBtn.id = 'loginBtn';
            newLoginBtn.className = 'bg-accent hover:bg-blue-600 px-4 py-2 rounded-lg transition';
            newLoginBtn.textContent = 'Login';
            nav.appendChild(newLoginBtn);
        }
    }

    // Update role-specific UI elements
    document.querySelectorAll('[data-role]').forEach(element => {
        if (isAuthenticated && element.dataset.role.includes(user.role)) {
            element.classList.remove('hidden');
        } else {
            element.classList.add('hidden');
        }
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Update UI on page load
    updateAuthUI();

    // Login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const errorDiv = document.getElementById('loginError');
            
            try {
                await login({
                    email: e.target.email.value,
                    password: e.target.password.value
                });

                // Close login modal
                document.getElementById('loginModal').classList.add('hidden');
                
                // Show success message
                showAlert('Logged in successfully', 'success');
            } catch (error) {
                errorDiv.textContent = error.message;
                errorDiv.classList.remove('hidden');
            }
        });
    }

    // Register form submission
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const errorDiv = document.getElementById('registerError');
            
            try {
                await register({
                    username: e.target.username.value,
                    email: e.target.email.value,
                    password: e.target.password.value,
                    role: e.target.role.value
                });

                // Redirect to home page
                window.location.href = '/';
                
                // Show success message
                showAlert('Registration successful', 'success');
            } catch (error) {
                errorDiv.textContent = error.message;
                errorDiv.classList.remove('hidden');
            }
        });
    }

    // Update profile form submission
    const updateProfileForm = document.getElementById('updateProfileForm');
    if (updateProfileForm) {
        updateProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const errorDiv = document.getElementById('updateProfileError');
            
            try {
                await updateUserDetails({
                    username: e.target.username.value,
                    email: e.target.email.value
                });
                
                // Show success message
                showAlert('Profile updated successfully', 'success');
            } catch (error) {
                errorDiv.textContent = error.message;
                errorDiv.classList.remove('hidden');
            }
        });
    }

    // Update password form submission
    const updatePasswordForm = document.getElementById('updatePasswordForm');
    if (updatePasswordForm) {
        updatePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const errorDiv = document.getElementById('updatePasswordError');
            
            try {
                await updatePassword({
                    currentPassword: e.target.currentPassword.value,
                    newPassword: e.target.newPassword.value
                });
                
                // Clear form
                e.target.reset();
                
                // Show success message
                showAlert('Password updated successfully', 'success');
            } catch (error) {
                errorDiv.textContent = error.message;
                errorDiv.classList.remove('hidden');
            }
        });
    }
});

// Show alert message
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `fixed top-4 right-4 px-6 py-3 rounded-lg ${
        type === 'error' ? 'bg-red-500' : 'bg-green-500'
    } text-white`;
    alertDiv.textContent = message;

    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}