const authService = require('./auth.service');
const { success } = require('../../utils/apiResponse');

async function register(req, res, next) {
  try {
    const data = await authService.register(req.body);
    success(res, data, 201);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const data = await authService.login(req.body.email, req.body.password);
    success(res, data);
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { refresh_token } = req.body;
    const tokens = await authService.refreshToken(refresh_token);
    success(res, { tokens });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    const data = await authService.getProfile(req.user.id);
    success(res, data);
  } catch (err) {
    next(err);
  }
}

async function updateMe(req, res, next) {
  try {
    const data = await authService.updateProfile(req.user.id, req.body);
    success(res, data);
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    await authService.changePassword(req.user.id, req.body.current_password, req.body.new_password);
    success(res, { message: 'Contrasena actualizada' });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refresh, getMe, updateMe, changePassword };
