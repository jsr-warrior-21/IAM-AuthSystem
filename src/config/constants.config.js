require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_jwt_key_iam_2026_secure',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  SESSION_SECRET: process.env.SESSION_SECRET || 'super_secret_session_key_iam_2026',
  
  // OTP Rules
  OTP_TTL_SECONDS: 180, // 3 minutes expiry
  OTP_MAX_ATTEMPTS: 3,
  
  // Lockout Rules
  MAX_FAILED_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 15,

  // Cookie settings
  COOKIE_NAME: 'iam_session_id',
  COOKIE_SECRET: process.env.SESSION_SECRET || 'super_secret_session_key_iam_2026'
};
