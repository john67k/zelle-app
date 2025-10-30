# ZellePay - Instant Money Transfer Web App

A modern, responsive web application inspired by Zelle for instant money transfers. Built with vanilla JavaScript, HTML5, and CSS3 with Firebase backend integration.

## 🚀 Features

### Core Functionality
- **User Authentication**: Secure signup/login with email verification
- **Instant Payments**: Send money to contacts using email or phone
- **Payment Requests**: Request money from other users
- **QR Code Payments**: Generate and scan QR codes for quick transfers
- **Bill Splitting**: Split expenses among multiple people
- **Real-time Updates**: Live dashboard updates and notifications
- **Transaction History**: Complete transaction records with detailed information

### User Experience
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Modern UI**: Clean, intuitive interface inspired by Zelle
- **Instant Notifications**: Real-time feedback for all actions
- **Secure**: Email verification and secure authentication
- **Demo Mode**: Fully functional demo for testing

## 🛠️ Tech Stack

### Frontend
- **HTML5** - Semantic markup and structure
- **CSS3** - Modern styling with Flexbox and Grid
- **Vanilla JavaScript** - ES6+ features, async/await
- **Font Awesome** - Professional icons
- **QR Code Libraries** - QR generation and scanning

### Backend & Services
- **Firebase Authentication** - User management and security
- **Cloud Firestore** - Real-time database for transactions
- **Firebase Functions** - Serverless backend logic
- **Firebase Hosting** - Fast, secure hosting
- **SendGrid/Gmail SMTP** - Email notifications and receipts

## 📦 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- Firebase CLI
- Modern web browser

### Quick Start (Demo Mode)
1. **Clone the repository**
   ```bash
   git clone https://github.com/john67k/zelle-app.git
   cd zelle-app
   ```

2. **Start local development server**
   ```bash
   # Using Python
   python3 -m http.server 8000
   
   # Or using Node.js
   npx serve .
   
   # Or using PHP
   php -S localhost:8000
   ```

3. **Open in browser**
   ```
   http://localhost:8000
   ```

4. **Test the demo**
   - Use any email/password to sign in
   - Try sending money to test@example.com
   - Generate QR codes for payments
   - Explore all features in demo mode

### Production Setup

#### 1. Firebase Project Setup
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase project
firebase init
```

#### 2. Configure Firebase
1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication with Email/Password
3. Enable Cloud Firestore
4. Enable Cloud Functions
5. Copy your Firebase configuration

#### 3. Update Configuration
Edit `js/firebase-config.js`:
```javascript
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};

// Set to false for production
window.isDemo = false;
```

#### 4. Deploy Firebase Functions
```bash
# Deploy functions for email notifications
firebase deploy --only functions

# Deploy Firestore security rules
firebase deploy --only firestore:rules

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

### GitHub Pages Deployment

#### Option 1: Manual Deployment
1. Push code to your GitHub repository
2. Go to repository Settings > Pages
3. Select source branch (main)
4. Your app will be available at `https://yourusername.github.io/zelle-app`

#### Option 2: GitHub Actions (Automatic)
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file for sensitive configuration:
```env
FIREBASE_API_KEY=your_api_key
SENDGRID_API_KEY=your_sendgrid_key
GMAIL_USER=your_gmail@gmail.com
GMAIL_PASS=your_app_password
```

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /transactions/{transactionId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.participants;
    }
  }
}
```

## 📱 Usage Guide

### Getting Started
1. **Sign Up**: Create account with email and password
2. **Verify Email**: Check your inbox and verify your email
3. **Add Funds**: Start with demo balance or add real funds
4. **Send Money**: Enter recipient email and amount
5. **Request Money**: Ask others to send you money
6. **Use QR Codes**: Generate codes for in-person payments

### Key Features

#### Sending Money
- Enter recipient's email or phone number
- Specify amount and optional note
- Confirm transaction
- Instant transfer with email receipt

#### Requesting Money
- Enter requester's contact information
- Specify amount and reason
- Send request via email notification
- Track request status

#### QR Code Payments
- Generate QR codes with payment amount
- Share QR code for instant payments
- Scan others' QR codes to pay
- Secure with timestamp validation

#### Bill Splitting
- Enter total amount and participants
- Automatic equal split calculation
- Send requests to all participants
- Track individual payment status

## 🚀 API Reference

### Authentication API
```javascript
// Sign up new user
await authManager.signUp(email, password, fullName, phone);

// Sign in existing user
await authManager.signIn(email, password);

// Sign out
await authManager.signOut();

// Reset password
await authManager.resetPassword(email);
```

### Payment API
```javascript
// Send money
await paymentManager.sendMoney(recipientEmail, amount, note);

// Request money
await paymentManager.requestMoney(fromEmail, amount, note);

// Split bill
await paymentManager.splitBill(participants, totalAmount, description);

// Generate QR code
const qrData = paymentManager.generateQRData(amount, note);

// Process QR payment
await paymentManager.processQRPayment(qrData);
```

### Real-time Updates
```javascript
// Listen for transaction updates
paymentManager.onTransactionsUpdate((transactions) => {
    console.log('New transactions:', transactions);
});

// Listen for authentication changes
authManager.onAuthStateChanged((user) => {
    console.log('Auth state changed:', user);
});
```

## 🎨 Customization

### Styling
- Edit `css/style.css` for custom themes
- Update color variables for brand colors
- Modify layout and responsive breakpoints

### Features
- Add new payment methods in `js/payments.js`
- Extend QR functionality in `js/qr.js`
- Add new authentication providers in `js/auth.js`

## 🔒 Security Features

- **Email Verification**: Required for account activation
- **Secure Authentication**: Firebase Auth with industry standards
- **Input Validation**: Client and server-side validation
- **Rate Limiting**: Protection against abuse
- **Encrypted Storage**: Secure data handling
- **HTTPS Only**: Secure data transmission

## 🧪 Testing

### Manual Testing
1. **Authentication Flow**
   - Sign up with new email
   - Verify email verification flow
   - Test password reset
   - Test sign in/out

2. **Payment Features**
   - Send money between test accounts
   - Request money functionality
   - QR code generation and scanning
   - Bill splitting with multiple users

3. **UI/UX Testing**
   - Test on different screen sizes
   - Verify responsive design
   - Test keyboard navigation
   - Check accessibility features

### Browser Compatibility
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ✅ Mobile browsers

## 📈 Performance

### Optimization Features
- **Lazy Loading**: Load resources on demand
- **Image Optimization**: Responsive images
- **Minification**: Compressed CSS/JS
- **Caching**: Aggressive caching strategies
- **CDN**: Firebase hosting with global CDN

### Performance Metrics
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Lighthouse Score**: 90+

## 🚀 Deployment Options

### 1. GitHub Pages (Free)
- Perfect for demo/personal use
- Automatic deployment from Git
- Custom domain support
- HTTPS included

### 2. Firebase Hosting (Recommended)
- Optimized for Firebase integration
- Global CDN
- Custom domains
- SSL certificates

### 3. Netlify
- Git-based deployment
- Preview deployments
- Edge functions
- Form handling

### 4. Vercel
- Zero-config deployment
- Serverless functions
- Edge network
- Analytics

## 📚 Learning Resources

### Documentation
- [Firebase Documentation](https://firebase.google.com/docs)
- [Web APIs Documentation](https://developer.mozilla.org/en-US/docs/Web/API)
- [Progressive Web Apps](https://web.dev/progressive-web-apps/)

### Tutorials
- [Firebase Authentication Guide](https://firebase.google.com/docs/auth/web/start)
- [Firestore Database Guide](https://firebase.google.com/docs/firestore)
- [QR Code Implementation](https://github.com/soldair/node-qrcode)

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Code Style
- Use ESLint configuration
- Follow semantic commit messages
- Write descriptive comments
- Test across browsers

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Support

### Getting Help
- 📧 Email: support@zellepay-demo.com
- 💬 Issues: [GitHub Issues](https://github.com/john67k/zelle-app/issues)
- 📖 Documentation: [Wiki](https://github.com/john67k/zelle-app/wiki)

### Feature Requests
Have an idea for a new feature? Open an issue with the "enhancement" label!

## ⭐ Acknowledgments

- Zelle for the original design inspiration
- Firebase team for the excellent backend services
- Open source community for the amazing libraries
- Contributors who help improve the project

---

**Built with ❤️ for the modern web**
