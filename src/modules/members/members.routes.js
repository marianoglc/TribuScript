const { Router } = require('express');
const controller = require('./members.controller');
const validate = require('../../middleware/validate');
const auth = require('../../middleware/auth');
const rbac = require('../../middleware/rbac');
const schemas = require('./members.validation');

const router = Router();

router.use(auth());
router.use(rbac('admin', 'staff'));

router.get('/', controller.list);
router.post('/', validate(schemas.create), controller.create);
router.get('/:id', controller.getById);
router.patch('/:id', validate(schemas.update), controller.update);
router.patch('/:id/status', validate(schemas.updateStatus), controller.updateStatus);
router.get('/:id/enrollments', controller.getEnrollments);
router.get('/:id/payments', controller.getPayments);
router.get('/:id/attendance', controller.getAttendance);

module.exports = router;
