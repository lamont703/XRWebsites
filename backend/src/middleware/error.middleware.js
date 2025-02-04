import ApiError from '../utils/ApiError.js';

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Handle API errors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  // Handle Cosmos DB specific errors
  if (err.code === 'ERR_INVALID_URL') {
    return res.status(500).json({
      success: false,
      message: 'Database configuration error',
      error: 'Invalid database connection URL'
    });
  }

  // Default error
  return res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: err.message
  });
};

export default errorHandler; 