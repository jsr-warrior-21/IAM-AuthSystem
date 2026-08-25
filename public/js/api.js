const API_BASE = '/api';

class ApiClient {
  static async request(endpoint, options = {}) {
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      credentials: 'include', // Ensures express-session cookies are sent & stored
      ...options
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.error?.message || 'API Request Failed');
        error.status = response.status;
        error.code = data.error?.code;
        error.remainingAttempts = data.error?.remainingAttempts;
        throw error;
      }

      return data;
    } catch (err) {
      console.error(`[API Error] ${endpoint}:`, err);
      throw err;
    }
  }

  // API Methods
  static register(userData) {
    return this.request('/register', { method: 'POST', body: userData });
  }

  static login(credentials) {
    return this.request('/login', { method: 'POST', body: credentials });
  }

  static sendEmailOtp(userId) {
    return this.request('/send-email-otp', { method: 'POST', body: { userId } });
  }

  static verifyEmailOtp(challengeId, otp) {
    return this.request('/verify-email-otp', { method: 'POST', body: { challengeId, otp } });
  }

  static sendSmsOtp(userId) {
    return this.request('/send-sms-otp', { method: 'POST', body: { userId } });
  }

  static verifySmsOtp(challengeId, otp) {
    return this.request('/verify-sms-otp', { method: 'POST', body: { challengeId, otp } });
  }

  static verifyLoginOtp(challengeId, otp) {
    return this.request('/verify-login-otp', { method: 'POST', body: { challengeId, otp } });
  }

  static getMe() {
    return this.request('/me', { method: 'GET' });
  }

  static logout() {
    return this.request('/logout', { method: 'POST' });
  }

  static issueToken(userId) {
    return this.request('/token', { method: 'POST', body: { userId } });
  }

  static getProtected(token) {
    return this.request('/protected', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  static getLogs() {
    return this.request('/logs', { method: 'GET' });
  }
}
