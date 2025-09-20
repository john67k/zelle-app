# ZellePay - Instant Money Transfer App

A modern, Zelle-style money transfer application built with vanilla HTML, CSS, and JavaScript. Features a responsive mobile-first design, real-time updates, and comprehensive transaction management.

## 🚀 Features

### Core Functionality
- **Send Money**: Instant money transfers to any email or phone number
- **Request Money**: Request payments from other users with automatic notifications
- **Split Bills**: Split expenses among multiple people with automatic calculation
- **Transaction History**: Complete history of all transactions with search and filtering
- **Real-time Updates**: Live balance and transaction updates using simulated real-time features

### User Experience
- **Mobile-First Design**: Responsive interface optimized for mobile devices
- **Modern UI**: Clean, intuitive interface inspired by leading fintech apps
- **Dark Mode Support**: Automatic dark mode based on system preferences
- **Accessibility**: Screen reader support and keyboard navigation
- **Progressive Web App**: Can be installed on mobile devices

### Security & Notifications
- **Email Verification**: User registration with email verification (simulated)
- **Transaction Receipts**: Automatic email receipts for all transactions (simulated)
- **Real-time Notifications**: Push notifications for incoming transactions
- **Balance Privacy**: Toggle balance visibility for privacy

## 🛠️ Technology Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Styling**: CSS Grid, Flexbox, CSS Custom Properties
- **Icons**: Font Awesome 6
- **Fonts**: Inter (Google Fonts)
- **Backend**: Configured for Supabase integration
- **Real-time**: Supabase real-time subscriptions (demo mode uses localStorage)
- **Email**: Gmail SMTP integration for notifications

## 📱 Demo Mode

The app includes a comprehensive demo mode that simulates all features:

- Pre-populated user account with sample transactions
- Simulated real-time updates every 30 seconds
- Mock email notifications logged to console
- Persistent demo data using localStorage
- Test buttons for simulating incoming transactions

## 🚀 Getting Started

### Prerequisites
- Node.js 14+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/john67k/zelle-app.git
   cd zelle-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

### Configuration

For production use, update the configuration in `config.js`:

```javascript
const SUPABASE_CONFIG = {
    url: 'your-supabase-project-url',
    anon_key: 'your-supabase-anon-key'
};

const EMAIL_CONFIG = {
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
        user: 'your-email@gmail.com',
        pass: 'your-app-password'
    }
};
```

## 🎯 Usage

### Demo Account
- **Email**: demo@example.com
- **Initial Balance**: $2,450.00
- **Sample Transactions**: Pre-loaded with example transactions

### Key Features Demonstration

1. **Send Money**
   - Click "Send" button
   - Enter recipient email: `demo@example.com`
   - Enter amount and optional memo
   - Submit to see instant balance update

2. **Split Bills**
   - Click "Split" button
   - Enter total amount
   - Add multiple recipients
   - See automatic per-person calculation

3. **Real-time Updates**
   - Use "Test Transaction" button to simulate incoming payments
   - Watch balance and transaction list update in real-time
   - Notification badge shows new activity

## 📂 Project Structure

```
zelle-app/
├── index.html          # Main application page
├── styles.css          # Complete styling with responsive design
├── config.js           # App configuration and demo setup
├── auth.js             # Authentication management
├── transactions.js     # Transaction handling and UI
├── realtime.js         # Real-time updates and notifications
├── app.js             # Main application controller
├── package.json       # Dependencies and scripts
└── README.md          # Documentation
```

## 🔧 Architecture

### Frontend Architecture
- **Modular Design**: Separate modules for auth, transactions, and real-time features
- **Event-Driven**: Uses custom events for component communication
- **State Management**: Centralized state management with localStorage fallback
- **Error Handling**: Comprehensive error handling with user feedback

### Backend Integration
- **Supabase Ready**: Pre-configured for Supabase database and auth
- **Real-time Subscriptions**: Uses Supabase real-time for live updates
- **Email Integration**: Ready for Gmail SMTP integration
- **Scalable Schema**: Database schema designed for production use

## 🎨 Design Features

- **Gradient UI**: Modern gradient backgrounds and button styles
- **Smooth Animations**: CSS transitions and keyframe animations
- **Micro-interactions**: Hover effects and loading states
- **Toast Notifications**: Non-intrusive user feedback
- **Modal System**: Overlay modals for forms and confirmations

## 🔒 Security Considerations

- Input validation and sanitization
- XSS protection through proper DOM manipulation
- CSRF protection for production deployment
- Secure email handling for notifications
- Balance privacy controls

## 📱 Mobile Optimization

- Touch-friendly interface with proper touch targets
- Responsive breakpoints for all device sizes
- Optimized performance for mobile networks
- Native app-like experience with PWA features

## 🚀 Production Deployment

For production deployment:

1. Update configuration with real Supabase credentials
2. Set up Gmail SMTP or alternative email service
3. Configure proper environment variables
4. Enable HTTPS for security
5. Set up proper error monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Zelle and other modern fintech applications
- Icons provided by Font Awesome
- Fonts by Google Fonts
- Built with modern web standards and best practices
