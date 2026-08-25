require('dotenv').config();

// System configuration and security constants
module.exports = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_jwt_key_iam_2026_secure',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  SESSION_SECRET: process.env.SESSION_SECRET || 'super_secret_session_key_iam_2026',
  
  // OTP security rules
  OTP_TTL_SECONDS: 180, // Code expires after 3 minutes
  OTP_MAX_ATTEMPTS: 3,  // Invalidate OTP after 3 wrong tries
  
  // Account lockout rules
  MAX_FAILED_LOGIN_ATTEMPTS: 5, // Lock account after 5 consecutive bad passwords
  LOCKOUT_DURATION_MINUTES: 15, // Lockout lasts 15 minutes

  // Cookie configuration
  COOKIE_NAME: 'iam_session_id',
  COOKIE_SECRET: process.env.SESSION_SECRET || 'super_secret_session_key_iam_2026'
};
