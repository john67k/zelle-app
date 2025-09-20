// Supabase Configuration
const SUPABASE_CONFIG = {
    url: 'https://your-project-url.supabase.co',
    anon_key: 'your-anon-key-here'
};

// Gmail SMTP Configuration
const EMAIL_CONFIG = {
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'your-email@gmail.com',
        pass: 'your-app-password'
    }
};

// App Configuration
const APP_CONFIG = {
    currency: 'USD',
    defaultBalance: 2450.00,
    maxTransactionAmount: 5000.00,
    minTransactionAmount: 0.01,
    emailVerificationRequired: true,
    realTimeUpdates: true
};

// Initialize Supabase client
let supabase;

// For demo purposes, we'll use local storage simulation
// In production, replace with actual Supabase configuration
if (typeof window !== 'undefined') {
    // Demo mode - using localStorage for demonstration
    window.DEMO_MODE = true;
    
    // Initialize demo user data if not exists
    if (!localStorage.getItem('demo_user')) {
        localStorage.setItem('demo_user', JSON.stringify({
            id: 'demo-user-123',
            email: 'demo@example.com',
            name: 'Demo User',
            phone: '+1234567890',
            balance: 2450.00,
            emailVerified: true,
            createdAt: new Date().toISOString()
        }));
    }
    
    if (!localStorage.getItem('demo_transactions')) {
        localStorage.setItem('demo_transactions', JSON.stringify([
            {
                id: 'tx-1',
                type: 'received',
                amount: 150.00,
                from: 'john.doe@example.com',
                fromName: 'John Doe',
                memo: 'Dinner payment',
                createdAt: new Date(Date.now() - 86400000).toISOString()
            },
            {
                id: 'tx-2',
                type: 'sent',
                amount: 75.50,
                to: 'jane.smith@example.com',
                toName: 'Jane Smith',
                memo: 'Coffee',
                createdAt: new Date(Date.now() - 172800000).toISOString()
            },
            {
                id: 'tx-3',
                type: 'received',
                amount: 200.00,
                from: 'mike.wilson@example.com',
                fromName: 'Mike Wilson',
                memo: 'Rent split',
                createdAt: new Date(Date.now() - 259200000).toISOString()
            }
        ]));
    }
    
    // Simulate Supabase client for demo
    window.supabaseDemo = {
        auth: {
            signUp: async (credentials) => {
                // Simulate signup
                const user = {
                    id: 'user-' + Date.now(),
                    email: credentials.email,
                    emailConfirmed: false
                };
                
                localStorage.setItem('demo_user', JSON.stringify({
                    ...user,
                    name: credentials.name || '',
                    phone: credentials.phone || '',
                    balance: 0.00,
                    emailVerified: false,
                    createdAt: new Date().toISOString()
                }));
                
                return {
                    data: { user },
                    error: null
                };
            },
            
            signInWithPassword: async (credentials) => {
                // Simulate signin
                const userData = localStorage.getItem('demo_user');
                if (userData) {
                    const user = JSON.parse(userData);
                    if (user.email === credentials.email) {
                        return {
                            data: { user },
                            error: null
                        };
                    }
                }
                
                return {
                    data: null,
                    error: { message: 'Invalid credentials' }
                };
            },
            
            signOut: async () => {
                return { error: null };
            },
            
            getUser: async () => {
                const userData = localStorage.getItem('demo_user');
                if (userData) {
                    return {
                        data: { user: JSON.parse(userData) },
                        error: null
                    };
                }
                return { data: { user: null }, error: null };
            }
        },
        
        from: (table) => ({
            select: (columns = '*') => ({
                eq: (column, value) => ({
                    execute: async () => {
                        if (table === 'transactions') {
                            const transactions = JSON.parse(localStorage.getItem('demo_transactions') || '[]');
                            return {
                                data: transactions.filter(t => t[column] === value),
                                error: null
                            };
                        }
                        return { data: [], error: null };
                    }
                }),
                order: (column, options) => ({
                    execute: async () => {
                        if (table === 'transactions') {
                            const transactions = JSON.parse(localStorage.getItem('demo_transactions') || '[]');
                            const sorted = transactions.sort((a, b) => {
                                if (options?.ascending) {
                                    return new Date(a[column]) - new Date(b[column]);
                                }
                                return new Date(b[column]) - new Date(a[column]);
                            });
                            return { data: sorted, error: null };
                        }
                        return { data: [], error: null };
                    }
                })
            }),
            
            insert: (data) => ({
                execute: async () => {
                    if (table === 'transactions') {
                        const transactions = JSON.parse(localStorage.getItem('demo_transactions') || '[]');
                        const newTransaction = {
                            ...data,
                            id: 'tx-' + Date.now(),
                            createdAt: new Date().toISOString()
                        };
                        transactions.unshift(newTransaction);
                        localStorage.setItem('demo_transactions', JSON.stringify(transactions));
                        
                        // Update balance
                        const user = JSON.parse(localStorage.getItem('demo_user'));
                        if (data.type === 'sent') {
                            user.balance -= data.amount;
                        } else if (data.type === 'received') {
                            user.balance += data.amount;
                        }
                        localStorage.setItem('demo_user', JSON.stringify(user));
                        
                        return { data: [newTransaction], error: null };
                    }
                    return { data: [], error: null };
                }
            })
        })
    };
}

// Email utilities for demo
window.emailUtils = {
    sendVerificationEmail: async (email) => {
        console.log(`Demo: Verification email sent to ${email}`);
        return { success: true };
    },
    
    sendTransactionReceipt: async (transaction, recipientEmail) => {
        console.log(`Demo: Transaction receipt sent to ${recipientEmail}`, transaction);
        return { success: true };
    }
};