// Authentication Module
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.onAuthStateChangedCallbacks = [];
        this.mockUsers = []; // For demo mode
        this.initAuthListener();
    }

    // Initialize authentication state listener
    initAuthListener() {
        if (window.isDemo) {
            // Demo mode - check for stored user
            const storedUser = localStorage.getItem('demoUser');
            if (storedUser) {
                this.currentUser = JSON.parse(storedUser);
            }
            // Always trigger the callback after a short delay to ensure UI is ready
            setTimeout(() => {
                this.onAuthStateChangedCallbacks.forEach(callback => callback(this.currentUser));
            }, 100);
        } else {
            window.auth.onAuthStateChanged((user) => {
                this.currentUser = user;
                this.onAuthStateChangedCallbacks.forEach(callback => callback(user));
            });
        }
    }

    // Register callback for auth state changes
    onAuthStateChanged(callback) {
        this.onAuthStateChangedCallbacks.push(callback);
    }

    // Sign up new user
    async signUp(email, password, fullName, phone) {
        try {
            if (window.isDemo) {
                // Demo mode - simulate user creation
                const user = {
                    uid: 'demo-' + Date.now(),
                    email: email,
                    displayName: fullName,
                    emailVerified: true // Skip verification in demo
                };

                // Store in mock database
                const userData = {
                    uid: user.uid,
                    email: email,
                    displayName: fullName,
                    phoneNumber: phone,
                    balance: 100.00,
                    createdAt: new Date(),
                    emailVerified: true,
                    avatar: this.generateAvatar(fullName)
                };

                localStorage.setItem('demoUser', JSON.stringify(user));
                localStorage.setItem('demoUserData', JSON.stringify(userData));
                this.mockUsers.push(userData);

                this.currentUser = user;
                this.onAuthStateChangedCallbacks.forEach(callback => callback(user));

                this.showNotification('Account created successfully!', 'success');
                return { success: true, user };
            } else {
                // Real Firebase implementation would go here
                throw new Error('Firebase not configured for production use');
            }

        } catch (error) {
            console.error('Sign up error:', error);
            this.showNotification(this.getErrorMessage(error.code || error.message), 'error');
            return { success: false, error: error.code || error.message };
        }
    }

    // Sign in existing user
    async signIn(email, password) {
        try {
            if (window.isDemo) {
                // Demo mode - check for existing user or create one
                let userData = JSON.parse(localStorage.getItem('demoUserData') || 'null');
                
                if (!userData || userData.email !== email) {
                    // Create demo user if not exists
                    userData = {
                        uid: 'demo-' + Date.now(),
                        email: email,
                        displayName: email.split('@')[0],
                        phoneNumber: '+1234567890',
                        balance: 250.50,
                        createdAt: new Date(),
                        emailVerified: true,
                        avatar: this.generateAvatar(email.split('@')[0])
                    };
                    localStorage.setItem('demoUserData', JSON.stringify(userData));
                }

                const user = {
                    uid: userData.uid,
                    email: userData.email,
                    displayName: userData.displayName,
                    emailVerified: true
                };

                localStorage.setItem('demoUser', JSON.stringify(user));
                this.currentUser = user;
                this.onAuthStateChangedCallbacks.forEach(callback => callback(user));

                this.showNotification('Welcome back!', 'success');
                return { success: true, user };
            } else {
                // Real Firebase implementation would go here
                throw new Error('Firebase not configured for production use');
            }

        } catch (error) {
            console.error('Sign in error:', error);
            this.showNotification(this.getErrorMessage(error.code || error.message), 'error');
            return { success: false, error: error.code || error.message };
        }
    }

    // Sign out user
    async signOut() {
        try {
            if (window.isDemo) {
                localStorage.removeItem('demoUser');
                this.currentUser = null;
                this.onAuthStateChangedCallbacks.forEach(callback => callback(null));
            } else {
                await window.auth.signOut();
            }

            this.showNotification('Signed out successfully', 'success');
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            this.showNotification('Error signing out', 'error');
            return { success: false, error: error.code || error.message };
        }
    }

    // Send password reset email
    async resetPassword(email) {
        try {
            if (window.isDemo) {
                this.showNotification('Password reset email sent! (Demo mode)', 'success');
                return { success: true };
            } else {
                await window.auth.sendPasswordResetEmail(email);
                this.showNotification('Password reset email sent! Check your inbox.', 'success');
                return { success: true };
            }
        } catch (error) {
            console.error('Password reset error:', error);
            this.showNotification(this.getErrorMessage(error.code || error.message), 'error');
            return { success: false, error: error.code || error.message };
        }
    }

    // Get current user data
    async getCurrentUserData() {
        if (!this.currentUser) return null;

        try {
            if (window.isDemo) {
                return JSON.parse(localStorage.getItem('demoUserData') || 'null');
            } else {
                // Real Firestore implementation would go here
                return null;
            }
        } catch (error) {
            console.error('Error getting user data:', error);
            return null;
        }
    }

    // Generate avatar initials
    generateAvatar(fullName) {
        const names = fullName.split(' ');
        const initials = names.map(name => name[0]).join('').substring(0, 2).toUpperCase();
        return initials;
    }

    // Get user-friendly error messages
    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
            'auth/weak-password': 'Password should be at least 6 characters long.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/user-not-found': 'No account found with this email address.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
            'auth/network-request-failed': 'Network error. Please check your connection.',
            'auth/user-disabled': 'This account has been disabled.',
            'auth/operation-not-allowed': 'This operation is not allowed.',
            'email-not-verified': 'Please verify your email address before signing in.',
            'Firebase not configured for production use': 'This is a demo. Please configure Firebase for production use.'
        };

        return errorMessages[errorCode] || errorCode || 'An unexpected error occurred. Please try again.';
    }

    // Show notification
    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="border: none; background: none; cursor: pointer; font-size: 18px;">&times;</button>
            </div>
        `;

        container.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Create global auth manager instance
window.authManager = new AuthManager();