const ChallengeModel = require('../models/challenge.model');
const UserModel = require('../models/user.model');
const NotificationService = require('./notification.service');
const { generateOtp, hashOtp, compareOtp } = require('../utils/crypto.util');
const AppError = require('../utils/appError.util');

class OtpService {
  /**
   * Create an OTP challenge and send code via specified channel (email/sms)
   */
  static async createChallenge({ userId, channel }) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError('User not found', 44, 'USER_NOT_FOUND');
    }

    const rawOtp = generateOtp();
    const otpHash = hashOtp(rawOtp);

    const challenge = await ChallengeModel.create({
      userId,
      channel,
      otpHash
    });

    // Send/Print simulated OTP
    if (channel === 'sms') {
      await NotificationService.sendSmsOtp(user.phone || '+919876543210', rawOtp);
    } else {
      await NotificationService.sendEmailOtp(user.email, rawOtp);
    }

    return {
      challengeId: challenge.challengeId,
      expiresAt: challenge.expiresAt,
      channel: challenge.channel
    };
  }

  /**
   * Verify an OTP challenge
   */
  static async verifyOtp({ challengeId, otp }) {
    if (!challengeId || !otp) {
      throw new AppError('Challenge ID and OTP are required', 400, 'MISSING_FIELDS');
    }

    const challenge = await ChallengeModel.findById(challengeId);
    if (!challenge) {
      throw new AppError('Invalid or expired challenge session', 400, 'INVALID_CHALLENGE');
    }

    if (challenge.used) {
      throw new AppError('This OTP challenge has already been used', 400, 'CHALLENGE_USED');
    }

    const now = new Date();
    const expiry = new Date(challenge.expiresAt);

    if (now > expiry) {
      await ChallengeModel.markUsed(challengeId);
      throw new AppError('OTP code has expired. Please request a new code.', 400, 'OTP_EXPIRED');
    }

    if (challenge.attempts >= challenge.maxAttempts) {
      await ChallengeModel.markUsed(challengeId);
      throw new AppError('Maximum verification attempts reached. Please request a new code.', 400, 'MAX_ATTEMPTS_EXCEEDED');
    }

    const isValid = compareOtp(otp, challenge.otpHash);

    if (!isValid) {
      const updatedChallenge = await ChallengeModel.incrementAttempts(challengeId);
      const remainingAttempts = challenge.maxAttempts - updatedChallenge.attempts;

      if (remainingAttempts <= 0) {
        await ChallengeModel.markUsed(challengeId);
        throw new AppError('Maximum verification attempts reached. Please request a new code.', 400, 'MAX_ATTEMPTS_EXCEEDED', { remainingAttempts: 0 });
      }

      const error = new AppError(`Incorrect OTP code. You have ${remainingAttempts} attempt(s) left.`, 400, 'INVALID_OTP');
      error.remainingAttempts = remainingAttempts;
      throw error;
    }

    // OTP is valid - mark as used (single use rule)
    await ChallengeModel.markUsed(challengeId);

    return {
      verified: true,
      userId: challenge.userId,
      channel: challenge.channel
    };
  }
}

module.exports = OtpService;
