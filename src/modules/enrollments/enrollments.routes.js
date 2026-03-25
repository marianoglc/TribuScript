const { Router } = require('express');
const controller = require('./enrollments.controller');
const validate = require('../../middleware/validate');
const auth = require('../../middleware/auth');
const rbac = require('../../middleware/rbac');
const schemas = require('./enrollments.validation');

const router = Router();

router.use(auth());
router.use(rbac('admin', 'staff'));

router.get('/', controller.list);
router.post('/', validate(schemas.create), controller.create);
router.get('/:id', controller.getById);
router.patch('/:id/cancel', controller.cancel);

module.exports = router;
