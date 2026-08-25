const { NODE_ENV } = require('../config/constants.config');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected error occurred on the server.';

  if (NODE_ENV === 'development') {
    console.error(' [ERROR HANDLER LOG]:', err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code: errorCode,
      ...(err.remainingAttempts !== undefined && { remainingAttempts: err.remainingAttempts })
    }
  });
};

module.exports = errorHandler;
