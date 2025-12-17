module.exports = (err, req, res, next) => {
  console.error('Error:', err);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'SERVER_ERROR',
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};
