// Frontend state tracking user session, OTP timers, and UI mode
const state = {
  currentScreen: 'login-default',
  viewMode: 'web',
  user: null,
  userId: null,
  email: 'priya.sharma@email.com',
  phone: '+919876543210',
  challengeId: null,
  mfaMethod: 'email',
  jwtToken: null,
  otpTimer: null,
  resendTimer: null,
  otpTimeLeft: 180,
  resendCooldownLeft: 25
};

// Initialize UI listeners and session check on page load
document.addEventListener('DOMContentLoaded', () => {
  initViewControls();
  initScreenPicker();
  initPasswordToggles();
  initOtpInputs();
  initTerminalLogger();
  checkExistingSession();
});

// Viewport mode switcher (Web view vs Mobile frame mockup)
function initViewControls() {
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

// Quick screen picker dropdown to test any screen state from mockups
function initScreenPicker() {
  const picker = document.getElementById('screenPickerSelect');
  if (!picker) return;

  picker.addEventListener('change', (e) => {
    const targetScreen = e.target.value;
    navigateTo(targetScreen);
  });
}

// Password input eye toggle button
function initPasswordToggles() {
  document.querySelectorAll('.input-icon-right').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const input = btn.previousElementSibling;
      if (input && (input.type === 'password' || input.type === 'text')) {
        if (input.type === 'password') {
          input.type = 'text';
          btn.innerHTML = `👁️‍🗨️`;
        } else {
          input.type = 'password';
          btn.innerHTML = `👁️`;
        }
      }
    });
  });
}

// Screen navigation helper
function navigateTo(screenId) {
  state.currentScreen = screenId;

  // Sync dropdown selector
  const picker = document.getElementById('screenPickerSelect');
  if (picker) picker.value = screenId;

  document.querySelectorAll('.screen-view').forEach(screen => {
    screen.classList.remove('active');
  });

  const target = document.getElementById(`screen-${screenId}`);
  if (target) {
    target.classList.add('active');
  }

  clearAlerts();
}

// Hide alert boxes
function clearAlerts() {
  document.querySelectorAll('.alert-box').forEach(box => {
    box.style.display = 'none';
    box.innerText = '';
  });
}

// Show contextual error or success alert box
function showAlert(boxId, message, type = 'danger') {
  const alertEl = document.getElementById(boxId);
  if (alertEl) {
    alertEl.innerText = message;
    alertEl.className = `alert-box ${type}`;
    alertEl.style.display = 'flex';
  }
}

// Manage 6-digit OTP input boxes (auto-focusing and pasting)
function initOtpInputs() {
  document.querySelectorAll('.otp-pin-group').forEach(group => {
    const boxes = Array.from(group.querySelectorAll('.otp-digit-box'));

    boxes.forEach((box, idx) => {
      box.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
        if (e.target.value && idx < boxes.length - 1) {
          boxes[idx + 1].focus();
        }
      });

      box.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !box.value && idx > 0) {
          boxes[idx - 1].focus();
        }
      });

      box.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text').trim();
        if (/^\d{6}$/.test(text)) {
          text.split('').forEach((char, i) => {
            if (boxes[i]) boxes[i].value = char;
          });
          boxes[boxes.length - 1].focus();
        }
      });
    });
  });
}

// Get 6-digit string from PIN boxes
function getOtpCode(groupId) {
  const group = document.getElementById(groupId);
  if (!group) return '';
  const boxes = Array.from(group.querySelectorAll('.otp-digit-box'));
  return boxes.map(b => b.value).join('');
}

// Reset PIN boxes
function clearOtpBoxes(groupId) {
  const group = document.getElementById(groupId);
  if (!group) return;
  const boxes = Array.from(group.querySelectorAll('.otp-digit-box'));
  boxes.forEach(b => {
    b.value = '';
    b.classList.remove('error');
    b.disabled = false;
  });
  if (boxes[0]) boxes[0].focus();
}

// Highlight OTP boxes in red
function setErrorOtpBoxes(groupId) {
  const group = document.getElementById(groupId);
  if (!group) return;
  const boxes = Array.from(group.querySelectorAll('.otp-digit-box'));
  boxes.forEach(b => b.classList.add('error'));
}

// Disable OTP boxes
function disableOtpBoxes(groupId) {
  const group = document.getElementById(groupId);
  if (!group) return;
  const boxes = Array.from(group.querySelectorAll('.otp-digit-box'));
  boxes.forEach(b => b.disabled = true);
}

// Start 3-minute expiry countdown and 25-second resend cooldown timers
function startOtpTimers(prefix) {
  clearInterval(state.otpTimer);
  clearInterval(state.resendTimer);

  state.otpTimeLeft = 180;
  state.resendCooldownLeft = 25;

  const expiryEl = document.getElementById(`${prefix}-expiry-timer`);
  const resendBtn = document.getElementById(`${prefix}-resend-btn`);

  if (resendBtn) resendBtn.disabled = true;

  state.otpTimer = setInterval(() => {
    state.otpTimeLeft--;
    if (expiryEl) {
      const m = String(Math.floor(state.otpTimeLeft / 60)).padStart(2, '0');
      const s = String(state.otpTimeLeft % 60).padStart(2, '0');
      expiryEl.innerText = `${m}:${s}`;
    }

    if (state.otpTimeLeft <= 0) {
      clearInterval(state.otpTimer);
      disableOtpBoxes(`${prefix}OtpGroup`);
    }
  }, 1000);

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

// Poll server for simulated console outputs (prints email & SMS codes in UI terminal box)
function initTerminalLogger() {
  const pollLogs = async () => {
    try {
      const res = await ApiClient.getLogs();
      const logs = res.data?.logs || [];
      const termEl = document.getElementById('terminalBox');
      if (termEl && logs.length > 0) {
        termEl.innerText = logs.map(l => l.formattedText).join('\n\n--------------------\n\n');
      }
    } catch (e) {
      // Ignore background poll errors
    }
  };

  pollLogs();
  setInterval(pollLogs, 3000);
}

// Check if user has an existing valid session cookie
async function checkExistingSession() {
  try {
    const res = await ApiClient.getMe();
    if (res.data?.user) {
      state.user = res.data.user;
      renderDashboard();
      navigateTo('dashboard');
    }
  } catch (e) {
    navigateTo('login-default');
  }
}

// ==========================================
// FORM ACTIONS & API CALLS
// ==========================================

// Handle Login Form Submit
async function handleLoginSubmit(e) {
  e.preventDefault();
  clearAlerts();

  const identifier = document.getElementById('loginEmailInput').value.trim();
  const password = document.getElementById('loginPasswordInput').value;

  if (!identifier || !password) {
    showAlert('loginAlert', 'Please enter email/username and password.', 'danger');
    return;
  }

  try {
    const res = await ApiClient.login({ identifier, password });

    if (res.data.mfaRequired) {
      state.challengeId = res.data.challengeId;
      state.userId = res.data.userId;
      state.email = identifier.includes('@') ? identifier : 'priya.sharma@email.com';
      state.mfaMethod = res.data.method;

      document.getElementById('emailOtpTarget').innerText = state.email;
      navigateTo('email-otp');
      startOtpTimers('email');
    }
  } catch (err) {
    // Show error state on inputs matching reference mockup
    document.getElementById('loginEmailInput').classList.add('input-error');
    document.getElementById('loginPasswordInput').classList.add('input-error');
    showAlert('loginAlert', err.message || 'Invalid email or password. Please try again.', 'danger');
  }
}

// Handle Registration Form Submit
async function handleRegisterSubmit(e) {
  e.preventDefault();
  clearAlerts();

  const fullName = document.getElementById('regNameInput').value.trim();
  const email = document.getElementById('regEmailInput').value.trim();
  const phone = document.getElementById('regPhoneInput').value.trim();
  const password = document.getElementById('regPasswordInput').value;

  try {
    const res = await ApiClient.register({ fullName, email, phone, password });

    state.userId = res.data.userId;
    state.email = email;
    state.phone = phone || '+91 98765 43210';
    state.challengeId = res.data.challengeId;

    document.getElementById('emailOtpTarget').innerText = email;
    navigateTo('email-otp');
    startOtpTimers('email');
  } catch (err) {
    showAlert('registerAlert', err.message || 'Registration failed. Check details.', 'danger');
  }
}

// Handle Verify Email OTP Code
async function handleVerifyEmailOtp() {
  clearAlerts();
  const otp = getOtpCode('emailOtpGroup');

  if (otp.length < 6) {
    showAlert('emailOtpAlert', 'Please enter all 6 digits of the OTP code.', 'danger');
    return;
  }

  try {
    const res = await ApiClient.verifyEmailOtp(state.challengeId, otp);

    // Request SMS OTP next
    const smsRes = await ApiClient.sendSmsOtp(state.userId);
    state.challengeId = smsRes.data.challengeId;

    document.getElementById('smsOtpTarget').innerText = state.phone;
    clearOtpBoxes('smsOtpGroup');
    navigateTo('sms-otp');
    startOtpTimers('sms');
  } catch (err) {
    setErrorOtpBoxes('emailOtpGroup');
    if (err.remainingAttempts !== undefined) {
      showAlert('emailOtpAlert', `Incorrect code. Please try again. You have ${err.remainingAttempts} attempts left.`, 'danger');
    } else {
      showAlert('emailOtpAlert', err.message || 'Incorrect OTP code.', 'danger');
    }
  }
}

// Handle Resend Email OTP Code
async function handleResendEmailOtp() {
  try {
    const res = await ApiClient.sendEmailOtp(state.userId);
    state.challengeId = res.data.challengeId;
    clearOtpBoxes('emailOtpGroup');
    clearAlerts();
    showAlert('emailOtpAlert', 'New 6-digit email OTP sent!', 'success');
    startOtpTimers('email');
  } catch (err) {
    showAlert('emailOtpAlert', err.message || 'Could not resend OTP.', 'danger');
  }
}

// Handle Verify SMS OTP Code
async function handleVerifySmsOtp() {
  clearAlerts();
  const otp = getOtpCode('smsOtpGroup');

  if (otp.length < 6) {
    showAlert('smsOtpAlert', 'Please enter all 6 digits of the SMS code.', 'danger');
    return;
  }

  try {
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
    setErrorOtpBoxes('smsOtpGroup');
    if (err.code === 'MAX_ATTEMPTS_EXCEEDED') {
      navigateTo('sms-max-attempts');
    } else if (err.remainingAttempts !== undefined) {
      showAlert('smsOtpAlert', `Incorrect code. Please try again. You have ${err.remainingAttempts} attempts left.`, 'danger');
    } else {
      showAlert('smsOtpAlert', err.message || 'Incorrect SMS OTP code.', 'danger');
    }
  }
}

// Handle Resend SMS OTP Code
async function handleResendSmsOtp() {
  try {
    const res = await ApiClient.sendSmsOtp(state.userId);
    state.challengeId = res.data.challengeId;
    clearOtpBoxes('smsOtpGroup');
    clearAlerts();
    showAlert('smsOtpAlert', 'New 6-digit SMS OTP sent!', 'success');
    startOtpTimers('sms');
  } catch (err) {
    showAlert('smsOtpAlert', err.message || 'Could not resend SMS OTP.', 'danger');
  }
}

// Render authenticated user dashboard
function renderDashboard() {
  if (!state.user) return;
  document.getElementById('dashUserName').innerText = state.user.fullName || 'User';
  document.getElementById('dashEmail').innerText = state.user.email || '';
  document.getElementById('dashPhone').innerText = state.user.phone || 'N/A';
}

// Issue JWT Token
async function handleIssueJwtToken() {
  try {
    const res = await ApiClient.issueToken(state.user.id);
    state.jwtToken = res.data.token;
    document.getElementById('jwtOutput').innerText = JSON.stringify(res.data, null, 2);
    document.getElementById('btnTestProtected').disabled = false;
  } catch (err) {
    alert(err.message || 'Failed to issue JWT token.');
  }
}

// Call Protected API using JWT Bearer Token
async function handleCallProtectedJwt() {
  if (!state.jwtToken) return;
  try {
    const res = await ApiClient.getProtected(state.jwtToken);
    document.getElementById('protectedOutput').innerText = JSON.stringify(res.data, null, 2);
  } catch (err) {
    alert(err.message || 'Failed to access protected resource.');
  }
}

// Destroy session cookie and logout
async function handleLogout() {
  try {
    await ApiClient.logout();
    state.user = null;
    state.jwtToken = null;
    navigateTo('login-default');
  } catch (err) {
    alert('Error logging out');
  }
}
