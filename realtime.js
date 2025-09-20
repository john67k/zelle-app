// Real-time Updates Module
class RealtimeManager {
    constructor() {
        this.supabase = window.DEMO_MODE ? window.supabaseDemo : supabase;
        this.subscriptions = [];
        this.isInitialized = false;
        this.simulationInterval = null;
    }

    async init() {
        if (this.isInitialized || !APP_CONFIG.realTimeUpdates) {
            return;
        }

        try {
            if (window.DEMO_MODE) {
                this.initDemoMode();
            } else {
                this.initSupabaseRealtime();
            }
            
            this.isInitialized = true;
            console.log('Real-time updates initialized');
            
        } catch (error) {
            console.error('Failed to initialize real-time updates:', error);
        }
    }

    initDemoMode() {
        // Simulate real-time updates in demo mode
        console.log('Demo mode: Simulating real-time updates');
        
        // Simulate periodic balance updates
        this.simulationInterval = setInterval(() => {
            this.simulateRandomUpdate();
        }, 30000); // Every 30 seconds

        // Listen for storage changes (if user has multiple tabs open)
        window.addEventListener('storage', (e) => {
            if (e.key === 'demo_transactions' || e.key === 'demo_user') {
                this.handleStorageChange(e);
            }
        });
    }

    initSupabaseRealtime() {
        const user = authManager.getCurrentUser();
        if (!user) return;

        // Subscribe to transaction changes
        const transactionSubscription = this.supabase
            .channel('transactions')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'transactions',
                filter: `user_id=eq.${user.id}`
            }, (payload) => {
                this.handleTransactionUpdate(payload);
            })
            .subscribe();

        // Subscribe to balance changes
        const balanceSubscription = this.supabase
            .channel('user_balances')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'users',
                filter: `id=eq.${user.id}`
            }, (payload) => {
                this.handleBalanceUpdate(payload);
            })
            .subscribe();

        this.subscriptions.push(transactionSubscription, balanceSubscription);
    }

    handleStorageChange(event) {
        if (event.key === 'demo_transactions') {
            // Reload transactions when they change
            if (window.transactionManager) {
                window.transactionManager.loadTransactions();
            }
            this.showRealtimeNotification('Transaction updated');
        }
        
        if (event.key === 'demo_user') {
            // Reload user data when balance changes
            loadUserData();
            this.showRealtimeNotification('Balance updated');
        }
    }

    handleTransactionUpdate(payload) {
        console.log('Real-time transaction update:', payload);
        
        // Reload transactions
        if (window.transactionManager) {
            window.transactionManager.loadTransactions();
        }

        // Show notification based on event type
        if (payload.eventType === 'INSERT') {
            const transaction = payload.new;
            if (transaction.type === 'received') {
                this.showRealtimeNotification(
                    `Received $${transaction.amount} from ${transaction.from_name || transaction.from}`,
                    'success'
                );
                this.playNotificationSound();
            }
        }
    }

    handleBalanceUpdate(payload) {
        console.log('Real-time balance update:', payload);
        
        // Update balance display
        if (payload.new.balance !== undefined) {
            updateBalanceDisplay(payload.new.balance);
            this.showRealtimeNotification('Balance updated');
        }
    }

    simulateRandomUpdate() {
        // Randomly simulate incoming transactions for demo
        if (Math.random() < 0.3) { // 30% chance
            this.simulateIncomingTransaction();
        }
    }

    simulateIncomingTransaction() {
        const sampleTransactions = [
            {
                from: 'alex.johnson@example.com',
                fromName: 'Alex Johnson',
                amount: Math.floor(Math.random() * 100) + 25,
                memo: 'Coffee refund'
            },
            {
                from: 'sarah.wilson@example.com',
                fromName: 'Sarah Wilson',
                amount: Math.floor(Math.random() * 200) + 50,
                memo: 'Lunch split'
            },
            {
                from: 'mike.davis@example.com',
                fromName: 'Mike Davis',
                amount: Math.floor(Math.random() * 150) + 30,
                memo: 'Movie tickets'
            }
        ];

        const randomTransaction = sampleTransactions[Math.floor(Math.random() * sampleTransactions.length)];
        
        // Add to demo transactions
        const transactions = JSON.parse(localStorage.getItem('demo_transactions') || '[]');
        const newTransaction = {
            id: 'tx-' + Date.now(),
            type: 'received',
            ...randomTransaction,
            createdAt: new Date().toISOString()
        };
        
        transactions.unshift(newTransaction);
        localStorage.setItem('demo_transactions', JSON.stringify(transactions));

        // Update balance
        const user = JSON.parse(localStorage.getItem('demo_user'));
        user.balance += newTransaction.amount;
        localStorage.setItem('demo_user', JSON.stringify(user));

        // Trigger updates
        window.transactionManager.loadTransactions();
        loadUserData();

        // Show notification
        this.showRealtimeNotification(
            `Received $${newTransaction.amount.toFixed(2)} from ${newTransaction.fromName}`,
            'success'
        );
        
        this.playNotificationSound();
        this.updateNotificationBadge();
    }

    showRealtimeNotification(message, type = 'info') {
        // Create a more prominent notification for real-time updates
        const notification = document.createElement('div');
        notification.className = `toast ${type} realtime-notification`;
        notification.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
            border: none;
        `;
        
        notification.innerHTML = `
            <i class="fas fa-bolt"></i>
            <span>${message}</span>
        `;

        const container = document.getElementById('toast-container');
        container.appendChild(notification);

        // Auto remove after 4 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => {
                if (container.contains(notification)) {
                    container.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    playNotificationSound() {
        // Create and play a subtle notification sound
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            console.log('Could not play notification sound:', error);
        }
    }

    updateNotificationBadge() {
        const badge = document.getElementById('notification-count');
        const currentCount = parseInt(badge.textContent) || 0;
        const newCount = currentCount + 1;
        
        badge.textContent = newCount;
        badge.style.display = newCount > 0 ? 'flex' : 'none';

        // Animate the badge
        badge.style.animation = 'bounceIn 0.5s ease';
        setTimeout(() => {
            badge.style.animation = '';
        }, 500);
    }

    clearNotificationBadge() {
        const badge = document.getElementById('notification-count');
        badge.textContent = '0';
        badge.style.display = 'none';
    }

    cleanup() {
        // Unsubscribe from all real-time subscriptions
        this.subscriptions.forEach(subscription => {
            if (subscription && typeof subscription.unsubscribe === 'function') {
                subscription.unsubscribe();
            }
        });
        
        this.subscriptions = [];

        // Clear demo mode simulation
        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
            this.simulationInterval = null;
        }

        // Remove storage listener
        window.removeEventListener('storage', this.handleStorageChange);
        
        this.isInitialized = false;
        console.log('Real-time updates cleaned up');
    }

    // Manual methods for testing
    triggerTestNotification() {
        this.showRealtimeNotification('This is a test notification', 'info');
        this.playNotificationSound();
    }

    triggerTestTransaction() {
        this.simulateIncomingTransaction();
    }
}

// Initialize real-time manager
const realtimeManager = new RealtimeManager();

// Notification handlers
document.addEventListener('DOMContentLoaded', function() {
    // Notification button click handler
    document.getElementById('notifications-btn').addEventListener('click', () => {
        realtimeManager.clearNotificationBadge();
        
        // Show notifications panel (could expand this to show a full notification history)
        authManager.showToast('All notifications cleared', 'info');
    });

    // Add test buttons for demo purposes (remove in production)
    if (window.DEMO_MODE) {
        // Add test buttons to header for demo
        const headerActions = document.querySelector('.header-actions');
        
        // Test notification button
        const testNotificationBtn = document.createElement('button');
        testNotificationBtn.className = 'icon-btn';
        testNotificationBtn.innerHTML = '<i class="fas fa-vial"></i>';
        testNotificationBtn.title = 'Test Notification';
        testNotificationBtn.addEventListener('click', () => {
            realtimeManager.triggerTestNotification();
        });
        
        // Test transaction button
        const testTransactionBtn = document.createElement('button');
        testTransactionBtn.className = 'icon-btn';
        testTransactionBtn.innerHTML = '<i class="fas fa-flask"></i>';
        testTransactionBtn.title = 'Test Transaction';
        testTransactionBtn.addEventListener('click', () => {
            realtimeManager.triggerTestTransaction();
        });
        
        headerActions.insertBefore(testNotificationBtn, headerActions.firstChild);
        headerActions.insertBefore(testTransactionBtn, headerActions.firstChild);
    }
});

// Handle page visibility changes to manage real-time updates efficiently
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden, could reduce update frequency
        console.log('Page hidden, maintaining real-time updates');
    } else {
        // Page is visible, ensure full real-time functionality
        console.log('Page visible, full real-time updates active');
        
        // Refresh data when user returns to the page
        if (window.transactionManager && authManager.isLoggedIn()) {
            window.transactionManager.loadTransactions();
            loadUserData();
        }
    }
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    realtimeManager.cleanup();
});

// Export for global access
window.realtimeManager = realtimeManager;