// Payments Module
class PaymentManager {
    constructor() {
        this.currentUser = null;
        this.unsubscribeTransactions = null;
        this.transactionListeners = [];
        this.mockTransactions = [];
    }

    // Set current user
    setCurrentUser(user) {
        this.currentUser = user;
        if (user) {
            this.setupTransactionListener();
        } else {
            this.cleanup();
        }
    }

    // Setup real-time transaction listener
    setupTransactionListener() {
        if (!this.currentUser) return;

        if (window.isDemo) {
            // Load demo transactions
            this.loadDemoTransactions();
            // Simulate real-time updates
            setTimeout(() => {
                this.transactionListeners.forEach(callback => callback(this.mockTransactions));
            }, 100);
        } else {
            // Real Firebase implementation would go here
        }
    }

    // Load demo transactions
    loadDemoTransactions() {
        const stored = localStorage.getItem('demoTransactions');
        if (stored) {
            this.mockTransactions = JSON.parse(stored);
        } else {
            // Create some demo transactions
            this.mockTransactions = [
                {
                    id: 'demo-1',
                    type: 'send',
                    senderId: this.currentUser.uid,
                    senderName: this.currentUser.displayName,
                    recipientId: 'demo-user-2',
                    recipientName: 'John Doe',
                    recipientEmail: 'john@example.com',
                    amount: 25.00,
                    note: 'Coffee money',
                    status: 'completed',
                    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Yesterday
                },
                {
                    id: 'demo-2',
                    type: 'receive',
                    senderId: 'demo-user-3',
                    senderName: 'Jane Smith',
                    recipientId: this.currentUser.uid,
                    recipientName: this.currentUser.displayName,
                    amount: 50.00,
                    note: 'Dinner split',
                    status: 'completed',
                    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
                }
            ];
            this.saveDemoTransactions();
        }
    }

    // Save demo transactions
    saveDemoTransactions() {
        localStorage.setItem('demoTransactions', JSON.stringify(this.mockTransactions));
    }

    // Register transaction listener
    onTransactionsUpdate(callback) {
        this.transactionListeners.push(callback);
    }

    // Send money to another user
    async sendMoney(recipientEmail, amount, note = '') {
        if (!this.currentUser) {
            throw new Error('User not authenticated');
        }

        try {
            // Validate amount
            const numAmount = parseFloat(amount);
            if (isNaN(numAmount) || numAmount <= 0) {
                throw new Error('Invalid amount');
            }

            if (window.isDemo) {
                // Get current user data
                const userData = JSON.parse(localStorage.getItem('demoUserData'));
                if (userData.balance < numAmount) {
                    throw new Error('Insufficient balance');
                }

                // Create transaction
                const transaction = {
                    id: 'demo-' + Date.now(),
                    type: 'send',
                    senderId: this.currentUser.uid,
                    senderName: this.currentUser.displayName,
                    senderEmail: this.currentUser.email,
                    recipientId: 'demo-recipient-' + Date.now(),
                    recipientName: recipientEmail.split('@')[0],
                    recipientEmail: recipientEmail,
                    amount: numAmount,
                    note: note.trim(),
                    status: 'completed',
                    participants: [this.currentUser.uid],
                    createdAt: new Date()
                };

                // Update balance
                userData.balance -= numAmount;
                localStorage.setItem('demoUserData', JSON.stringify(userData));

                // Add transaction
                this.mockTransactions.unshift(transaction);
                this.saveDemoTransactions();

                // Notify listeners
                this.transactionListeners.forEach(callback => callback(this.mockTransactions));

                return {
                    success: true,
                    message: `Successfully sent $${numAmount.toFixed(2)} to ${transaction.recipientName}`
                };
            } else {
                // Real Firebase implementation would go here
                throw new Error('Firebase not configured for production use');
            }

        } catch (error) {
            console.error('Send money error:', error);
            throw new Error(error.message || 'Failed to send money');
        }
    }

    // Request money from another user
    async requestMoney(fromEmail, amount, note = '') {
        if (!this.currentUser) {
            throw new Error('User not authenticated');
        }

        try {
            // Validate amount
            const numAmount = parseFloat(amount);
            if (isNaN(numAmount) || numAmount <= 0) {
                throw new Error('Invalid amount');
            }

            if (window.isDemo) {
                // Create money request
                const transaction = {
                    id: 'demo-req-' + Date.now(),
                    type: 'request',
                    requesterId: this.currentUser.uid,
                    requesterName: this.currentUser.displayName,
                    requesterEmail: this.currentUser.email,
                    fromId: 'demo-from-' + Date.now(),
                    fromName: fromEmail.split('@')[0],
                    fromEmail: fromEmail,
                    amount: numAmount,
                    note: note.trim(),
                    status: 'pending',
                    participants: [this.currentUser.uid],
                    createdAt: new Date()
                };

                // Add transaction
                this.mockTransactions.unshift(transaction);
                this.saveDemoTransactions();

                // Notify listeners
                this.transactionListeners.forEach(callback => callback(this.mockTransactions));

                return {
                    success: true,
                    message: `Money request sent to ${transaction.fromName}`
                };
            } else {
                throw new Error('Firebase not configured for production use');
            }

        } catch (error) {
            console.error('Request money error:', error);
            throw new Error(error.message || 'Failed to request money');
        }
    }

    // Split bill among multiple users
    async splitBill(participants, totalAmount, description = '') {
        if (!this.currentUser) {
            throw new Error('User not authenticated');
        }

        try {
            const numAmount = parseFloat(totalAmount);
            if (isNaN(numAmount) || numAmount <= 0) {
                throw new Error('Invalid amount');
            }

            if (!participants || participants.length === 0) {
                throw new Error('No participants provided');
            }

            const splitAmount = numAmount / (participants.length + 1); // +1 for current user

            if (window.isDemo) {
                // Create split bill transactions for each participant
                participants.forEach((email, index) => {
                    const transaction = {
                        id: 'demo-split-' + Date.now() + '-' + index,
                        type: 'split_request',
                        billId: 'demo-bill-' + Date.now(),
                        requesterId: this.currentUser.uid,
                        requesterName: this.currentUser.displayName,
                        fromId: 'demo-participant-' + index,
                        fromName: email.split('@')[0],
                        fromEmail: email,
                        amount: splitAmount,
                        note: `Split bill: ${description}`,
                        status: 'pending',
                        participants: [this.currentUser.uid],
                        createdAt: new Date()
                    };

                    this.mockTransactions.unshift(transaction);
                });

                this.saveDemoTransactions();
                this.transactionListeners.forEach(callback => callback(this.mockTransactions));

                return {
                    success: true,
                    message: `Bill split successfully. Each person owes $${splitAmount.toFixed(2)}`
                };
            } else {
                throw new Error('Firebase not configured for production use');
            }

        } catch (error) {
            console.error('Split bill error:', error);
            throw new Error(error.message || 'Failed to split bill');
        }
    }

    // Generate payment QR code data
    generateQRData(amount, note = '') {
        if (!this.currentUser) {
            throw new Error('User not authenticated');
        }

        const qrData = {
            type: 'payment',
            recipientId: this.currentUser.uid,
            recipientEmail: this.currentUser.email,
            amount: parseFloat(amount),
            note: note.trim(),
            timestamp: Date.now()
        };

        return JSON.stringify(qrData);
    }

    // Process QR code payment
    async processQRPayment(qrData) {
        try {
            const paymentData = JSON.parse(qrData);
            
            if (paymentData.type !== 'payment') {
                throw new Error('Invalid QR code');
            }

            // Check if QR code is not too old (5 minutes)
            const fiveMinutes = 5 * 60 * 1000;
            if (Date.now() - paymentData.timestamp > fiveMinutes) {
                throw new Error('QR code has expired');
            }

            // Process payment
            return await this.sendMoney(
                paymentData.recipientEmail,
                paymentData.amount,
                paymentData.note || 'QR Code Payment'
            );

        } catch (error) {
            console.error('QR payment error:', error);
            throw new Error(error.message || 'Failed to process QR payment');
        }
    }

    // Send email notification (placeholder)
    async sendPaymentNotification(data) {
        try {
            // In demo mode, just log it
            console.log('Email notification (demo):', data);
            
        } catch (error) {
            console.error('Failed to send email notification:', error);
        }
    }

    // Get user's transaction history
    async getTransactionHistory(limitCount = 50) {
        if (!this.currentUser) return [];

        try {
            if (window.isDemo) {
                return this.mockTransactions.slice(0, limitCount);
            } else {
                // Real Firebase implementation would go here
                return [];
            }

        } catch (error) {
            console.error('Error getting transaction history:', error);
            return [];
        }
    }

    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    // Format transaction for display
    formatTransaction(transaction) {
        const isCurrentUserSender = transaction.senderId === this.currentUser.uid;
        const isRequest = transaction.type === 'request' || transaction.type === 'split_request';
        
        let description, amount, type;
        
        if (isRequest) {
            if (transaction.fromId === this.currentUser.uid) {
                description = `Request from ${transaction.requesterName}`;
                amount = -transaction.amount;
                type = 'request_received';
            } else {
                description = `Request to ${transaction.fromName}`;
                amount = transaction.amount;
                type = 'request_sent';
            }
        } else {
            if (isCurrentUserSender) {
                description = `Sent to ${transaction.recipientName}`;
                amount = -transaction.amount;
                type = 'sent';
            } else {
                description = `Received from ${transaction.senderName}`;
                amount = transaction.amount;
                type = 'received';
            }
        }

        return {
            id: transaction.id,
            description,
            amount,
            type,
            status: transaction.status,
            date: transaction.createdAt,
            note: transaction.note
        };
    }

    // Cleanup listeners
    cleanup() {
        if (this.unsubscribeTransactions) {
            this.unsubscribeTransactions();
            this.unsubscribeTransactions = null;
        }
        this.transactionListeners = [];
    }
}

// Create global payment manager instance
window.paymentManager = new PaymentManager();