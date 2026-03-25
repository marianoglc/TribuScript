const { Router } = require('express');
const controller = require('./plans.controller');
const validate = require('../../middleware/validate');
const auth = require('../../middleware/auth');
const rbac = require('../../middleware/rbac');
const schemas = require('./plans.validation');

const router = Router();

router.get('/', auth(), controller.list);
router.get('/:id', auth(), controller.getById);

router.post('/', auth(), rbac('admin'), validate(schemas.create), controller.create);
router.patch('/:id', auth(), rbac('admin'), validate(schemas.update), controller.update);
router.delete('/:id', auth(), rbac('admin'), controller.remove);
router.post('/:id/disciplines', auth(), rbac('admin'), validate(schemas.addDiscipline), controller.addDiscipline);
router.delete('/:id/disciplines/:did', auth(), rbac('admin'), controller.removeDiscipline);

module.exports = router;
