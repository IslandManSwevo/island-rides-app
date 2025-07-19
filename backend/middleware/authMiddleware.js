// Legacy middleware file for test compatibility
const { authenticateToken, checkRole } = require('./auth');

module.exports = {
  authenticateToken,
  checkRole
};