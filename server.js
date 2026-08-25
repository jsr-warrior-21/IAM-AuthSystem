const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');

const { PORT, NODE_ENV, SESSION_SECRET, COOKIE_NAME } = require('./src/config/constants.config');
const apiRoutes = require('./src/routes/api.route');
const errorHandler = require('./src/middlewares/error.middleware');

const app = express();

// Security & Parsing Middlewares
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(SESSION_SECRET));

// Session Configuration
app.use(session({
  name: COOKIE_NAME,
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true, // Prevents XSS script access to session cookie
    secure: NODE_ENV === 'production', // Use HTTPS in production
    sameSite: 'lax', // Protects against CSRF
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve static frontend UI
app.use(express.static(path.join(__dirname, 'public')));

// Mount API routes
app.use('/api', apiRoutes);

// Catch-all route to serve SPA frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Global Uncaught Exception & Rejection Handlers
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` IAM Auth & MFA System Server Running`);
  console.log(` URL: http://localhost:${PORT}`);
  console.log(` Environment: ${NODE_ENV}`);
  console.log(` Server Time: ${new Date().toISOString()}`);
  console.log(`=======================================================`);
});

module.exports = app;
