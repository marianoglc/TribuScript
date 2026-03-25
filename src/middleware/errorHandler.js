const { Prisma } = require('@prisma/client');
const { ZodError } = require('zod');

function errorHandler(err, _req, res, _next) {
  // Zod validation errors
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(422).json({
      status: 'error',
      message: 'Error de validacion',
      code: 'VALIDATION_ERROR',
      errors,
    });
  }

  // Prisma unique constraint
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'campo';
    return res.status(409).json({
      status: 'error',
      message: `El valor de '${field}' ya existe`,
      code: 'DUPLICATE_ENTRY',
    });
  }

  // Prisma not found
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
    return res.status(404).json({
      status: 'error',
      message: 'Recurso no encontrado',
      code: 'NOT_FOUND',
    });
  }

  // App operational errors
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      code: err.code,
    });
  }

  // Unknown errors
  console.error('Unhandled error:', err);
  return res.status(500).json({
    status: 'error',
    message: 'Error interno del servidor',
    code: 'INTERNAL_ERROR',
  });
}

module.exports = errorHandler;
