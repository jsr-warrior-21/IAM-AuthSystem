const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

const comparePassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * Generate a 6-digit cryptographically secure OTP string
 */
const generateOtp = () => {
  const otpInt = crypto.randomInt(100000, 1000000);
  return otpInt.toString();
};

/**
 * Hash an OTP value using SHA-256 for protected storage
 */
const hashOtp = (otp) => {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
};

const compareOtp = (plainOtp, storedHash) => {
  const inputHash = hashOtp(plainOtp);
  return crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(storedHash));
};

module.exports = {
  hashPassword,
  comparePassword,
  generateOtp,
  hashOtp,
  compareOtp
};
