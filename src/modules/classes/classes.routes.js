const { Router } = require('express');
const controller = require('./classes.controller');
const validate = require('../../middleware/validate');
const auth = require('../../middleware/auth');
const rbac = require('../../middleware/rbac');
const schemas = require('./classes.validation');

const router = Router();

router.get('/', auth(), controller.list);
router.get('/schedule', auth(), controller.getSchedule);
router.get('/today', auth(), controller.getToday);
router.get('/:id', auth(), controller.getById);

router.post('/', auth(), rbac('admin', 'staff'), validate(schemas.create), controller.create);
router.patch('/:id', auth(), rbac('admin', 'staff', 'instructor'), validate(schemas.update), controller.update);
router.delete('/:id', auth(), rbac('admin', 'staff'), controller.remove);

module.exports = router;
