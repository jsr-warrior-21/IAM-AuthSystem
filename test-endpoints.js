const http = require('http');
const app = require('./server');
const { PORT } = require('./src/config/constants.config');

const BASE_URL = `http://localhost:${PORT}/api`;

let cookieHeader = '';
let userId = '';
let challengeId = '';
let emailOtp = '';
let smsOtp = '';
let jwtToken = '';

const makeRequest = (method, path, data = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };

    if (cookieHeader) {
      reqHeaders['Cookie'] = cookieHeader;
    }

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: reqHeaders
    };

    const req = http.request(options, (res) => {
      let body = '';

      const setCookie = res.headers['set-cookie'];
      if (setCookie) {
        cookieHeader = setCookie.map(c => c.split(';')[0]).join('; ');
      }

      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, body, headers: res.headers });
        }
      });
    });

    req.on('error', (err) => reject(err));

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
};

async function runTests() {
  console.log('\n==================================================');
  console.log(' RUNNING IAM AUTH & MFA ENDPOINT INTEGRATION TESTS');
  console.log('==================================================\n');

  try {
    const uniqueId = Date.now();
    const testEmail = `student.${uniqueId}@example.com`;
    const testPhone = `+91${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    // 1. Test Registration
    console.log('[1/10] Testing POST /api/register...');
    const regRes = await makeRequest('POST', '/register', {
      fullName: 'Priya Sharma',
      email: testEmail,
      phone: testPhone,
      password: 'Password@123'
    });
    console.log('Status:', regRes.status);
    console.log('Response:', regRes.data);
    if (regRes.status !== 201) throw new Error('Registration failed');
    userId = regRes.data.data.userId;
    challengeId = regRes.data.data.challengeId;

    // 2. Fetch Simulated Console Logs
    console.log('\n[2/10] Fetching Simulated Console Logs...');
    const logsRes = await makeRequest('GET', '/logs');
    console.log('Logs count:', logsRes.data.data.logs.length);
    emailOtp = logsRes.data.data.logs[0].otp;
    console.log('Retrieved Email OTP from console logs:', emailOtp);

    // 3. Test Verify Email OTP
    console.log('\n[3/10] Testing POST /api/verify-email-otp...');
    const emailVerifyRes = await makeRequest('POST', '/verify-email-otp', {
      challengeId,
      otp: emailOtp
    });
    console.log('Status:', emailVerifyRes.status);
    console.log('Response:', emailVerifyRes.data);
    if (emailVerifyRes.status !== 200) throw new Error('Email OTP verification failed');

    // 4. Test Send SMS OTP
    console.log('\n[4/10] Testing POST /api/send-sms-otp...');
    const smsSendRes = await makeRequest('POST', '/send-sms-otp', { userId });
    console.log('Status:', smsSendRes.status);
    console.log('Response:', smsSendRes.data);
    challengeId = smsSendRes.data.data.challengeId;

    // 5. Fetch SMS OTP from logs
    const smsLogsRes = await makeRequest('GET', '/logs');
    smsOtp = smsLogsRes.data.data.logs[0].otp;
    console.log('Retrieved SMS OTP from console logs:', smsOtp);

    // 6. Test Verify SMS OTP
    console.log('\n[5/10] Testing POST /api/verify-sms-otp...');
    const smsVerifyRes = await makeRequest('POST', '/verify-sms-otp', {
      challengeId,
      otp: smsOtp
    });
    console.log('Status:', smsVerifyRes.status);
    console.log('Response:', smsVerifyRes.data);
    if (smsVerifyRes.status !== 200) throw new Error('SMS OTP verification failed');

    // 7. Test Login
    console.log('\n[6/10] Testing POST /api/login...');
    const loginRes = await makeRequest('POST', '/login', {
      identifier: testEmail,
      password: 'Password@123'
    });
    console.log('Status:', loginRes.status);
    console.log('Response:', loginRes.data);
    if (loginRes.status !== 200) throw new Error('Login failed');
    challengeId = loginRes.data.data.challengeId;

    // 8. Fetch Login MFA OTP
    const loginMfaLogs = await makeRequest('GET', '/logs');
    const loginOtp = loginMfaLogs.data.data.logs[0].otp;
    console.log('Retrieved Login MFA OTP:', loginOtp);

    // 9. Verify Login OTP
    console.log('\n[7/10] Testing POST /api/verify-login-otp...');
    const verifyLoginRes = await makeRequest('POST', '/verify-login-otp', {
      challengeId,
      otp: loginOtp
    });
    console.log('Status:', verifyLoginRes.status);
    console.log('Response:', verifyLoginRes.data);
    console.log('Session Cookie set:', cookieHeader);
    if (verifyLoginRes.status !== 200) throw new Error('Login OTP verification failed');

    // 10. Test Session GET /api/me
    console.log('\n[8/10] Testing GET /api/me (Session Cookie Auth)...');
    const meRes = await makeRequest('GET', '/me');
    console.log('Status:', meRes.status);
    console.log('Authenticated User Profile:', meRes.data);
    if (meRes.status !== 200) throw new Error('/api/me failed');

    // 11. Test JWT Issue POST /api/token
    console.log('\n[9/10] Testing POST /api/token (JWT Token Issue)...');
    const tokenRes = await makeRequest('POST', '/token', { userId });
    console.log('Status:', tokenRes.status);
    console.log('JWT Issued:', tokenRes.data);
    jwtToken = tokenRes.data.data.token;

    // 12. Test Protected GET /api/protected
    console.log('\n[10/10] Testing GET /api/protected (Bearer JWT Header)...');
    const protectedRes = await makeRequest('GET', '/protected', null, {
      Authorization: `Bearer ${jwtToken}`
    });
    console.log('Status:', protectedRes.status);
    console.log('Protected Vault Response:', protectedRes.data);
    if (protectedRes.status !== 200) throw new Error('/api/protected failed');

    console.log('\n==================================================');
    console.log(' ALL 10 INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉');
    console.log('==================================================\n');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ Integration Test Failed:', err.message);
    process.exit(1);
  }
}

setTimeout(runTests, 1000);
