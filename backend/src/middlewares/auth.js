const { verifyToken } = require('../utils/jwt');
const HttpError = require('../utils/httpError');
const userRepository = require('../repositories/user.repository');

// Verifies the Authorization header, decodes JWT, attaches `req.user = { id, email, userType }`.
async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new HttpError(401, 'Missing or invalid Authorization header');
    }

    const decoded = verifyToken(token);
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      userType: decoded.userType || 'DEVELOPER',
    };

    // If userType wasn't in an older token, populate it from DB
    if (!decoded.userType) {
      const dbUser = await userRepository.findById(decoded.sub);
      if (dbUser) req.user.userType = dbUser.userType;
    }

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

// Restricts route access to specific user types (e.g., RECRUITER or DEVELOPER)
function requireUserType(...allowedTypes) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new HttpError(401, 'Authentication required'));
    }
    if (!allowedTypes.includes(req.user.userType)) {
      return next(
        new HttpError(403, `Forbidden: Requires one of [${allowedTypes.join(', ')}] account type`)
      );
    }
    next();
  };
}

module.exports = { requireAuth, requireUserType };
