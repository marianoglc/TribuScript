const membersService = require('./members.service');
const { success } = require('../../utils/apiResponse');

async function list(req, res, next) {
  try {
    const data = await membersService.list(req.query);
    success(res, data);
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const data = await membersService.getById(req.params.id);
    success(res, data);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const data = await membersService.create(req.body);
    success(res, data, 201);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const data = await membersService.update(req.params.id, req.body);
    success(res, data);
  } catch (err) { next(err); }
}

async function updateStatus(req, res, next) {
  try {
    const data = await membersService.updateStatus(req.params.id, req.body.status);
    success(res, data);
  } catch (err) { next(err); }
}

async function getEnrollments(req, res, next) {
  try {
    const data = await membersService.getEnrollments(req.params.id);
    success(res, data);
  } catch (err) { next(err); }
}

async function getPayments(req, res, next) {
  try {
    const data = await membersService.getPayments(req.params.id, req.query);
    success(res, data);
  } catch (err) { next(err); }
}

async function getAttendance(req, res, next) {
  try {
    const data = await membersService.getAttendance(req.params.id, req.query);
    success(res, data);
  } catch (err) { next(err); }
}

module.exports = { list, getById, create, update, updateStatus, getEnrollments, getPayments, getAttendance };
