// Buffer to store recent notifications for terminal viewer in frontend UI
const notificationLogs = [];

class NotificationService {
  /**
   * Send simulated Email OTP
   */
  static async sendEmailOtp(toEmail, otp) {
    const logMessage = `[SIMULATED EMAIL]\nTo: ${toEmail}\nOTP: ${otp}\nTimestamp: ${new Date().toISOString()}`;
    
    // Print to Node.js server console as per requirements
    console.log('\n----------------------------------------');
    console.log(logMessage);
    console.log('----------------------------------------\n');

    notificationLogs.unshift({
      id: Date.now().toString(),
      type: 'EMAIL',
      to: toEmail,
      otp,
      formattedText: logMessage,
      timestamp: new Date().toISOString()
    });

    if (notificationLogs.length > 50) {
      notificationLogs.pop();
    }

    return true;
  }

  /**
   * Send simulated SMS OTP
   */
  static async sendSmsOtp(toPhone, otp) {
    const logMessage = `[SIMULATED SMS]\nTo: ${toPhone}\nOTP: ${otp}\nTimestamp: ${new Date().toISOString()}`;

    // Print to Node.js server console as per requirements
    console.log('\n----------------------------------------');
    console.log(logMessage);
    console.log('----------------------------------------\n');

    notificationLogs.unshift({
      id: Date.now().toString(),
      type: 'SMS',
      to: toPhone,
      otp,
      formattedText: logMessage,
      timestamp: new Date().toISOString()
    });

    if (notificationLogs.length > 50) {
      notificationLogs.pop();
    }

    return true;
  }

  /**
   * Get latest notification logs for terminal viewer
   */
  static getLogs() {
    return [...notificationLogs];
  }
}

module.exports = NotificationService;
