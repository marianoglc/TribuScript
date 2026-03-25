const service = require('./classes.service');
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
async function getSchedule(req, res, next) {
  try { success(res, await service.getSchedule()); } catch (err) { next(err); }
}
async function getToday(req, res, next) {
  try { success(res, await service.getToday()); } catch (err) { next(err); }
}

module.exports = { list, getById, create, update, remove, getSchedule, getToday };
