const { Router } = require('express');
const controller = require('./payments.controller');
const validate = require('../../middleware/validate');
const auth = require('../../middleware/auth');
const rbac = require('../../middleware/rbac');
const schemas = require('./payments.validation');

const router = Router();

router.use(auth());
router.use(rbac('admin', 'staff'));

router.get('/', controller.list);
router.get('/pending', controller.getPending);
router.post('/', validate(schemas.create), controller.create);
router.post('/generate', rbac('admin'), controller.generate);
router.get('/:id', controller.getById);
router.patch('/:id', validate(schemas.updateStatus), controller.updateStatus);

module.exports = router;
