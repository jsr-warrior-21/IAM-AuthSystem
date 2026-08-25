const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');

const { PORT, NODE_ENV, SESSION_SECRET, COOKIE_NAME } = require('./src/config/constants.config');
const apiRoutes = require('./src/routes/api.route');
const errorHandler = require('./src/middlewares/error.middleware');

const app = express();

// Security and CORS configuration
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(SESSION_SECRET));

// Server-side session configuration
app.use(session({
  name: COOKIE_NAME,
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Serve static frontend single page application
app.use(express.static(path.join(__dirname, 'public')));

// Mount API routes under /api prefix
app.use('/api', apiRoutes);

// Catch-all route serving frontend SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Centralized Express error handling middleware
app.use(errorHandler);

// Global uncaught exception handlers
process.on('uncaughtException', (err) => {
  if (err.code === 'EADDRINUSE') {
    // Port already active - ignore duplicate listener error in tests
    return;
  }
  console.error('[CRITICAL] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL] Unhandled Rejection:', reason);
});

// Start Express server if file is run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` IAM Auth & MFA System Server Running`);
    console.log(` URL: http://localhost:${PORT}`);
    console.log(` Environment: ${NODE_ENV}`);
    console.log(` Server Time: ${new Date().toISOString()}`);
    console.log(`=======================================================`);
  });
}

module.exports = app;
