// Firebase Configuration
// For demo purposes, we'll run in demo mode without external dependencies
window.isDemo = true;

// Mock Firebase objects for demo mode
window.auth = {
    onAuthStateChanged: () => {},
    signOut: () => Promise.resolve()
};

window.db = {};
window.functions = {};

console.log('Demo mode initialized - no external dependencies required');