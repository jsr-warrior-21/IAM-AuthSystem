const OtpService = require('../services/otp.service');
const UserModel = require('../models/user.model');
const asyncHandler = require('../utils/asyncHandler.util');
const AppError = require('../utils/appError.util');

/**
 * Resend / Send Email OTP
 */
const sendEmailOtp = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    throw new AppError('User ID is required to send Email OTP', 400, 'MISSING_FIELDS');
  }

  const result = await OtpService.createChallenge({
    userId,
    channel: 'email'
  });

  res.status(200).json({
    success: true,
    message: 'Email OTP code sent successfully.',
    data: {
      challengeId: result.challengeId,
      expiresAt: result.expiresAt
    }
  });
});

/**
 * Verify Email OTP during registration
 */
const verifyEmailOtp = asyncHandler(async (req, res) => {
  const { challengeId, otp } = req.body;

  const verification = await OtpService.verifyOtp({ challengeId, otp });

  // Update user status
  await UserModel.update(verification.userId, {
    status: 'PENDING_SMS_VERIFICATION'
  });

  res.status(200).json({
    success: true,
    message: 'Email verified successfully.',
    data: {
      userId: verification.userId,
      emailVerified: true
    }
  });
});

/**
 * Send SMS OTP during registration
 */
const sendSmsOtp = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    throw new AppError('User ID is required to send SMS OTP', 400, 'MISSING_FIELDS');
  }

  const result = await OtpService.createChallenge({
    userId,
    channel: 'sms'
  });

  res.status(200).json({
    success: true,
    message: 'SMS OTP code sent successfully.',
    data: {
      challengeId: result.challengeId,
      expiresAt: result.expiresAt
    }
  });
});

/**
 * Verify SMS OTP & Enable MFA to complete registration
 */
const verifySmsOtp = asyncHandler(async (req, res) => {
  const { challengeId, otp } = req.body;

  const verification = await OtpService.verifyOtp({ challengeId, otp });

  // Mark MFA as enabled and registration as complete
  const updatedUser = await UserModel.update(verification.userId, {
    mfaEnabled: true,
    mfaMethod: 'sms',
    status: 'ACTIVE'
  });

  const { passwordHash, ...publicUser } = updatedUser;

  res.status(200).json({
    success: true,
    message: 'SMS verified. MFA enabled. Registration completed successfully!',
    data: {
      user: publicUser
    }
  });
});

/**
 * Verify Login MFA OTP and establish authenticated server session
 */
const verifyLoginOtp = asyncHandler(async (req, res) => {
  const { challengeId, otp } = req.body;

  const verification = await OtpService.verifyOtp({ challengeId, otp });

  const user = await UserModel.findById(verification.userId);
  if (!user) {
    throw new AppError('User account not found', 404, 'USER_NOT_FOUND');
  }

  // Create server-side session
  req.session.userId = user.id;
  req.session.authenticatedAt = new Date().toISOString();

  const { passwordHash, ...publicUser } = user;

  res.status(200).json({
    success: true,
    message: 'Login MFA verification successful. Session created.',
    data: {
      user: publicUser
    }
  });
});

module.exports = {
  sendEmailOtp,
  verifyEmailOtp,
  sendSmsOtp,
  verifySmsOtp,
  verifyLoginOtp
};
