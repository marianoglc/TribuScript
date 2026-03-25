const { Router } = require('express');
const controller = require('./disciplines.controller');
const validate = require('../../middleware/validate');
const auth = require('../../middleware/auth');
const rbac = require('../../middleware/rbac');
const schemas = require('./disciplines.validation');

const router = Router();

// Public-ish: any authenticated user can list/view
router.get('/', auth(), controller.list);
router.get('/:id', auth(), controller.getById);
router.get('/:id/classes', auth(), controller.getClasses);

// Admin/Staff only
router.post('/', auth(), rbac('admin', 'staff'), validate(schemas.create), controller.create);
router.patch('/:id', auth(), rbac('admin', 'staff'), validate(schemas.update), controller.update);
router.delete('/:id', auth(), rbac('admin'), controller.remove);
router.get('/:id/enrollments', auth(), rbac('admin', 'staff'), controller.getEnrollments);

module.exports = router;
