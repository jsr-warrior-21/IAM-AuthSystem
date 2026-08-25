const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const otpController = require('../controllers/otp.controller');
const sessionController = require('../controllers/session.controller');

const { requireSession, requireJwt } = require('../middlewares/auth.middleware');
const rateLimiter = require('../middlewares/rateLimiter.middleware');

// --- Registration & Auth Routes ---
router.post('/register', rateLimiter, authController.register);
router.post('/login', rateLimiter, authController.login);

// --- OTP Verification Routes ---
router.post('/send-email-otp', otpController.sendEmailOtp);
router.post('/verify-email-otp', otpController.verifyEmailOtp);

router.post('/send-sms-otp', otpController.sendSmsOtp);
router.post('/verify-sms-otp', otpController.verifySmsOtp);

router.post('/verify-login-otp', otpController.verifyLoginOtp);

// --- Session Auth Routes ---
router.get('/me', requireSession, sessionController.getMe);
router.post('/logout', sessionController.logout);

// --- JWT Auth Routes ---
router.post('/token', sessionController.issueToken);
router.get('/protected', requireJwt, sessionController.getProtected);

// --- Console Logs Inspection Route (for UI terminal) ---
router.get('/logs', sessionController.getLogs);

module.exports = router;
