const AppError = require('../utils/AppError');

function rbac(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('No autenticado', 401, 'UNAUTHORIZED'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError('No tiene permisos para esta accion', 403, 'FORBIDDEN'));
    }
    next();
  };
}

module.exports = rbac;
