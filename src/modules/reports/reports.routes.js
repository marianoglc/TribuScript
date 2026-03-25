const { Router } = require('express');
const controller = require('./reports.controller');
const auth = require('../../middleware/auth');
const rbac = require('../../middleware/rbac');

const router = Router();

router.use(auth());
router.use(rbac('admin', 'staff'));

router.get('/revenue', controller.revenue);
router.get('/debtors', controller.debtors);
router.get('/attendance', rbac('admin', 'staff', 'instructor'), controller.attendance);
router.get('/occupancy', controller.occupancy);
router.get('/members', controller.members);

module.exports = router;
