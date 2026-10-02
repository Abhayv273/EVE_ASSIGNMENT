const jwt = require('jsonwebtoken');
const ApiResponse = require('../utils/apiResponse');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ApiResponse.error(res, 'Access denied. No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      return ApiResponse.error(res, 'Invalid token. User not found.', 401);
    }

    req.user = user;
    next();
  } catch (err) {
    return ApiResponse.error(res, 'Invalid or expired token.', 401);
  }
};

module.exports = authenticate;