function success(res, data, statusCode = 200) {
  return res.status(statusCode).json({ status: 'success', data });
}

function error(res, message, statusCode = 500, code = null, errors = null) {
  const body = { status: 'error', message };
  if (code) body.code = code;
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
}

module.exports = { success, error };
