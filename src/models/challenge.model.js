const crypto = require('crypto');
const { OTP_TTL_SECONDS, OTP_MAX_ATTEMPTS } = require('../config/constants.config');

// In-memory data store for OTP challenges
const challenges = new Map();

class ChallengeModel {
  /**
   * Create an OTP Challenge record
   */
  static async create({ userId, channel, otpHash }) {
    const challengeId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000).toISOString();

    const challenge = {
      challengeId,
      userId,
      channel,
      otpHash,
      expiresAt,
      attempts: 0,
      maxAttempts: OTP_MAX_ATTEMPTS,
      used: false,
      createdAt: new Date().toISOString()
    };

    challenges.set(challengeId, challenge);
    return { ...challenge };
  }

  /**
   * Find challenge by challengeId
   */
  static async findById(challengeId) {
    const challenge = challenges.get(challengeId);
    return challenge ? { ...challenge } : null;
  }

  /**
   * Increment verification attempts counter
   */
  static async incrementAttempts(challengeId) {
    const challenge = challenges.get(challengeId);
    if (!challenge) return null;

    const updated = {
      ...challenge,
      attempts: challenge.attempts + 1
    };

    challenges.set(challengeId, updated);
    return { ...updated };
  }

  /**
   * Mark challenge as used / invalidated
   */
  static async markUsed(challengeId) {
    const challenge = challenges.get(challengeId);
    if (!challenge) return null;

    const updated = {
      ...challenge,
      used: true
    };

    challenges.set(challengeId, updated);
    return { ...updated };
  }

  /**
   * Clear all challenges (useful for testing)
   */
  static async clear() {
    challenges.clear();
  }
}

module.exports = ChallengeModel;
