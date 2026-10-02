const ApiResponse = require('../utils/apiResponse');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorDetails = error.details.map((detail) => detail.message);
    return ApiResponse.error(res, 'Validation error', 400, errorDetails);
  }
  next();
};

module.exports = validate;