// Main Application Controller
class ZelleApp {
    constructor() {
        this.isInitialized = false;
        this.currentView = 'auth';
    }

    async init() {
        if (this.isInitialized) return;

        try {
            // Show loading screen
            this.showLoading();

            // Initialize authentication
            const isAuthenticated = await authManager.init();

            if (isAuthenticated) {
                // User is already logged in
                this.hideLoading();
                this.showApp();
            } else {
                // Show authentication modal
                this.hideLoading();
                this.showAuth();
            }

            this.setupEventListeners();
            this.isInitialized = true;

        } catch (error) {
            console.error('App initialization error:', error);
            this.hideLoading();
            this.showError('Failed to initialize app');
        }
    }

    showLoading() {
        document.getElementById('loading-screen').style.display = 'flex';
    }

    hideLoading() {
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            loadingScreen.style.opacity = '1';
        }, 300);
    }

    showAuth() {
        document.getElementById('auth-modal').style.display = 'block';
        document.getElementById('app').style.display = 'none';
        this.currentView = 'auth';
    }

    showApp() {
        document.getElementById('auth-modal').style.display = 'none';
        document.getElementById('app').style.display = 'block';
        this.currentView = 'app';
        
        // Load app data
        this.loadAppData();
    }

    async loadAppData() {
        try {
            // Load user data and transactions
            await loadUserData();
            await transactionManager.loadTransactions();

            // Initialize real-time updates
            if (realtimeManager) {
                await realtimeManager.init();
            }

        } catch (error) {
            console.error('Error loading app data:', error);
            authManager.showToast('Some features may not work properly', 'warning');
        }
    }

    setupEventListeners() {
        // Modal close handlers
        this.setupModalHandlers();
        
        // Profile button handler
        document.getElementById('profile-btn').addEventListener('click', () => {
            this.showProfileMenu();
        });

        // Add money button handler
        document.getElementById('add-money-btn').addEventListener('click', () => {
            this.showAddMoneyModal();
        });

        // View all transactions handler
        document.getElementById('view-all-btn').addEventListener('click', () => {
            this.showAllTransactions();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Handle back button
        window.addEventListener('popstate', (e) => {
            this.handleBackButton(e);
        });
    }

    setupModalHandlers() {
        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });

        // Close button handlers
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modalId = e.target.closest('button').getAttribute('data-modal');
                if (modalId) {
                    closeModal(modalId);
                }
            });
        });

        // ESC key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal[style*="block"]');
                if (openModal) {
                    openModal.style.display = 'none';
                }
            }
        });
    }

    showProfileMenu() {
        const menu = document.createElement('div');
        menu.className = 'profile-menu';
        menu.innerHTML = `
            <div class="profile-menu-content">
                <div class="profile-header">
                    <div class="profile-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="profile-info">
                        <h4>${authManager.getCurrentUser()?.name || 'User'}</h4>
                        <p>${authManager.getCurrentUser()?.email || ''}</p>
                    </div>
                </div>
                <div class="profile-actions">
                    <button onclick="app.showSettings()">
                        <i class="fas fa-cog"></i>
                        Settings
                    </button>
                    <button onclick="app.showTransactionHistory()">
                        <i class="fas fa-history"></i>
                        Transaction History
                    </button>
                    <button onclick="app.showSupport()">
                        <i class="fas fa-question-circle"></i>
                        Help & Support
                    </button>
                    <button onclick="app.signOut()" class="sign-out-btn">
                        <i class="fas fa-sign-out-alt"></i>
                        Sign Out
                    </button>
                </div>
            </div>
        `;

        // Add styles
        menu.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            display: flex;
            align-items: flex-start;
            justify-content: flex-end;
            padding: 70px 20px 20px;
        `;

        const content = menu.querySelector('.profile-menu-content');
        content.style.cssText = `
            background: white;
            border-radius: 15px;
            padding: 20px;
            min-width: 250px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            animation: slideDown 0.3s ease;
        `;

        document.body.appendChild(menu);

        // Close when clicking outside
        menu.addEventListener('click', (e) => {
            if (e.target === menu) {
                document.body.removeChild(menu);
            }
        });
    }

    showAddMoneyModal() {
        // Simple add money implementation
        authManager.showToast('Add money feature coming soon!', 'info');
    }

    showAllTransactions() {
        // Show all transactions in a modal or new view
        authManager.showToast('Full transaction history coming soon!', 'info');
    }

    showSettings() {
        authManager.showToast('Settings coming soon!', 'info');
        this.closeProfileMenu();
    }

    showTransactionHistory() {
        authManager.showToast('Transaction history coming soon!', 'info');
        this.closeProfileMenu();
    }

    showSupport() {
        authManager.showToast('Help & Support coming soon!', 'info');
        this.closeProfileMenu();
    }

    closeProfileMenu() {
        const menu = document.querySelector('.profile-menu');
        if (menu) {
            document.body.removeChild(menu);
        }
    }

    async signOut() {
        this.closeProfileMenu();
        await authManager.signOut();
    }

    handleKeyboardShortcuts(e) {
        // Only handle shortcuts when not typing in inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }

        switch (e.key) {
            case 's':
                if (this.currentView === 'app') {
                    e.preventDefault();
                    showModal('send-modal');
                }
                break;
            case 'r':
                if (this.currentView === 'app') {
                    e.preventDefault();
                    showModal('request-modal');
                }
                break;
            case 'p':
                if (this.currentView === 'app') {
                    e.preventDefault();
                    showModal('split-modal');
                }
                break;
        }
    }

    handleBackButton(e) {
        // Handle browser back button if needed
        console.log('Back button pressed');
    }

    showError(message) {
        authManager.showToast(message, 'error');
    }
}

// Global utility functions
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Add custom CSS for profile menu animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            transform: translateY(-20px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    .profile-menu-content .profile-header {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 1px solid #e5e5e5;
    }

    .profile-menu-content .profile-avatar {
        width: 50px;
        height: 50px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 20px;
    }

    .profile-menu-content .profile-info h4 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #1a1a1a;
    }

    .profile-menu-content .profile-info p {
        margin: 2px 0 0;
        font-size: 14px;
        color: #666;
    }

    .profile-menu-content .profile-actions button {
        width: 100%;
        background: none;
        border: none;
        padding: 12px;
        text-align: left;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 14px;
        color: #333;
        transition: background 0.2s ease;
        margin-bottom: 5px;
    }

    .profile-menu-content .profile-actions button:hover {
        background: #f5f5f5;
    }

    .profile-menu-content .profile-actions .sign-out-btn {
        color: #ff6b6b;
        border-top: 1px solid #e5e5e5;
        margin-top: 10px;
        padding-top: 15px;
    }

    .profile-menu-content .profile-actions .sign-out-btn:hover {
        background: #fff5f5;
    }
`;
document.head.appendChild(style);

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    // Create and initialize app
    window.app = new ZelleApp();
    await window.app.init();

    // Add some demo hints for users
    if (window.DEMO_MODE) {
        setTimeout(() => {
            authManager.showToast('Demo mode active! Try sending money to demo@example.com', 'info');
        }, 2000);

        // Add demo instructions to the page
        const demoNotice = document.createElement('div');
        demoNotice.style.cssText = `
            position: fixed;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 8px 15px;
            border-radius: 20px;
            font-size: 12px;
            z-index: 9999;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        `;
        demoNotice.textContent = 'DEMO MODE - All transactions are simulated';
        document.body.appendChild(demoNotice);
    }
});

// Service Worker registration (for future PWA features)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // navigator.serviceWorker.register('/sw.js')
        //     .then(registration => console.log('SW registered'))
        //     .catch(error => console.log('SW registration failed'));
    });
}

// Handle app install prompt (PWA)
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button or notification
    console.log('App can be installed');
});

// Export for debugging
window.ZelleApp = ZelleApp;