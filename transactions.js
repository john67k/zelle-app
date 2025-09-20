// Transactions Module
class TransactionManager {
    constructor() {
        this.supabase = window.DEMO_MODE ? window.supabaseDemo : supabase;
        this.transactions = [];
    }

    async loadTransactions(userId = null) {
        try {
            if (window.DEMO_MODE) {
                const transactions = JSON.parse(localStorage.getItem('demo_transactions') || '[]');
                this.transactions = transactions;
                this.renderTransactions(transactions);
                return transactions;
            } else {
                // Load from Supabase
                const { data, error } = await this.supabase
                    .from('transactions')
                    .select('*')
                    .eq('user_id', userId || authManager.getCurrentUser()?.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                this.transactions = data;
                this.renderTransactions(data);
                return data;
            }
        } catch (error) {
            console.error('Error loading transactions:', error);
            authManager.showToast('Failed to load transactions', 'error');
            return [];
        }
    }

    renderTransactions(transactions) {
        const container = document.getElementById('transactions-list');
        
        if (!transactions || transactions.length === 0) {
            container.innerHTML = `
                <div style="padding: 40px 20px; text-align: center; color: #666;">
                    <i class="fas fa-receipt" style="font-size: 48px; margin-bottom: 15px; opacity: 0.3;"></i>
                    <p>No transactions yet</p>
                    <p style="font-size: 14px; margin-top: 5px;">Start by sending or requesting money</p>
                </div>
            `;
            return;
        }

        container.innerHTML = transactions.slice(0, 5).map(transaction => {
            const isReceived = transaction.type === 'received';
            const amount = transaction.amount;
            const name = isReceived ? transaction.fromName : transaction.toName;
            const email = isReceived ? transaction.from : transaction.to;
            const amountClass = isReceived ? 'positive' : 'negative';
            const amountSign = isReceived ? '+' : '-';
            
            const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 
                            email.split('@')[0].substring(0, 2).toUpperCase();

            const date = new Date(transaction.createdAt);
            const timeAgo = this.getTimeAgo(date);

            return `
                <div class="transaction-item">
                    <div class="transaction-avatar">${initials}</div>
                    <div class="transaction-details">
                        <div class="transaction-name">${name || email}</div>
                        <div class="transaction-memo">${transaction.memo || 'No memo'} • ${timeAgo}</div>
                    </div>
                    <div class="transaction-amount ${amountClass}">
                        ${amountSign}$${amount.toFixed(2)}
                    </div>
                </div>
            `;
        }).join('');
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    }

    async sendMoney(recipient, amount, memo = '') {
        try {
            // Validate amount
            if (amount < APP_CONFIG.minTransactionAmount || amount > APP_CONFIG.maxTransactionAmount) {
                throw new Error(`Amount must be between $${APP_CONFIG.minTransactionAmount} and $${APP_CONFIG.maxTransactionAmount}`);
            }

            // Check balance
            const currentUser = JSON.parse(localStorage.getItem('demo_user'));
            if (currentUser.balance < amount) {
                throw new Error('Insufficient funds');
            }

            // Create transaction record
            const transaction = {
                type: 'sent',
                amount: amount,
                to: recipient,
                toName: this.getNameFromEmail(recipient),
                memo: memo,
                status: 'completed'
            };

            // Save transaction
            const { data, error } = await this.supabase
                .from('transactions')
                .insert([transaction]);

            if (error && !window.DEMO_MODE) {
                throw error;
            }

            // Send email receipt
            await window.emailUtils.sendTransactionReceipt(transaction, recipient);

            // Reload transactions and balance
            await this.loadTransactions();
            await loadUserData();

            authManager.showToast(`$${amount.toFixed(2)} sent to ${recipient}`, 'success');
            
            // Show success modal
            this.showSuccessModal('Money Sent!', `$${amount.toFixed(2)} has been sent to ${recipient}`);

            return { success: true, transaction };

        } catch (error) {
            console.error('Send money error:', error);
            authManager.showToast(error.message || 'Failed to send money', 'error');
            return { success: false, error: error.message };
        }
    }

    async requestMoney(from, amount, memo = '') {
        try {
            // Validate amount
            if (amount < APP_CONFIG.minTransactionAmount || amount > APP_CONFIG.maxTransactionAmount) {
                throw new Error(`Amount must be between $${APP_CONFIG.minTransactionAmount} and $${APP_CONFIG.maxTransactionAmount}`);
            }

            // Create request record
            const request = {
                type: 'request',
                amount: amount,
                from: from,
                fromName: this.getNameFromEmail(from),
                memo: memo,
                status: 'pending'
            };

            // In a real app, this would create a request that the other user can accept/decline
            // For demo, we'll simulate immediate acceptance
            setTimeout(async () => {
                const receivedTransaction = {
                    type: 'received',
                    amount: amount,
                    from: from,
                    fromName: this.getNameFromEmail(from),
                    memo: memo,
                    status: 'completed'
                };

                await this.supabase
                    .from('transactions')
                    .insert([receivedTransaction]);

                await this.loadTransactions();
                await loadUserData();

                authManager.showToast(`$${amount.toFixed(2)} received from ${from}`, 'success');
            }, 3000); // Simulate 3 second delay

            authManager.showToast(`Request sent to ${from}`, 'success');
            this.showSuccessModal('Request Sent!', `Request for $${amount.toFixed(2)} has been sent to ${from}`);

            return { success: true, request };

        } catch (error) {
            console.error('Request money error:', error);
            authManager.showToast(error.message || 'Failed to request money', 'error');
            return { success: false, error: error.message };
        }
    }

    async splitBill(total, recipients, memo = '') {
        try {
            const totalPeople = recipients.length + 1; // +1 for current user
            const amountPerPerson = total / totalPeople;

            // Validate amount
            if (amountPerPerson < APP_CONFIG.minTransactionAmount) {
                throw new Error('Split amount too small');
            }

            // Check balance for current user's portion
            const currentUser = JSON.parse(localStorage.getItem('demo_user'));
            if (currentUser.balance < amountPerPerson) {
                throw new Error('Insufficient funds for your portion');
            }

            // Create transactions for each recipient
            const transactions = [];
            
            for (const recipient of recipients) {
                const transaction = {
                    type: 'split_request',
                    amount: amountPerPerson,
                    to: recipient,
                    toName: this.getNameFromEmail(recipient),
                    memo: `Split bill: ${memo}`,
                    status: 'pending',
                    splitTotal: total,
                    splitParticipants: totalPeople
                };
                
                transactions.push(transaction);
            }

            // For demo, simulate immediate acceptance of splits
            setTimeout(async () => {
                for (const recipient of recipients) {
                    const receivedTransaction = {
                        type: 'received',
                        amount: amountPerPerson,
                        from: recipient,
                        fromName: this.getNameFromEmail(recipient),
                        memo: `Split bill: ${memo}`,
                        status: 'completed'
                    };

                    await this.supabase
                        .from('transactions')
                        .insert([receivedTransaction]);
                }

                await this.loadTransactions();
                await loadUserData();

                authManager.showToast(`Split bill completed! Received $${(amountPerPerson * recipients.length).toFixed(2)}`, 'success');
            }, 5000); // Simulate 5 second delay

            authManager.showToast(`Split bill requests sent to ${recipients.length} people`, 'success');
            
            this.showSuccessModal(
                'Split Bill Sent!', 
                `Requests for $${amountPerPerson.toFixed(2)} each have been sent to ${recipients.length} people`
            );

            return { success: true, transactions, amountPerPerson };

        } catch (error) {
            console.error('Split bill error:', error);
            authManager.showToast(error.message || 'Failed to split bill', 'error');
            return { success: false, error: error.message };
        }
    }

    getNameFromEmail(email) {
        // Simple name extraction from email
        const name = email.split('@')[0];
        return name.split('.').map(part => 
            part.charAt(0).toUpperCase() + part.slice(1)
        ).join(' ');
    }

    showSuccessModal(title, message) {
        document.getElementById('success-title').textContent = title;
        document.getElementById('success-message').textContent = message;
        document.getElementById('success-modal').style.display = 'block';
    }
}

// Initialize transaction manager
const transactionManager = new TransactionManager();

// Transaction form handlers
document.addEventListener('DOMContentLoaded', function() {
    // Quick action buttons
    document.getElementById('send-money-btn').addEventListener('click', () => {
        showModal('send-modal');
    });

    document.getElementById('request-money-btn').addEventListener('click', () => {
        showModal('request-modal');
    });

    document.getElementById('split-bill-btn').addEventListener('click', () => {
        showModal('split-modal');
    });

    // Send money form
    document.getElementById('send-money-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const recipient = document.getElementById('send-recipient').value;
        const amount = parseFloat(document.getElementById('send-amount').value);
        const memo = document.getElementById('send-memo').value;

        const result = await transactionManager.sendMoney(recipient, amount, memo);
        
        if (result.success) {
            closeModal('send-modal');
            e.target.reset();
        }
    });

    // Request money form
    document.getElementById('request-money-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const from = document.getElementById('request-from').value;
        const amount = parseFloat(document.getElementById('request-amount').value);
        const memo = document.getElementById('request-memo').value;

        const result = await transactionManager.requestMoney(from, amount, memo);
        
        if (result.success) {
            closeModal('request-modal');
            e.target.reset();
        }
    });

    // Split bill form
    document.getElementById('split-bill-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const total = parseFloat(document.getElementById('split-total').value);
        const memo = document.getElementById('split-memo').value;
        
        // Get all recipient inputs
        const recipientInputs = document.querySelectorAll('#split-recipients input');
        const recipients = Array.from(recipientInputs)
            .map(input => input.value.trim())
            .filter(value => value);

        if (recipients.length === 0) {
            authManager.showToast('Please add at least one person to split with', 'error');
            return;
        }

        const result = await transactionManager.splitBill(total, recipients, memo);
        
        if (result.success) {
            closeModal('split-modal');
            e.target.reset();
            // Reset split recipients to single input
            document.getElementById('split-recipients').innerHTML = `
                <div class="recipient-input">
                    <input type="email" placeholder="Email or phone number" required>
                    <button type="button" class="remove-recipient">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            updateSplitAmount();
        }
    });

    // Add recipient functionality
    document.getElementById('add-recipient').addEventListener('click', () => {
        const container = document.getElementById('split-recipients');
        const newRecipient = document.createElement('div');
        newRecipient.className = 'recipient-input';
        newRecipient.innerHTML = `
            <input type="email" placeholder="Email or phone number" required>
            <button type="button" class="remove-recipient">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(newRecipient);
        updateSplitAmount();
    });

    // Remove recipient functionality
    document.addEventListener('click', (e) => {
        if (e.target.closest('.remove-recipient')) {
            const recipientInput = e.target.closest('.recipient-input');
            const container = document.getElementById('split-recipients');
            
            // Don't remove if it's the last one
            if (container.children.length > 1) {
                recipientInput.remove();
                updateSplitAmount();
            } else {
                authManager.showToast('At least one person is required', 'warning');
            }
        }
    });

    // Update split amount calculation
    document.getElementById('split-total').addEventListener('input', updateSplitAmount);
    document.addEventListener('input', (e) => {
        if (e.target.closest('#split-recipients input')) {
            updateSplitAmount();
        }
    });

    function updateSplitAmount() {
        const total = parseFloat(document.getElementById('split-total').value) || 0;
        const recipients = document.querySelectorAll('#split-recipients input').length;
        const totalPeople = recipients + 1; // +1 for current user
        const amountEach = total / totalPeople;
        
        document.getElementById('split-amount-each').textContent = 
            `$${amountEach.toFixed(2)}`;
    }
});

// Load transactions when the page loads
async function loadTransactions() {
    await transactionManager.loadTransactions();
}

// Export for global access
window.transactionManager = transactionManager;