const { verifyToken } = require('../utils/jwt');
const HttpError = require('../utils/httpError');

// Verifies the Authorization header, decodes JWT, attaches `req.user = { id, email }`.
function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new HttpError(401, 'Missing or invalid Authorization header');
    }

    const decoded = verifyToken(token);
    req.user = { id: decoded.sub, email: decoded.email };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new HttpError(401, 'Token expired'));
    }
    if (err.name === 'JsonWebTokenError') {
      return next(new HttpError(401, 'Invalid token'));
    }
    next(err);
  }
}

module.exports = { requireAuth };
