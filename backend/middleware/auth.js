const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  console.log('🔍 Backend: Auth check for:', req.path);
  
  const authHeader = req.headers['authorization'];
  console.log('🔍 Backend: Auth header exists:', !!authHeader);
  
  const token = authHeader && authHeader.split(' ')[1];
  console.log('🔍 Backend: Token extracted:', !!token);
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required',
      code: 'TOKEN_MISSING',
      message: 'Authorization header with Bearer token is required'
    });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('❌ Backend: JWT verify failed:', err.message);
      let errorResponse = {
        error: 'Invalid or expired token',
        code: 'TOKEN_INVALID',
        message: 'The provided token is invalid or has expired'
      };
      
      if (err.name === 'TokenExpiredError') {
        errorResponse.code = 'TOKEN_EXPIRED';
        errorResponse.message = 'Token has expired';
      }
      
      return res.status(403).json(errorResponse);
    }
    
    console.log('✅ Backend: JWT verify success for user:', user.userId);
    req.user = user;
    next();
  });
};

const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const userRole = req.user.role || 'user';
    console.log('🔍 Backend: Role check - User role:', userRole, 'Required:', allowedRoles);
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        message: `Required role: ${allowedRoles.join(' or ')}, current role: ${userRole}`
      });
    }
    
    next();
  };
};

module.exports = {
  authenticateToken,
  checkRole
};