const service = require('./payments.service');
const { success } = require('../../utils/apiResponse');

async function list(req, res, next) {
  try { success(res, await service.list(req.query)); } catch (err) { next(err); }
}
async function getById(req, res, next) {
  try { success(res, await service.getById(req.params.id)); } catch (err) { next(err); }
}
async function create(req, res, next) {
  try { success(res, await service.create(req.body, req.user.id), 201); } catch (err) { next(err); }
}
async function updateStatus(req, res, next) {
  try { success(res, await service.updateStatus(req.params.id, req.body.status)); } catch (err) { next(err); }
}
async function getPending(req, res, next) {
  try { success(res, await service.getPending(req.query)); } catch (err) { next(err); }
}
async function generate(req, res, next) {
  try {
    const { period_start, period_end } = req.body;
    success(res, await service.generateForPeriod(period_start, period_end), 201);
  } catch (err) { next(err); }
}

module.exports = { list, getById, create, updateStatus, getPending, generate };
