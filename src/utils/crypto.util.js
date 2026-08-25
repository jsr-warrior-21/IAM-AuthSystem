const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Hash password with bcrypt before storing
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Compare plain password against stored hash
const comparePassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

// Generate a cryptographically secure 6-digit numeric OTP
const generateOtp = () => {
  const otpInt = crypto.randomInt(100000, 1000000);
  return otpInt.toString();
};

// Create SHA-256 hash representation of OTP for secure server storage
const hashOtp = (otp) => {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
};

// Compare user input OTP against stored SHA-256 hash
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
