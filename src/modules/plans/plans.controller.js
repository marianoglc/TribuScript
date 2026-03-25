const service = require('./plans.service');
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
async function update(req, res, next) {
  try { success(res, await service.update(req.params.id, req.body)); } catch (err) { next(err); }
}
async function remove(req, res, next) {
  try { success(res, await service.remove(req.params.id)); } catch (err) { next(err); }
}
async function addDiscipline(req, res, next) {
  try { success(res, await service.addDiscipline(req.params.id, req.body.discipline_id), 201); } catch (err) { next(err); }
}
async function removeDiscipline(req, res, next) {
  try { await service.removeDiscipline(req.params.id, req.params.did); res.status(204).end(); } catch (err) { next(err); }
}

module.exports = { list, getById, create, update, remove, addDiscipline, removeDiscipline };
