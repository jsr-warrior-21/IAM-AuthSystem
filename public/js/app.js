// Application State Manager
const state = {
  currentScreen: 'login',
  viewMode: 'web', // 'web' or 'mobile'
  user: null,
  userId: null,
  email: null,
  phone: null,
  challengeId: null,
  mfaMethod: 'email',
  jwtToken: null,
  otpTimer: null,
  resendTimer: null,
  otpTimeLeft: 180, // 3 minutes
  resendCooldownLeft: 25 // 25 seconds
};

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
  initViewMode();
  initPasswordToggles();
  initOtpInputs();
  initTerminalLogger();
  checkExistingSession();
});

// View Mode Toggle (Web vs Mobile Frame)
function initViewMode() {
  const webBtn = document.getElementById('btnViewWeb');
  const mobileBtn = document.getElementById('btnViewMobile');
  const viewport = document.getElementById('appViewport');

  if (!webBtn || !mobileBtn || !viewport) return;

  webBtn.addEventListener('click', () => {
    state.viewMode = 'web';
    webBtn.classList.add('active');
    mobileBtn.classList.remove('active');
    viewport.className = 'app-viewport viewport-web';
  });

  mobileBtn.addEventListener('click', () => {
    state.viewMode = 'mobile';
    mobileBtn.classList.add('active');
    webBtn.classList.remove('active');
    viewport.className = 'app-viewport viewport-mobile';
  });
}

// Password Show/Hide Toggles
function initPasswordToggles() {
  document.querySelectorAll('.password-toggle-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const input = btn.previousElementSibling;
      if (input.type === 'password') {
        input.type = 'text';
        btn.innerHTML = `👁️‍🗨️`;
      } else {
        input.type = 'password';
        btn.innerHTML = `👁️`;
      }
    });
  });
}

// Screen Navigation Manager
function navigateTo(screenId) {
  state.currentScreen = screenId;
  document.querySelectorAll('.screen-view').forEach(screen => {
    screen.classList.remove('active');
  });

  const targetScreen = document.getElementById(`screen-${screenId}`);
  if (targetScreen) {
    targetScreen.classList.add('active');
  }

  // Clear any existing alerts
  clearAlerts();
}

// Clear Alert Messages
function clearAlerts() {
  document.querySelectorAll('.alert').forEach(alert => {
    alert.style.display = 'none';
    alert.innerText = '';
  });
}

// Show Specific Alert Message
function showAlert(alertId, message, type = 'danger') {
  const alertEl = document.getElementById(alertId);
  if (alertEl) {
    alertEl.innerText = message;
    alertEl.className = `alert alert-${type}`;
    alertEl.style.display = 'flex';
  }
}

// 6-Digit OTP Box Management (Auto-Tab, Backspace, Paste)
function initOtpInputs() {
  document.querySelectorAll('.otp-container').forEach(container => {
    const inputs = Array.from(container.querySelectorAll('.otp-box'));

    inputs.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        const value = e.target.value;
        // Keep only numbers
        e.target.value = value.replace(/[^0-9]/g, '');

        if (e.target.value && index < inputs.length - 1) {
          inputs[index + 1].focus();
        }
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !input.value && index > 0) {
          inputs[index - 1].focus();
        }
      });

      input.addEventListener('paste', (e) => {
        e.preventDefault();
        const pasted = (e.clipboardData || window.clipboardData).getData('text').trim();
        if (/^\d{6}$/.test(pasted)) {
          pasted.split('').forEach((char, i) => {
            if (inputs[i]) inputs[i].value = char;
          });
          inputs[inputs.length - 1].focus();
        }
      });
    });
  });
}

// Extract OTP string from PIN inputs
function getOtpValue(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return '';
  const inputs = Array.from(container.querySelectorAll('.otp-box'));
  return inputs.map(input => input.value).join('');
}

// Reset PIN inputs
function clearOtpInputs(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const inputs = Array.from(container.querySelectorAll('.otp-box'));
  inputs.forEach(input => {
    input.value = '';
    input.classList.remove('error');
    input.disabled = false;
  });
  if (inputs[0]) inputs[0].focus();
}

// Highlight OTP Inputs with Red Error State
function setErrorOtpInputs(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const inputs = Array.from(container.querySelectorAll('.otp-box'));
  inputs.forEach(input => {
    input.classList.add('error');
  });
}

// Disable OTP inputs (e.g. Expired state)
function disableOtpInputs(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const inputs = Array.from(container.querySelectorAll('.otp-box'));
  inputs.forEach(input => {
    input.disabled = true;
  });
}

// Timers for OTP Expiry & Resend Cooldown
function startOtpTimers(prefix, onExpired) {
  clearInterval(state.otpTimer);
  clearInterval(state.resendTimer);

  state.otpTimeLeft = 180; // 3 minutes
  state.resendCooldownLeft = 25; // 25 seconds

  const expiryEl = document.getElementById(`${prefix}-expiry-timer`);
  const resendBtn = document.getElementById(`${prefix}-resend-btn`);

  if (resendBtn) resendBtn.disabled = true;

  // Expiry Timer (3 mins)
  state.otpTimer = setInterval(() => {
    state.otpTimeLeft--;
    if (expiryEl) {
      const mins = String(Math.floor(state.otpTimeLeft / 60)).padStart(2, '0');
      const secs = String(state.otpTimeLeft % 60).padStart(2, '0');
      expiryEl.innerText = `${mins}:${secs}`;
    }

    if (state.otpTimeLeft <= 0) {
      clearInterval(state.otpTimer);
      if (onExpired) onExpired();
    }
  }, 1000);

  // Resend Cooldown Timer (25s)
  state.resendTimer = setInterval(() => {
    state.resendCooldownLeft--;
    if (resendBtn) {
      if (state.resendCooldownLeft > 0) {
        resendBtn.innerText = `Resend code (00:${String(state.resendCooldownLeft).padStart(2, '0')})`;
        resendBtn.disabled = true;
      } else {
        resendBtn.innerText = `Resend code`;
        resendBtn.disabled = false;
        clearInterval(state.resendTimer);
      }
    }
  }, 1000);
}

// Terminal Logger Polling (fetches simulated backend console output)
function initTerminalLogger() {
  const fetchLogs = async () => {
    try {
      const res = await ApiClient.getLogs();
      const logs = res.data?.logs || [];
      const terminalEl = document.getElementById('terminalConsole');
      if (terminalEl && logs.length > 0) {
        terminalEl.innerText = logs.map(l => l.formattedText).join('\n\n---\n\n');
      }
    } catch (err) {
      // Silent fail
    }
  };

  fetchLogs();
  setInterval(fetchLogs, 3000); // Poll every 3s
}

// Check Existing Active Session
async function checkExistingSession() {
  try {
    const res = await ApiClient.getMe();
    if (res.data?.user) {
      state.user = res.data.user;
      renderDashboard();
      navigateTo('dashboard');
    }
  } catch (err) {
    // User not authenticated - remain on login screen
    navigateTo('login');
  }
}

// ==========================================
// FORM SUBMISSION HANDLERS
// ==========================================

// 1. LOGIN FORM SUBMISSION
async function handleLogin(e) {
  e.preventDefault();
  clearAlerts();

  const identifier = document.getElementById('loginIdentifier').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!identifier || !password) {
    showAlert('loginAlert', 'Please enter your email/username and password.', 'danger');
    return;
  }

  try {
    const res = await ApiClient.login({ identifier, password });
    
    if (res.data.mfaRequired) {
      state.challengeId = res.data.challengeId;
      state.userId = res.data.userId;
      state.email = identifier.includes('@') ? identifier : 'priya.sharma@email.com';
      state.mfaMethod = res.data.method;

      // Show Choose Method or direct Email OTP screen
      document.getElementById('emailOtpRecipient').innerText = state.email;
      navigateTo('email-otp');
      startOtpTimers('email', () => {
        showAlert('emailOtpAlert', 'Code expired. Please click resend to get a new code.', 'danger');
        disableOtpInputs('emailOtpContainer');
      });
    }
  } catch (err) {
    document.getElementById('loginIdentifier').classList.add('error');
    document.getElementById('loginPassword').classList.add('error');
    showAlert('loginAlert', err.message || 'Invalid email or password. Please try again.', 'danger');
  }
}

// 2. REGISTRATION FORM SUBMISSION
async function handleRegister(e) {
  e.preventDefault();
  clearAlerts();

  const fullName = document.getElementById('regFullName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const password = document.getElementById('regPassword').value;

  if (!fullName || !email || !password) {
    showAlert('registerAlert', 'Please fill in all required fields.', 'danger');
    return;
  }

  try {
    const res = await ApiClient.register({ fullName, email, phone, password });

    state.userId = res.data.userId;
    state.email = email;
    state.phone = phone || '+91 98765 43210';
    state.challengeId = res.data.challengeId;

    document.getElementById('emailOtpRecipient').innerText = email;
    navigateTo('email-otp');
    startOtpTimers('email', () => {
      showAlert('emailOtpAlert', 'Code expired. Please click resend to get a new code.', 'danger');
      disableOtpInputs('emailOtpContainer');
    });
  } catch (err) {
    showAlert('registerAlert', err.message || 'Registration failed. Please check your details.', 'danger');
  }
}

// 3. VERIFY EMAIL OTP
async function handleVerifyEmailOtp() {
  clearAlerts();
  const otp = getOtpValue('emailOtpContainer');

  if (otp.length < 6) {
    showAlert('emailOtpAlert', 'Please enter the complete 6-digit OTP code.', 'danger');
    return;
  }

  try {
    const res = await ApiClient.verifyEmailOtp(state.challengeId, otp);

    // Prompt for SMS Verification next
    const smsRes = await ApiClient.sendSmsOtp(state.userId);
    state.challengeId = smsRes.data.challengeId;

    document.getElementById('smsOtpRecipient').innerText = state.phone;
    clearOtpInputs('smsOtpContainer');
    navigateTo('sms-otp');
    startOtpTimers('sms', () => {
      showAlert('smsOtpAlert', 'SMS Code expired. Click resend code.', 'danger');
      disableOtpInputs('smsOtpContainer');
    });
  } catch (err) {
    setErrorOtpInputs('emailOtpContainer');
    if (err.remainingAttempts !== undefined) {
      showAlert('emailOtpAlert', `Incorrect code. Please try again. You have ${err.remainingAttempts} attempt(s) left.`, 'danger');
    } else {
      showAlert('emailOtpAlert', err.message || 'Incorrect OTP code.', 'danger');
    }
  }
}

// 4. RESEND EMAIL OTP
async function handleResendEmailOtp() {
  try {
    const res = await ApiClient.sendEmailOtp(state.userId);
    state.challengeId = res.data.challengeId;
    clearOtpInputs('emailOtpContainer');
    clearAlerts();
    showAlert('emailOtpAlert', 'A new 6-digit email OTP has been sent!', 'success');
    startOtpTimers('email', () => {
      showAlert('emailOtpAlert', 'Code expired. Please click resend to get a new code.', 'danger');
      disableOtpInputs('emailOtpContainer');
    });
  } catch (err) {
    showAlert('emailOtpAlert', err.message || 'Could not resend OTP.', 'danger');
  }
}

// 5. VERIFY SMS OTP
async function handleVerifySmsOtp() {
  clearAlerts();
  const otp = getOtpValue('smsOtpContainer');

  if (otp.length < 6) {
    showAlert('smsOtpAlert', 'Please enter the complete 6-digit OTP code.', 'danger');
    return;
  }

  try {
    // Check if verifying registration or login
    if (state.currentScreen === 'sms-otp' && state.user === null) {
      const res = await ApiClient.verifySmsOtp(state.challengeId, otp);
      state.user = res.data.user;
      navigateTo('registration-success');
    } else {
      const res = await ApiClient.verifyLoginOtp(state.challengeId, otp);
      state.user = res.data.user;
      renderDashboard();
      navigateTo('dashboard');
    }
  } catch (err) {
    setErrorOtpInputs('smsOtpContainer');
    if (err.code === 'MAX_ATTEMPTS_EXCEEDED') {
      navigateTo('sms-max-attempts');
    } else if (err.remainingAttempts !== undefined) {
      showAlert('smsOtpAlert', `Incorrect code. Please try again. You have ${err.remainingAttempts} attempt(s) left.`, 'danger');
    } else {
      showAlert('smsOtpAlert', err.message || 'Incorrect SMS OTP code.', 'danger');
    }
  }
}

// 6. RESEND SMS OTP
async function handleResendSmsOtp() {
  try {
    const res = await ApiClient.sendSmsOtp(state.userId);
    state.challengeId = res.data.challengeId;
    clearOtpInputs('smsOtpContainer');
    clearAlerts();
    showAlert('smsOtpAlert', 'A new 6-digit SMS OTP has been sent!', 'success');
    startOtpTimers('sms', () => {
      showAlert('smsOtpAlert', 'Code expired. Click resend code.', 'danger');
      disableOtpInputs('smsOtpContainer');
    });
  } catch (err) {
    showAlert('smsOtpAlert', err.message || 'Could not resend SMS OTP.', 'danger');
  }
}

// 7. DASHBOARD RENDERING & JWT ACTIONS
function renderDashboard() {
  if (!state.user) return;
  document.getElementById('dashUserName').innerText = state.user.fullName || 'User';
  document.getElementById('dashEmail').innerText = state.user.email || '';
  document.getElementById('dashPhone').innerText = state.user.phone || 'N/A';
  document.getElementById('dashMfaStatus').innerText = state.user.mfaEnabled ? 'ENABLED (SMS + Email)' : 'DISABLED';
}

// Issue JWT Token (`POST /api/token`)
async function handleIssueJwt() {
  try {
    const res = await ApiClient.issueToken(state.user.id);
    state.jwtToken = res.data.token;
    document.getElementById('jwtOutput').innerText = JSON.stringify(res.data, null, 2);
    document.getElementById('btnTestProtected').disabled = false;
  } catch (err) {
    alert(err.message || 'Failed to issue JWT token.');
  }
}

// Test Protected Resource (`GET /api/protected` with Bearer JWT)
async function handleTestProtectedJwt() {
  if (!state.jwtToken) return;
  try {
    const res = await ApiClient.getProtected(state.jwtToken);
    document.getElementById('protectedOutput').innerText = JSON.stringify(res.data, null, 2);
  } catch (err) {
    alert(err.message || 'Failed to fetch protected resource.');
  }
}

// LOGOUT HANDLER
async function handleLogout() {
  try {
    await ApiClient.logout();
    state.user = null;
    state.jwtToken = null;
    navigateTo('login');
  } catch (err) {
    alert('Error logging out');
  }
}
