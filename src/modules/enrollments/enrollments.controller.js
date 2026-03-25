const service = require('./enrollments.service');
const { success } = require('../../utils/apiResponse');

async function list(req, res, next) {
  try { success(res, await service.list(req.query)); } catch (err) { next(err); }
}
async function getById(req, res, next) {
  try { success(res, await service.getById(req.params.id)); } catch (err) { next(err); }
}
async function create(req, res, next) {
  try { success(res, await service.create(req.body), 201); } catch (err) { next(err); }
}
async function cancel(req, res, next) {
  try { success(res, await service.cancel(req.params.id)); } catch (err) { next(err); }
}

module.exports = { list, getById, create, cancel };
