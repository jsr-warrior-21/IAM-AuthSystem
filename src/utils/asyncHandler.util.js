/**
  Wrapper for async route handlers to eliminate repetitive try...catch blocks.
  Passes uncaught rejected promises directly to Express error middleware.
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;
