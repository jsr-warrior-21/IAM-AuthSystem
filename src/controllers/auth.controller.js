const AuthService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler.util');

/**
 * Handle initial registration POST /api/register
 */
const register = asyncHandler(async (req, res) => {
  const { fullName, email, phone, password } = req.body;

  const result = await AuthService.registerUser({
    fullName,
    email,
    phone,
    password
  });

  res.status(201).json({
    success: true,
    message: 'Registration initiated successfully. Email OTP code sent.',
    data: {
      userId: result.userId,
      email: result.email,
      challengeId: result.challengeId,
      expiresAt: result.expiresAt
    }
  });
});

/**
 * Handle initial login POST /api/login
 */
const login = asyncHandler(async (req, res) => {
  const { identifier, email, password } = req.body;
  const loginId = identifier || email;

  const result = await AuthService.loginUser({
    identifier: loginId,
    password
  });

  res.status(200).json({
    success: true,
    message: 'Credentials valid. MFA verification required.',
    data: {
      mfaRequired: result.mfaRequired,
      method: result.method,
      challengeId: result.challengeId,
      userId: result.userId
    }
  });
});

module.exports = {
  register,
  login
};
