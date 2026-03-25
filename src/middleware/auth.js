const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');

function auth() {
  return (req, _res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return next(new AppError('Token no proporcionado', 401, 'UNAUTHORIZED'));
    }

    const token = header.split(' ')[1];
    try {
      const decoded = jwt.verify(token, env.jwt.accessSecret);
      req.user = decoded;
      next();
    } catch {
      next(new AppError('Token invalido o expirado', 401, 'INVALID_TOKEN'));
    }
  };
}

module.exports = auth;
