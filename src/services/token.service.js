const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/constants.config');
const AppError = require('../utils/appError.util');

class TokenService {
  /**
   * Generate JWT token for authenticated user
   */
  static generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  /**
   * Verify and decode JWT token
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError('JWT token has expired', 401, 'TOKEN_EXPIRED');
      }
      throw new AppError('Invalid JWT token', 401, 'INVALID_TOKEN');
    }
  }
}

module.exports = TokenService;
