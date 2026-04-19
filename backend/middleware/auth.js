const jwt = require('jsonwebtoken');

// Verifies the JWT token sent in the Authorization header
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // attach decoded user info to request
    next();             // continue to the actual route handler
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Checks if the logged-in user has one of the allowed roles
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};

module.exports = { verifyToken, requireRole };
