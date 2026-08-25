const UserModel = require('../models/user.model');
const OtpService = require('./otp.service');
const { hashPassword, comparePassword } = require('../utils/crypto.util');
const AppError = require('../utils/appError.util');

class AuthService {
  /**
   * Register new user and initiate Email OTP challenge
   */
  static async registerUser({ fullName, email, phone, password }) {
    if (!fullName || !email || !password) {
      throw new AppError('Full name, email, and password are required', 400, 'MISSING_FIELDS');
    }

    const existingUser = await UserModel.findByEmailOrPhone(email);
    if (existingUser) {
      throw new AppError('An account with this email already exists', 409, 'USER_EXISTS');
    }

    if (phone) {
      const existingPhone = await UserModel.findByEmailOrPhone(phone);
      if (existingPhone) {
        throw new AppError('An account with this mobile number already exists', 409, 'PHONE_EXISTS');
      }
    }

    const passwordHash = await hashPassword(password);

    const newUser = await UserModel.create({
      fullName,
      email,
      phone,
      passwordHash
    });

    // Generate Email OTP challenge
    const otpResult = await OtpService.createChallenge({
      userId: newUser.id,
      channel: 'email'
    });

    return {
      userId: newUser.id,
      email: newUser.email,
      challengeId: otpResult.challengeId,
      expiresAt: otpResult.expiresAt
    };
  }

  /**
   * Validate user credentials and initiate MFA login challenge
   */
  static async loginUser({ identifier, password }) {
    if (!identifier || !password) {
      throw new AppError('Email/phone and password are required', 400, 'MISSING_FIELDS');
    }

    const user = await UserModel.findByEmailOrPhone(identifier);
    if (!user) {
      throw new AppError('Invalid email or password. Please try again.', 401, 'INVALID_CREDENTIALS');
    }

    // Check account lockout status
    if (user.lockoutUntil) {
      const lockoutTime = new Date(user.lockoutUntil);
      const now = new Date();

      if (now < lockoutTime) {
        const remainingMinutes = Math.ceil((lockoutTime - now) / (60 * 1000));
        throw new AppError(`Account locked due to multiple failed login attempts. Please try again in ${remainingMinutes} minute(s).`, 423, 'ACCOUNT_LOCKED');
      } else {
        // Lockout period expired - reset counter
        await UserModel.resetFailedLogin(user.id);
      }
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      const updatedUser = await UserModel.recordFailedLogin(user.id);
      const remainingAttempts = 5 - updatedUser.failedLoginAttempts;

      if (remainingAttempts <= 0) {
        throw new AppError('Account locked due to 5 consecutive failed login attempts. Try again in 15 minutes.', 423, 'ACCOUNT_LOCKED');
      }

      const error = new AppError('Invalid email or password. Please try again.', 401, 'INVALID_CREDENTIALS');
      error.remainingAttempts = remainingAttempts;
      throw error;
    }

    // Credentials valid - reset failed attempts
    await UserModel.resetFailedLogin(user.id);

    // Initiate MFA OTP challenge
    const mfaChannel = user.mfaMethod || 'email';
    const otpResult = await OtpService.createChallenge({
      userId: user.id,
      channel: mfaChannel
    });

    return {
      mfaRequired: true,
      method: mfaChannel,
      challengeId: otpResult.challengeId,
      userId: user.id
    };
  }
}

module.exports = AuthService;
