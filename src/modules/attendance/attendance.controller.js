const service = require('./attendance.service');
const { success } = require('../../utils/apiResponse');

async function list(req, res, next) {
  try { success(res, await service.list(req.query)); } catch (err) { next(err); }
}
async function create(req, res, next) {
  try { success(res, await service.create(req.body, req.user.id), 201); } catch (err) { next(err); }
}
async function bulkCreate(req, res, next) {
  try { success(res, await service.bulkCreate(req.body, req.user.id), 201); } catch (err) { next(err); }
}
async function update(req, res, next) {
  try { success(res, await service.update(req.params.id, req.body)); } catch (err) { next(err); }
}

module.exports = { list, create, bulkCreate, update };
