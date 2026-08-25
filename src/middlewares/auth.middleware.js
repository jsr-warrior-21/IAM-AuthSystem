const TokenService = require('../services/token.service');
const UserModel = require('../models/user.model');
const AppError = require('../utils/appError.util');

/**
 * Middleware to enforce Session-based authentication
 */
const requireSession = async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      throw new AppError('Unauthorized access. Please log in first.', 401, 'UNAUTHORIZED');
    }

    const user = await UserModel.findById(req.session.userId);
    if (!user) {
      throw new AppError('User session is no longer valid.', 401, 'INVALID_SESSION');
    }

    // Attach user profile to request (excluding passwordHash)
    const { passwordHash, ...publicUser } = user;
    req.user = publicUser;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Middleware to enforce JWT Bearer Token authentication
 */
const requireJwt = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Unauthorized. Authorization header with Bearer token is required.', 401, 'MISSING_BEARER_TOKEN');
    }

    const token = authHeader.split(' ')[1];
    const decoded = TokenService.verifyToken(token);

    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      throw new AppError('User associated with token does not exist.', 401, 'INVALID_TOKEN_USER');
    }

    const { passwordHash, ...publicUser } = user;
    req.jwtUser = publicUser;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  requireSession,
  requireJwt
};
