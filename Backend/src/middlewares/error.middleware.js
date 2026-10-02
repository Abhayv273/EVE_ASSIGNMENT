const ApiResponse = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // CastError: Invalid MongoDB ObjectId passed in URL/body
  if (err.name === 'CastError') {
    return ApiResponse.error(res, `Resource not found. Invalid identifier: ${err.value}`, 400);
  }

  // Duplicate unique index violation
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return ApiResponse.error(res, `Duplicate value entered for ${field} field.`, 409);
  }

  // Schema Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return ApiResponse.error(res, 'Validation failed', 400, messages);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return ApiResponse.error(res, message, statusCode);
};

module.exports = errorHandler;