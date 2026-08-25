# Enterprise IAM Authentication & Multi-Factor Authentication (MFA) System

A production-ready Identity and Access Management (IAM) solution built with **Node.js**, **Express**, and **Modern CSS/Vanilla JS**. Featuring dual-layer security with **Session Cookie Authentication** and **JWT Bearer Token Validation**, **Multi-Factor OTP Verification (Email + SMS)**, **Account Lockout Protection**, and pixel-matched responsive Web/Mobile UI screens.

---

## 🌐 Deployment Guide (Cloud & Hosting Options)

### Option 1: Deploy on Vercel (Recommended - Zero Config)
1. Go to [vercel.com](https://vercel.com) and log in with GitHub.
2. Click **"Add New"** ➔ **"Project"**.
3. Import your GitHub repository: `https://github.com/jsr-warrior-21/IAM-AuthSystem.git`.
4. Add Environment Variables (optional, defaults are set in config):
   - `JWT_SECRET`: `your_secure_jwt_secret`
   - `SESSION_SECRET`: `your_secure_session_secret`
   - `NODE_ENV`: `production`
5. Click **"Deploy"**. Vercel will automatically build and publish your live URL!

---

### Option 2: Deploy on Render (Free Web Service)
1. Go to [render.com](https://render.com) and log in.
2. Click **"New +"** ➔ **"Web Service"**.
3. Connect your GitHub repository: `jsr-warrior-21/IAM-AuthSystem`.
4. Configure service settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Click **"Create Web Service"**.

---

### Option 3: Deploy on Railway
1. Go to [railway.app](https://railway.app).
2. Click **"New Project"** ➔ **"Deploy from GitHub repo"**.
3. Select `jsr-warrior-21/IAM-AuthSystem`.
4. Railway will automatically detect `package.json` and deploy `node server.js`.

---

### Option 4: Deploy on VPS (Ubuntu / AWS EC2 / DigitalOcean)
```bash
# 1. SSH into server & clone repo
git clone https://github.com/jsr-warrior-21/IAM-AuthSystem.git
cd IAM-AuthSystem

# 2. Install dependencies
npm install --production

# 3. Install & start process manager (PM2)
sudo npm install -g pm2
pm2 start server.js --name "iam-auth-system"
pm2 save
pm2 startup

# 4. Optional: Setup Nginx reverse proxy to port 3000
```

---

## 🏛️ System Architecture & File Naming Conventions

The project follows strict separation of concerns using explicit `*.type.js` file naming conventions:

```text
iam-auth-system/
├── package.json
├── vercel.json                      # Vercel serverless deployment config
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
- **Attempt Rate Limiting**: Maximum **3 verification attempts** per OTP challenge.
- **Single-Use Enforcement**: Successfully verified OTPs are marked `used` and invalidated instantly.

### 2. Account Lockout Protection
- Reaching **5 consecutive bad password attempts** triggers a temporary **15-minute account lockout**.

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

## 🧪 Automated Testing

Execute the comprehensive 10-step automated integration test script:

```bash
npm test
```

---

## 📄 License

Distributed under the ISC License.
