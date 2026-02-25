/**
 * Wraps async route handlers so unhandled promise rejections are passed to next().
 * @param {Function} fn - Async (req, res, next) => ...
 * @returns {Function} Express middleware
 */
export default function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
