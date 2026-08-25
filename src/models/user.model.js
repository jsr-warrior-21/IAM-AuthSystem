const crypto = require('crypto');
const { MAX_FAILED_LOGIN_ATTEMPTS, LOCKOUT_DURATION_MINUTES } = require('../config/constants.config');

// In-memory store holding active and pending user records
const users = new Map();

class UserModel {
  // Save new user profile during registration
  static async create(userData) {
    const userId = crypto.randomUUID();
    const newUser = {
      id: userId,
      fullName: userData.fullName,
      email: userData.email.toLowerCase().trim(),
      phone: userData.phone ? userData.phone.trim() : '',
      passwordHash: userData.passwordHash,
      mfaEnabled: false,
      mfaMethod: 'email',
      status: 'PENDING_EMAIL_VERIFICATION',
      failedLoginAttempts: 0,
      lockoutUntil: null,
      createdAt: new Date().toISOString()
    };

    users.set(userId, newUser);
    return { ...newUser };
  }

  // Retrieve user profile by user ID
  static async findById(id) {
    const user = users.get(id);
    return user ? { ...user } : null;
  }

  // Find user by either email or phone number
  static async findByEmailOrPhone(identifier) {
    const cleanId = identifier.toLowerCase().trim();
    for (const user of users.values()) {
      if (user.email === cleanId || user.phone === cleanId) {
        return { ...user };
      }
    }
    return null;
  }

  // Find user specifically by email
  static async findByEmail(email) {
    const cleanEmail = email.toLowerCase().trim();
    for (const user of users.values()) {
      if (user.email === cleanEmail) {
        return { ...user };
      }
    }
    return null;
  }

  // Update specific fields on user record
  static async update(id, updates) {
    const user = users.get(id);
    if (!user) return null;

    const updatedUser = { ...user, ...updates };
    users.set(id, updatedUser);
    return { ...updatedUser };
  }

  // Track bad password attempts and apply temporary lockout if limit reached
  static async recordFailedLogin(id) {
    const user = users.get(id);
    if (!user) return null;

    const attempts = user.failedLoginAttempts + 1;
    let lockoutUntil = user.lockoutUntil;

    if (attempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
      lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000).toISOString();
    }

    const updatedUser = {
      ...user,
      failedLoginAttempts: attempts,
      lockoutUntil
    };

    users.set(id, updatedUser);
    return { ...updatedUser };
  }

  // Clear failed attempt counters after successful authentication
  static async resetFailedLogin(id) {
    const user = users.get(id);
    if (!user) return null;

    const updatedUser = {
      ...user,
      failedLoginAttempts: 0,
      lockoutUntil: null
    };

    users.set(id, updatedUser);
    return { ...updatedUser };
  }

  // Reset store for integration tests
  static async clear() {
    users.clear();
  }
}

module.exports = UserModel;
