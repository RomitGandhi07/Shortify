# Shortify (URL Shortner)
URL Shortener with Analytics & User Authentication

A powerful URL shortening service built with Node.js, Express, TypeScript, and MongoDB. Features user authentication, analytics tracking, and comprehensive API endpoints.

📚 **Quick Links:** [Quick Start Guide](QUICKSTART.md) | [Testing Guide](TESTING.md) | [Test Flow](TEST_FLOW.md)

## Features

- 🔗 **URL Shortening** - Create short, memorable links
- 👤 **User Authentication** - Secure signup, login, email verification
- 📊 **Analytics** - Track clicks, locations, devices, and browsers
- 🔒 **Security** - JWT-based authentication with refresh tokens
- 🎯 **Custom Slugs** - Create personalized short URLs
- 📧 **Email Service** - Email verification and password reset
- 🚀 **Anonymous URLs** - Create URLs without authentication
- ⚡ **Fast & Scalable** - Built with Express and MongoDB

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Shortify
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   
   **Option A: Automated (Recommended)**
   ```bash
   npm run setup
   # Interactive script that creates .env with secure secrets
   ```
   
   **Option B: Manual**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

## Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

## Testing

Run the comprehensive test suite that covers all functionality:

```bash
npm test
```

The test script will automatically:
1. Build the project
2. Start the server
3. Run all 17 test cases
4. Stop the server

**Tests cover:**
- ✅ Authentication (signup, login, logout, token refresh)
- ✅ URL creation and management
- ✅ Analytics tracking
- ✅ Security and access control
- ✅ Email verification flow
- ✅ Anonymous URL creation

**Prerequisites:**
- MongoDB running and configured in `.env`
- Port 3000 available
- All dependencies installed (`npm install`)

For detailed testing information, see [TESTING.md](TESTING.md)

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/verify-email?token=` - Verify email
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/refresh-token` - Refresh access token
- `GET /api/auth/me` - Get current user

### URL Management
- `POST /api/urls` - Create short URL
- `GET /api/urls` - Get user's URLs
- `GET /api/urls/:slug` - Get URL metadata
- `GET /:slug` - Redirect to long URL

### Analytics
- `GET /api/urls/:slug/analytics/summary` - Get analytics summary
- `GET /api/urls/:slug/analytics/timeseries` - Get time-series data

## Environment Variables

Required environment variables (see `.env.example`):

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/shortify
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-password
BASE_URL=http://localhost:3000
```

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Email**: Nodemailer
- **User Agent Parsing**: ua-parser-js

## Project Structure

```
Shortify/
├── src/
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Authentication & validation
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── test_comprehensive.sh # Test suite
├── TESTING.md           # Testing documentation
└── package.json
```

## License

ISC

## Contributing

Feel free to submit issues and pull requests!

---

Made with ❤️ for better URL management
