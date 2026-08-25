# Enterprise IAM Authentication & Multi-Factor Authentication (MFA) System

A production-ready Identity and Access Management (IAM) solution built with **Node.js**, **Express**, and **Modern CSS/Vanilla JS**. Featuring dual-layer security with **Session Cookie Authentication** and **JWT Bearer Token Validation**, **Multi-Factor OTP Verification (Email + SMS)**, **Account Lockout Protection**, and pixel-matched responsive Web/Mobile UI screens.

---

## 🏛️ System Architecture & File Naming Conventions

The project follows strict separation of concerns using explicit `*.type.js` file naming conventions:

```text
iam-auth-system/
├── package.json
├── .env.example
├── .env
├── server.js
├── test-endpoints.js
├── src/
│   ├── config/
│   │   └── constants.config.js       # App configuration & security constants
│   ├── utils/
│   │   ├── appError.util.js          # Central operational error class
│   │   ├── asyncHandler.util.js      # Async route error handler wrapper
│   │   └── crypto.util.js            # Bcrypt, SHA-256 OTP hashing, crypto randoms
│   ├── models/
│   │   ├── user.model.js             # User data model & lockout counter
│   │   └── challenge.model.js        # OTP challenge repository
│   ├── services/
│   │   ├── auth.service.js           # Registration & password validation service
│   │   ├── otp.service.js            # OTP generation & single-use verification logic
│   │   ├── token.service.js          # JWT signing & verification service
│   │   └── notification.service.js   # Simulated Email & SMS console logger
│   ├── middlewares/
│   │   ├── auth.middleware.js        # Session & Bearer JWT authentication guards
│   │   ├── error.middleware.js       # Global Express JSON error middleware
│   │   └── rateLimiter.middleware.js # API rate limiting middleware
│   ├── controllers/
│   │   ├── auth.controller.js        # Registration & login controllers
│   │   ├── otp.controller.js         # Email & SMS OTP verification controllers
│   │   └── session.controller.js     # Session info, logout, & JWT controllers
│   └── routes/
│       └── api.route.js              # Express API route declarations
└── public/
    ├── index.html                    # Single-Page App containing all UI views
    ├── css/
    │   ├── style.css                 # Core CSS reset, colors, web/mobile viewports
    │   └── components.css            # Form inputs, OTP boxes, alerts, choice cards
    └── js/
        ├── api.js                    # Fetch HTTP client wrapper with cookie support
        └── app.js                    # Frontend UI state, OTP timers, screen navigation
```

---

## 🚀 Key Security Features

### 1. Server-Side OTP Generation & Verification Rules
- **Cryptographic Randomness**: 6-digit numeric OTPs generated via `crypto.randomInt()`.
- **Hashed Storage**: OTPs are stored strictly as SHA-256 hashes (`crypto.createHash('sha256')`). OTP codes are **never** returned in API responses.
- **Short Expiry (TTL)**: OTP challenges automatically expire after **3 minutes** (180 seconds).
- **Attempt Rate Limiting**: Maximum **3 verification attempts** per OTP challenge. Reaching 3 failed attempts invalidates the challenge immediately.
- **Single-Use Enforcement**: Successfully verified OTPs are marked `used` and invalidated instantly to prevent replay attacks.
- **Simulated Delivery**: Email and SMS notifications log formatted output to the Node.js server console and frontend terminal box:
  ```text
  [SIMULATED EMAIL]
  To: student@example.com
  OTP: 482913

  [SIMULATED SMS]
  To: +919876543210
  OTP: 123456
  ```

### 2. Account Lockout Protection
- Tracks consecutive failed password attempts.
- Reaching **5 consecutive bad password attempts** triggers a temporary **15-minute account lockout**.

### 3. Dual Authentication Mechanisms
- **Session-Based Cookie Auth**: Uses `express-session` with `HttpOnly`, `SameSite=lax`, and `Secure` attributes for browser dashboard sessions (`/api/me`, `/api/logout`).
- **JWT-Based Bearer Token Auth**: Issues short-lived JSON Web Tokens (`POST /api/token`) validated via HTTP request headers (`Authorization: Bearer <JWT>`) for API access (`GET /api/protected`).

---

## 🔄 User Registration & Login Journeys

### Registration Flow
```text
Registration Form  ──►  Email OTP Verification  ──►  SMS OTP Verification  ──►  MFA Enabled  ──►  Registration Success  ──►  Login
```

### Login Flow
```text
Login Form  ──►  Validate Credentials  ──►  MFA Check  ──►  Generate MFA OTP  ──►  Verify OTP  ──►  Session Created  ──►  Dashboard
```

---

## 📡 API Endpoint Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/register` | Initial user registration; sends Email OTP | Public |
| `POST` | `/api/send-email-otp` | Trigger Email OTP code delivery | Public |
| `POST` | `/api/verify-email-otp` | Verify 6-digit Email OTP | Public |
| `POST` | `/api/send-sms-otp` | Trigger SMS OTP code delivery | Public |
| `POST` | `/api/verify-sms-otp` | Verify 6-digit SMS OTP & enable MFA | Public |
| `POST` | `/api/login` | Validate credentials & trigger MFA OTP | Public |
| `POST` | `/api/verify-login-otp` | Verify MFA OTP & create server session | Public |
| `GET` | `/api/me` | Fetch logged-in user profile | Session Cookie |
| `POST` | `/api/logout` | Destroy session & clear cookie | Session Cookie |
| `POST` | `/api/token` | Issue short-lived JWT token | Session / User ID |
| `GET` | `/api/protected` | Access protected vault data | Bearer JWT |
| `GET` | `/api/logs` | Fetch simulated terminal console logs | Public |

---

## 💻 Quick Start & Setup Guide

### 1. Prerequisites
- **Node.js** v18.0.0 or higher
- **npm** v9.0.0 or higher

### 2. Installation & Server Start
```bash
# Clone repository
git clone https://github.com/jsr-warrior-21/IAM-AuthSystem.git
cd IAM-AuthSystem

# Install dependencies
npm install

# Start Express server
npm start
```

Open your web browser and navigate to: `http://localhost:3000`

---

## 🧪 Automated Testing

Execute the comprehensive 10-step automated integration test script:

```bash
npm test
```

### Verification Test Suite Coverage:
1. User registration (`POST /api/register`)
2. Simulated console log retrieval (`GET /api/logs`)
3. Email OTP verification (`POST /api/verify-email-otp`)
4. SMS OTP generation & delivery (`POST /api/send-sms-otp`)
5. SMS OTP verification (`POST /api/verify-sms-otp`)
6. Credential login (`POST /api/login`)
7. MFA Login OTP verification (`POST /api/verify-login-otp`)
8. Session Cookie authentication (`GET /api/me`)
9. JWT Token issuance (`POST /api/token`)
10. Protected API access (`GET /api/protected` with `Authorization: Bearer <JWT>`)

---

## 🎨 Interactive Frontend UI Preview Features

- **Viewport Toggle**: Switch between **Web View Layout** (split panel with `#2563eb` brand sidebar) and **Mobile Frame Layout** (smartphone bezel).
- **Screen Picker Dropdown**: Jump directly to any screen state matching reference mockups:
  1. Login (Default)
  2. Invalid Credentials
  3. Choose Method (MFA Setup)
  4. Email OTP
  5. Wrong OTP
  6. OTP Expired
  7. Mobile Verification (SMS)
  8. Mobile OTP Max Attempts
  9. Register Account
  10. Registration Success
  11. Authenticated Dashboard

---

## 📄 License

Distributed under the ISC License.
