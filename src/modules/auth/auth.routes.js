const { Router } = require('express');
const controller = require('./auth.controller');
const validate = require('../../middleware/validate');
const auth = require('../../middleware/auth');
const schemas = require('./auth.validation');

const router = Router();

router.post('/register', validate(schemas.register), controller.register);
router.post('/login', validate(schemas.login), controller.login);
router.post('/refresh', controller.refresh);
router.get('/me', auth(), controller.getMe);
router.patch('/me', auth(), validate(schemas.updateProfile), controller.updateMe);
router.patch('/me/password', auth(), validate(schemas.changePassword), controller.changePassword);

module.exports = router;
