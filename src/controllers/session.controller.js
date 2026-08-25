const TokenService = require('../services/token.service');
const NotificationService = require('../services/notification.service');
const UserModel = require('../models/user.model');
const asyncHandler = require('../utils/asyncHandler.util');
const AppError = require('../utils/appError.util');

/**
 * GET /api/me - Return authenticated user details from session
 */
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user,
      authenticatedVia: 'Session Cookie'
    }
  });
});

/**
 * POST /api/logout - Invalidate server-side session
 */
const logout = asyncHandler(async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      throw new AppError('Could not log out. Please try again.', 500, 'LOGOUT_FAILED');
    }
    res.clearCookie('iam_session_id');
    res.status(200).json({
      success: true,
      message: 'Logged out successfully. Session destroyed.'
    });
  });
});

/**
 * POST /api/token - Issue short-lived JWT token
 */
const issueToken = asyncHandler(async (req, res) => {
  let userId;

  if (req.session && req.session.userId) {
    userId = req.session.userId;
  } else if (req.body.userId) {
    userId = req.body.userId;
  } else {
    throw new AppError('Authenticated session or User ID is required to issue a JWT token.', 401, 'UNAUTHORIZED');
  }

  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  }

  const token = TokenService.generateToken({
    userId: user.id,
    email: user.email,
    role: 'user'
  });

  res.status(200).json({
    success: true,
    message: 'JWT Token issued successfully.',
    data: {
      token,
      tokenType: 'Bearer',
      expiresIn: '15m'
    }
  });
});

/**
 * GET /api/protected - Protected endpoint requiring JWT Bearer token
 */
const getProtected = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Access granted to protected endpoint!',
    data: {
      secretData: 'Enterprise IAM Vault Access Granted: Confidential Key 0x98F1A7',
      authenticatedJwtUser: req.jwtUser,
      timestamp: new Date().toISOString()
    }
  });
});

/**
 * GET /api/logs - Fetch simulated email/SMS console log buffer for UI
 */
const getLogs = asyncHandler(async (req, res) => {
  const logs = NotificationService.getLogs();
  res.status(200).json({
    success: true,
    data: { logs }
  });
});

module.exports = {
  getMe,
  logout,
  issueToken,
  getProtected,
  getLogs
};
