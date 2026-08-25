# SecureID — IAM Authentication & Registration System

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-000000?style=for-the-badge&logo=vercel)](https://iam-auth-system-nu.vercel.app/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.19-000000?style=for-the-badge&logo=express)](https://expressjs.com/)

An enterprise-grade **Identity and Access Management (IAM) & Multi-Factor Authentication (MFA)** system built with Node.js, Express, and modern responsive vanilla HTML/CSS/JavaScript. Features dual-layer authentication (**Session Cookies** & **JWT Bearer Header**), server-side OTP security, account lockout protection, and responsive web/mobile UI views matching industry specifications.

🔗 **Live Deployment URL**: [https://iam-auth-system-nu.vercel.app/](https://iam-auth-system-nu.vercel.app/)

---

## 📌 Table of Contents
- [Overview](#-overview)
- [System Architecture & File Structure](#-system-architecture--file-structure)
- [Security & Authentication Logic](#-security--authentication-logic)
  - [1. Server-Side OTP Implementation](#1-server-side-otp-implementation)
  - [2. Account Lockout Protection](#2-account-lockout-protection)
  - [3. Dual Authentication Mechanisms](#3-dual-authentication-mechanisms)
- [Frontend User Journeys](#-frontend-user-journeys)
- [API Endpoint Reference](#-api-endpoint-reference)
- [Local Installation & Setup](#-local-installation--setup)
- [Automated Integration Testing](#-automated-integration-testing)

---

## 🌟 Overview

SecureID implements a robust backend-driven authentication architecture where security decisions remain strictly on the server:
- **Registration Journey**: Full Name, Email, Mobile Number, and Password validation ➔ 6-digit Email OTP Verification ➔ 6-digit SMS OTP Verification ➔ MFA Enabled Status ➔ Registration Success ➔ Login.
- **Login Journey**: Credential Validation ➔ Account Lockout Check ➔ MFA Required Response ➔ Generate & Send OTP ➔ Verify OTP ➔ Create Authenticated Server Session.
- **Simulated Notification Delivery**: Email/SMS messages are logged directly to the Node.js server console and streamed to the UI terminal viewer.

---

## 🏗️ System Architecture & File Structure

The project enforces strict separation of concerns using explicit `*.type.js` naming conventions across all layers:

```text
iam-auth-system/
├── package.json                    # Project dependencies & script declarations
├── vercel.json                     # Vercel cloud deployment build configuration
├── server.js                       # Express application initialization & middleware setup
├── test-endpoints.js              # Automated 10-step integration test runner
├── .env.example                    # Environment variable templates
├── .env                            # Active environment configurations
│
├── src/
│   ├── config/
│   │   └── constants.config.js     # Global security constants, TTLs, lockout limits
│   │
│   ├── utils/
│   │   ├── appError.util.js        # Centralized operational HTTP error class
│   │   ├── asyncHandler.util.js    # Async promise wrapper for route controllers
│   │   └── crypto.util.js          # Bcrypt hashing, SHA-256 OTP hashing, random generators
│   │
│   ├── models/
│   │   ├── user.model.js           # User data repository & lockout tracking
│   │   └── challenge.model.js      # OTP challenge repository & attempt counters
│   │
│   ├── services/
│   │   ├── auth.service.js         # Registration & credential check business logic
│   │   ├── otp.service.js          # Server OTP creation, hashing & single-use rules
│   │   ├── token.service.js        # JWT token generation & verification service
│   │   └── notification.service.js # Simulated Email/SMS console logger & buffer
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js      # Session guards & Bearer JWT validation guards
│   │   ├── error.middleware.js     # Central Express JSON error middleware
│   │   └── rateLimiter.middleware.js # API brute-force rate limiter middleware
│   │
│   ├── controllers/
│   │   ├── auth.controller.js      # Registration & login endpoint controllers
│   │   ├── otp.controller.js       # Email & SMS OTP send/verify controllers
│   │   └── session.controller.js   # Session profile, logout, & JWT controllers
│   │
│   └── routes/
│       └── api.route.js            # Express API endpoint route declarations
│
└── public/
    ├── index.html                  # Single-Page App containing all UI mockup views
    ├── css/
    │   ├── style.css               # Core CSS, royal blue brand sidebar, media queries
    │   └── components.css          # Form inputs, OTP boxes, alerts, choice cards
    └── js/
        ├── api.js                  # Fetch HTTP API client wrapper with cookie support
        └── app.js                  # State manager, OTP timers, auto-tabbing & UI navigation
```

---

## 🔒 Security & Authentication Logic

### 1. Server-Side OTP Implementation
- **Cryptographic Generation**: 6-digit numeric OTPs generated on the server using `crypto.randomInt(100000, 1000000)`.
- **Hashed Representation**: OTPs are stored strictly as SHA-256 hashes (`crypto.createHash('sha256')`). OTP codes are **never** returned in API responses.
- **Short Expiry (TTL)**: OTP challenges automatically expire after **3 minutes** (180 seconds).
- **Attempt Limit**: Maximum **3 verification attempts** per OTP challenge. Reaching 3 failed attempts invalidates the challenge immediately.
- **Single-Use Rule**: Verified OTPs are instantly marked `used` to prevent replay attacks.
- **Simulated Logs**: Printed directly to Node.js server console:
  ```text
  [SIMULATED EMAIL]
  To: student@example.com
  OTP: 482913

  [SIMULATED SMS]
  To: +919876543210
  OTP: 123456
  ```

### 2. Account Lockout Protection
- Tracks consecutive invalid password attempts.
- Reaching **5 consecutive bad password attempts** triggers a temporary **15-minute account lockout**.

### 3. Dual Authentication Mechanisms
- **Session-Based Cookie Authentication**: Uses `express-session` with `HttpOnly`, `SameSite=lax`, and `Secure` attributes for browser dashboard sessions (`/api/me`, `/api/logout`).
- **JWT-Based Bearer Token Authentication**: Issues short-lived JSON Web Tokens (`POST /api/token`) validated via HTTP headers (`Authorization: Bearer <JWT>`) for protected API access (`GET /api/protected`). Authentication tokens are **never stored in `localStorage`**.

---

## 📱 Frontend User Journeys

The frontend dynamically presents screens based on backend responses, supporting both Desktop/Laptop split-panel layouts and Mobile viewports via fluid CSS `@media` queries:

1. **Login (Default)**: Form input for Email/Username, Password with eye toggle, Remember me, Forgot password link, Login button, Google SSO button, Create account link.
2. **Invalid Credentials**: Error state with red input borders, error messages, and attempt tracking.
3. **Choose Method (MFA Setup)**: Selection cards for Email OTP, SMS OTP, and Authenticator App.
4. **Email OTP Verification**: 6 auto-focusing digit boxes, 3-minute expiry countdown (`02:45`), 25-second resend cooldown (`00:25`), wrong OTP alerts, and expired state.
5. **Mobile Verification (SMS OTP)**: Phone verification with attempt tracking and max attempts lockout screen.
6. **Registration Details**: Step wizard progress indicator (`1 2 3 4 5`), input validation, password requirement checks, terms checkbox.
7. **Registration Success**: Confirmation card with checkmarks for Email verified, Mobile verified, and MFA enabled.
8. **Authenticated Dashboard**: Displays `/api/me` profile info, session cookie status, interactive JWT token generator, and protected endpoint tester.

---

## 📡 API Endpoint Reference

| Method | Endpoint | Description | Auth Requirement |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/register` | Initial user registration; triggers Email OTP | Public |
| `POST` | `/api/send-email-otp` | Trigger Email OTP code delivery | Public |
| `POST` | `/api/verify-email-otp` | Verify 6-digit Email OTP code | Public |
| `POST` | `/api/send-sms-otp` | Trigger SMS OTP code delivery | Public |
| `POST` | `/api/verify-sms-otp` | Verify 6-digit SMS OTP & enable MFA | Public |
| `POST` | `/api/login` | Validate credentials & trigger MFA challenge | Public |
| `POST` | `/api/verify-login-otp` | Verify MFA OTP & create server session | Public |
| `GET` | `/api/me` | Fetch authenticated user profile | Session Cookie |
| `POST` | `/api/logout` | Destroy session & clear cookie | Session Cookie |
| `POST` | `/api/token` | Issue short-lived JWT token | Session / User ID |
| `GET` | `/api/protected` | Access protected vault data | Bearer JWT Header |
| `GET` | `/api/logs` | Fetch simulated terminal console logs | Public |

---

## 🛠️ Local Installation & Setup

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 2. Clone & Install
```bash
# Clone the repository
git clone https://github.com/jsr-warrior-21/IAM-AuthSystem.git
cd IAM-AuthSystem

# Install dependencies
npm install

# Start Express server locally
npm start
```

Open `http://localhost:3000` in your web browser.

---

## 🧪 Automated Integration Testing

Run the automated integration test script:

```bash
npm test
```

### Test Suite Coverage (10/10 Verification Steps):
1. User registration (`POST /api/register`)
2. Simulated console log retrieval (`GET /api/logs`)
3. Email OTP verification (`POST /api/verify-email-otp`)
4. SMS OTP generation & delivery (`POST /api/send-sms-otp`)
5. SMS OTP verification (`POST /api/verify-sms-otp`)
6. Credential login (`POST /api/login`)
7. MFA Login OTP verification (`POST /api/verify-login-otp`)
8. Session Cookie profile verification (`GET /api/me`)
9. JWT Token issuance (`POST /api/token`)
10. Protected resource authorization (`GET /api/protected` with `Authorization: Bearer <JWT>`)

---

## 📄 License

Distributed under the ISC License.
