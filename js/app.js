// Main Application Controller
class ZelleApp {
    constructor() {
        this.currentUser = null;
        this.currentUserData = null;
        this.initApp();
    }

    // Initialize the application
    async initApp() {
        // Show loading screen
        this.showLoading();

        // Initialize managers
        this.authManager = window.authManager;
        this.paymentManager = window.paymentManager;
        this.qrManager = window.qrManager;

        // Set up authentication state listener
        this.authManager.onAuthStateChanged((user) => {
            this.handleAuthStateChange(user);
        });

        // Initialize UI event listeners
        this.initEventListeners();

        // Initialize QR functionality
        this.qrManager.init();

        // Hide loading screen after a short delay
        setTimeout(() => {
            this.hideLoading();
        }, 1000);
    }

    // Handle authentication state changes
    async handleAuthStateChange(user) {
        this.currentUser = user;

        if (user && user.emailVerified) {
            // User is authenticated and verified
            this.currentUserData = await this.authManager.getCurrentUserData();
            this.paymentManager.setCurrentUser(user);
            this.showDashboard();
            this.updateUserInterface();
            this.setupRealTimeUpdates();
        } else {
            // User is not authenticated or not verified
            this.paymentManager.setCurrentUser(null);
            this.showAuth();
        }
    }

    // Show loading screen
    showLoading() {
        const loading = document.getElementById('loading-screen');
        const auth = document.getElementById('auth-container');
        const dashboard = document.getElementById('dashboard');

        if (loading) loading.classList.remove('hidden');
        if (auth) auth.classList.add('hidden');
        if (dashboard) dashboard.classList.add('hidden');
    }

    // Hide loading screen
    hideLoading() {
        const loading = document.getElementById('loading-screen');
        if (loading) loading.classList.add('hidden');
    }

    // Show authentication interface
    showAuth() {
        const loading = document.getElementById('loading-screen');
        const auth = document.getElementById('auth-container');
        const dashboard = document.getElementById('dashboard');

        if (loading) loading.classList.add('hidden');
        if (auth) auth.classList.remove('hidden');
        if (dashboard) dashboard.classList.add('hidden');
    }

    // Show dashboard
    showDashboard() {
        const loading = document.getElementById('loading-screen');
        const auth = document.getElementById('auth-container');
        const dashboard = document.getElementById('dashboard');

        if (loading) loading.classList.add('hidden');
        if (auth) auth.classList.add('hidden');
        if (dashboard) dashboard.classList.remove('hidden');
    }

    // Update user interface with current user data
    async updateUserInterface() {
        if (!this.currentUserData) return;

        // Update user name
        const userNameElements = document.querySelectorAll('#user-name');
        userNameElements.forEach(el => {
            el.textContent = this.currentUserData.displayName || 'User';
        });

        // Update user avatar
        const avatarElements = document.querySelectorAll('#user-avatar');
        avatarElements.forEach(el => {
            if (this.currentUserData.avatar) {
                el.textContent = this.currentUserData.avatar;
                el.style.backgroundImage = 'none';
            }
        });

        // Update balance
        this.updateBalance();

        // Load recent transactions
        this.loadRecentTransactions();
    }

    // Update balance display
    updateBalance() {
        const balanceElement = document.getElementById('user-balance');
        if (balanceElement && this.currentUserData) {
            balanceElement.textContent = this.currentUserData.balance.toFixed(2);
        }
    }

    // Set up real-time updates
    setupRealTimeUpdates() {
        // Listen for transaction updates
        this.paymentManager.onTransactionsUpdate((transactions) => {
            this.displayTransactions(transactions);
        });

        // In demo mode, periodically check for balance updates
        if (window.isDemo) {
            setInterval(() => {
                const userData = JSON.parse(localStorage.getItem('demoUserData') || 'null');
                if (userData && userData.balance !== this.currentUserData.balance) {
                    this.currentUserData = userData;
                    this.updateBalance();
                }
            }, 1000);
        }
    }

    // Load and display recent transactions
    async loadRecentTransactions() {
        const transactions = await this.paymentManager.getTransactionHistory(10);
        this.displayTransactions(transactions);
    }

    // Display transactions in the UI
    displayTransactions(transactions) {
        const activityList = document.getElementById('activity-list');
        if (!activityList) return;

        if (transactions.length === 0) {
            activityList.innerHTML = `
                <div class="activity-item">
                    <div class="activity-details">
                        <div class="activity-description">No transactions yet</div>
                        <div class="activity-date">Start by sending or requesting money!</div>
                    </div>
                </div>
            `;
            return;
        }

        activityList.innerHTML = transactions.map(transaction => {
            const formatted = this.paymentManager.formatTransaction(transaction);
            const date = this.formatDate(transaction.createdAt);
            const isPositive = formatted.amount > 0;
            
            return `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas fa-${isPositive ? 'arrow-down' : 'arrow-up'}"></i>
                    </div>
                    <div class="activity-details">
                        <div class="activity-description">${formatted.description}</div>
                        <div class="activity-date">${date}</div>
                        ${formatted.note ? `<div class="activity-note">${formatted.note}</div>` : ''}
                    </div>
                    <div class="activity-amount ${isPositive ? 'received' : 'sent'}">
                        ${isPositive ? '+' : ''}${this.paymentManager.formatCurrency(Math.abs(formatted.amount))}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Format date for display
    formatDate(timestamp) {
        if (!timestamp) return 'Unknown date';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else if (diffDays === 2) {
            return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else if (diffDays <= 7) {
            return date.toLocaleDateString([], { weekday: 'long', hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        }
    }

    // Initialize event listeners
    initEventListeners() {
        // Authentication tabs
        const authTabs = document.querySelectorAll('#auth-container .tab-btn');
        authTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const targetTab = e.target.getAttribute('data-tab');
                this.switchAuthTab(targetTab);
            });
        });

        // Authentication forms
        this.initAuthForms();

        // Dashboard actions
        this.initDashboardActions();

        // Modal controls
        this.initModalControls();

        // Quick action buttons
        this.initQuickActions();

        // Keyboard shortcuts
        this.initKeyboardShortcuts();
    }

    // Initialize authentication forms
    initAuthForms() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;

                try {
                    await this.authManager.signIn(email, password);
                } catch (error) {
                    // Error is handled by AuthManager
                }
            });
        }

        // Signup form
        const signupForm = document.getElementById('signup-form');
        if (signupForm) {
            signupForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const name = document.getElementById('signup-name').value;
                const email = document.getElementById('signup-email').value;
                const phone = document.getElementById('signup-phone').value;
                const password = document.getElementById('signup-password').value;
                const confirmPassword = document.getElementById('signup-confirm-password').value;

                if (password !== confirmPassword) {
                    this.authManager.showNotification('Passwords do not match', 'error');
                    return;
                }

                try {
                    await this.authManager.signUp(email, password, name, phone);
                } catch (error) {
                    // Error is handled by AuthManager
                }
            });
        }

        // Forgot password
        const forgotPasswordLink = document.getElementById('forgot-password-link');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', async (e) => {
                e.preventDefault();
                
                const email = document.getElementById('login-email').value;
                if (!email) {
                    this.authManager.showNotification('Please enter your email address first', 'warning');
                    return;
                }

                try {
                    await this.authManager.resetPassword(email);
                } catch (error) {
                    // Error is handled by AuthManager
                }
            });
        }
    }

    // Initialize dashboard actions
    initDashboardActions() {
        // Refresh balance
        const refreshBtn = document.getElementById('refresh-balance');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                this.currentUserData = await this.authManager.getCurrentUserData();
                this.updateBalance();
                this.authManager.showNotification('Balance updated', 'success');
            });
        }

        // User menu (for future implementation)
        const userMenuBtn = document.getElementById('user-menu-btn');
        if (userMenuBtn) {
            userMenuBtn.addEventListener('click', () => {
                // TODO: Implement user menu dropdown
                this.authManager.signOut();
            });
        }
    }

    // Initialize quick action buttons
    initQuickActions() {
        // Send money button
        const sendBtn = document.getElementById('send-money-btn');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                this.showModal('send-modal');
            });
        }

        // Request money button
        const requestBtn = document.getElementById('request-money-btn');
        if (requestBtn) {
            requestBtn.addEventListener('click', () => {
                this.showModal('request-modal');
            });
        }

        // QR code button
        const qrBtn = document.getElementById('qr-code-btn');
        if (qrBtn) {
            qrBtn.addEventListener('click', () => {
                this.showModal('qr-modal');
            });
        }

        // Split bill button
        const splitBtn = document.getElementById('split-bill-btn');
        if (splitBtn) {
            splitBtn.addEventListener('click', () => {
                this.authManager.showNotification('Split bill feature coming soon!', 'info');
            });
        }
    }

    // Initialize modal controls
    initModalControls() {
        // Modal close buttons
        const closeButtons = document.querySelectorAll('.modal-close');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.hideAllModals();
            });
        });

        // Modal overlay click to close
        const overlay = document.getElementById('modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.hideAllModals();
                }
            });
        }

        // Payment forms
        this.initPaymentForms();
    }

    // Initialize payment forms
    initPaymentForms() {
        // Send money form
        const sendForm = document.getElementById('send-form');
        if (sendForm) {
            sendForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const recipient = document.getElementById('send-recipient').value;
                const amount = document.getElementById('send-amount').value;
                const note = document.getElementById('send-note').value;

                try {
                    const result = await this.paymentManager.sendMoney(recipient, amount, note);
                    this.authManager.showNotification(result.message, 'success');
                    this.hideAllModals();
                    sendForm.reset();
                } catch (error) {
                    this.authManager.showNotification(error.message, 'error');
                }
            });
        }

        // Request money form
        const requestForm = document.getElementById('request-form');
        if (requestForm) {
            requestForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const from = document.getElementById('request-from').value;
                const amount = document.getElementById('request-amount').value;
                const note = document.getElementById('request-note').value;

                try {
                    const result = await this.paymentManager.requestMoney(from, amount, note);
                    this.authManager.showNotification(result.message, 'success');
                    this.hideAllModals();
                    requestForm.reset();
                } catch (error) {
                    this.authManager.showNotification(error.message, 'error');
                }
            });
        }
    }

    // Switch authentication tabs
    switchAuthTab(tabName) {
        // Update tab buttons
        const tabs = document.querySelectorAll('#auth-container .tab-btn');
        tabs.forEach(tab => {
            if (tab.getAttribute('data-tab') === tabName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Update forms
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');

        if (tabName === 'login') {
            loginForm.classList.remove('hidden');
            signupForm.classList.add('hidden');
        } else if (tabName === 'signup') {
            loginForm.classList.add('hidden');
            signupForm.classList.remove('hidden');
        }
    }

    // Show modal
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        const overlay = document.getElementById('modal-overlay');

        if (modal && overlay) {
            overlay.classList.remove('hidden');
            modal.classList.remove('hidden');
        }
    }

    // Hide all modals
    hideAllModals() {
        const overlay = document.getElementById('modal-overlay');
        const modals = document.querySelectorAll('.modal');

        if (overlay) {
            overlay.classList.add('hidden');
        }

        modals.forEach(modal => {
            modal.classList.add('hidden');
        });

        // Stop any QR scanning
        if (this.qrManager) {
            this.qrManager.stopScanning();
        }
    }

    // Handle keyboard shortcuts
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Close modals with Escape key
            if (e.key === 'Escape') {
                this.hideAllModals();
            }
        });
    }
}

// Create global instances
window.authManager = new AuthManager();
window.paymentManager = new PaymentManager();
window.qrManager = new QRManager();

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.zelleApp = new ZelleApp();
});