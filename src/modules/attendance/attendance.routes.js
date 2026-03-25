const { Router } = require('express');
const controller = require('./attendance.controller');
const validate = require('../../middleware/validate');
const auth = require('../../middleware/auth');
const rbac = require('../../middleware/rbac');
const schemas = require('./attendance.validation');

const router = Router();

router.use(auth());
router.use(rbac('admin', 'staff', 'instructor'));

router.get('/', controller.list);
router.post('/', validate(schemas.create), controller.create);
router.post('/bulk', validate(schemas.bulk), controller.bulkCreate);
router.patch('/:id', rbac('admin', 'staff'), validate(schemas.update), controller.update);

module.exports = router;
