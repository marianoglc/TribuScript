const service = require('./reports.service');
const { success } = require('../../utils/apiResponse');

async function revenue(req, res, next) {
  try { success(res, await service.revenue(req.query)); } catch (err) { next(err); }
}
async function debtors(req, res, next) {
  try { success(res, await service.debtors()); } catch (err) { next(err); }
}
async function attendance(req, res, next) {
  try { success(res, await service.attendance(req.query)); } catch (err) { next(err); }
}
async function occupancy(req, res, next) {
  try { success(res, await service.occupancy()); } catch (err) { next(err); }
}
async function members(req, res, next) {
  try { success(res, await service.members(req.query)); } catch (err) { next(err); }
}

module.exports = { revenue, debtors, attendance, occupancy, members };
