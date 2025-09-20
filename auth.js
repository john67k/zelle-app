// Authentication Module
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.supabase = window.DEMO_MODE ? window.supabaseDemo : supabase;
    }

    async init() {
        // Check if user is already authenticated
        const { data, error } = await this.supabase.auth.getUser();
        
        if (data?.user && !error) {
            this.currentUser = data.user;
            this.isAuthenticated = true;
            return true;
        }
        
        return false;
    }

    async signUp(email, password, userData = {}) {
        try {
            const { data, error } = await this.supabase.auth.signUp({
                email,
                password,
                options: {
                    data: userData
                }
            });

            if (error) {
                throw error;
            }

            // Send verification email
            if (APP_CONFIG.emailVerificationRequired) {
                await window.emailUtils.sendVerificationEmail(email);
                this.showToast('Please check your email to verify your account', 'warning');
            }

            this.showToast('Account created successfully!', 'success');
            return { success: true, user: data.user };

        } catch (error) {
            console.error('Sign up error:', error);
            this.showToast(error.message || 'Failed to create account', 'error');
            return { success: false, error: error.message };
        }
    }

    async signIn(email, password) {
        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                throw error;
            }

            this.currentUser = data.user;
            this.isAuthenticated = true;

            this.showToast('Welcome back!', 'success');
            return { success: true, user: data.user };

        } catch (error) {
            console.error('Sign in error:', error);
            this.showToast(error.message || 'Failed to sign in', 'error');
            return { success: false, error: error.message };
        }
    }

    async signOut() {
        try {
            const { error } = await this.supabase.auth.signOut();
            
            if (error) {
                throw error;
            }

            this.currentUser = null;
            this.isAuthenticated = false;
            
            // Clear any cached data
            if (window.DEMO_MODE) {
                // Keep demo data but reset authentication state
            }

            this.showToast('Signed out successfully', 'success');
            window.location.reload();

        } catch (error) {
            console.error('Sign out error:', error);
            this.showToast('Failed to sign out', 'error');
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        const container = document.getElementById('toast-container');
        container.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        }, 5000);
    }

    getCurrentUser() {
        return this.currentUser;
    }

    isLoggedIn() {
        return this.isAuthenticated;
    }
}

// Initialize authentication
const authManager = new AuthManager();

// Authentication form handlers
document.addEventListener('DOMContentLoaded', function() {
    const authModal = document.getElementById('auth-modal');
    const signinForm = document.getElementById('signin-form');
    const signupForm = document.getElementById('signup-form');
    const showSignup = document.getElementById('show-signup');
    const showSignin = document.getElementById('show-signin');
    const signinFormElement = document.getElementById('signin-form-element');
    const signupFormElement = document.getElementById('signup-form-element');

    // Toggle between sign in and sign up forms
    showSignup.addEventListener('click', (e) => {
        e.preventDefault();
        signinForm.style.display = 'none';
        signupForm.style.display = 'block';
        document.getElementById('auth-title').textContent = 'Create Account';
        document.getElementById('auth-subtitle').textContent = 'Join ZellePay today';
    });

    showSignin.addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.style.display = 'none';
        signinForm.style.display = 'block';
        document.getElementById('auth-title').textContent = 'Welcome Back';
        document.getElementById('auth-subtitle').textContent = 'Sign in to your account';
    });

    // Handle sign in form submission
    signinFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('signin-email').value;
        const password = document.getElementById('signin-password').value;

        const result = await authManager.signIn(email, password);
        
        if (result.success) {
            authModal.style.display = 'none';
            showApp();
        }
    });

    // Handle sign up form submission
    signupFormElement.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const phone = document.getElementById('signup-phone').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;

        // Validation
        if (password !== confirmPassword) {
            authManager.showToast('Passwords do not match', 'error');
            return;
        }

        if (password.length < 6) {
            authManager.showToast('Password must be at least 6 characters', 'error');
            return;
        }

        const result = await authManager.signUp(email, password, {
            name,
            phone
        });
        
        if (result.success) {
            // For demo purposes, automatically sign in after signup
            setTimeout(async () => {
                const signInResult = await authManager.signIn(email, password);
                if (signInResult.success) {
                    authModal.style.display = 'none';
                    showApp();
                }
            }, 1000);
        }
    });

    // Add labels to input groups that have them
    const inputs = document.querySelectorAll('.input-group input');
    inputs.forEach(input => {
        const group = input.parentElement;
        if (group.querySelector('label')) {
            group.classList.add('has-label');
        }
    });
});

// Show the main app interface
function showApp() {
    document.getElementById('app').style.display = 'block';
    loadUserData();
    loadTransactions();
    
    // Initialize real-time updates
    if (window.realtimeManager) {
        window.realtimeManager.init();
    }
}

// Load user data and update UI
async function loadUserData() {
    try {
        if (window.DEMO_MODE) {
            const userData = JSON.parse(localStorage.getItem('demo_user'));
            if (userData) {
                updateBalanceDisplay(userData.balance);
                authManager.currentUser = userData;
            }
        } else {
            // Load from Supabase
            const user = authManager.getCurrentUser();
            if (user) {
                // Fetch user profile data
                // updateBalanceDisplay(user.balance);
            }
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        authManager.showToast('Failed to load user data', 'error');
    }
}

// Update balance display
function updateBalanceDisplay(balance) {
    const balanceDisplay = document.getElementById('balance-display');
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: APP_CONFIG.currency
    });
    
    balanceDisplay.textContent = formatter.format(balance);
}

// Toggle balance visibility
document.addEventListener('DOMContentLoaded', function() {
    const toggleBtn = document.getElementById('toggle-balance');
    const balanceDisplay = document.getElementById('balance-display');
    let balanceVisible = true;
    let originalBalance = balanceDisplay.textContent;

    toggleBtn.addEventListener('click', () => {
        if (balanceVisible) {
            originalBalance = balanceDisplay.textContent;
            balanceDisplay.textContent = '••••••';
            toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i>';
        } else {
            balanceDisplay.textContent = originalBalance;
            toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
        }
        balanceVisible = !balanceVisible;
    });
});

// Export auth manager for use in other modules
window.authManager = authManager;