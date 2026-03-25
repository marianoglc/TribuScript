const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');
const { getPagination, paginatedResponse } = require('../../utils/pagination');

async function list(query) {
  const { page, limit, skip } = getPagination(query);
  const where = {};
  if (query.category) where.category = query.category;
  if (query.is_active !== undefined) where.isActive = query.is_active === 'true';

  const [items, total] = await Promise.all([
    prisma.discipline.findMany({
      where,
      include: { _count: { select: { enrollments: { where: { status: 'active' } } } } },
      skip,
      take: limit,
      orderBy: { name: 'asc' },
    }),
    prisma.discipline.count({ where }),
  ]);

  return paginatedResponse(items, total, { page, limit });
}

async function getById(id) {
  const discipline = await prisma.discipline.findUnique({
    where: { id },
    include: {
      classes: { where: { isActive: true }, include: { instructor: { select: { id: true, email: true } } } },
      _count: { select: { enrollments: { where: { status: 'active' } } } },
    },
  });
  if (!discipline) throw new AppError('Disciplina no encontrada', 404, 'DISCIPLINE_NOT_FOUND');
  return discipline;
}

async function create(data) {
  return prisma.discipline.create({
    data: {
      name: data.name,
      description: data.description || null,
      category: data.category,
      maxCapacity: data.max_capacity,
      imageUrl: data.image_url || null,
    },
  });
}

async function update(id, data) {
  await getById(id);
  return prisma.discipline.update({
    where: { id },
    data: {
      name: data.name ?? undefined,
      description: data.description ?? undefined,
      category: data.category ?? undefined,
      maxCapacity: data.max_capacity ?? undefined,
      isActive: data.is_active ?? undefined,
      imageUrl: data.image_url !== undefined ? data.image_url : undefined,
    },
  });
}

async function remove(id) {
  await getById(id);
  const activeEnrollments = await prisma.enrollment.count({ where: { disciplineId: id, status: 'active' } });
  if (activeEnrollments > 0) {
    throw new AppError(
      `No se puede desactivar: hay ${activeEnrollments} inscripciones activas`,
      409,
      'HAS_ACTIVE_ENROLLMENTS'
    );
  }
  return prisma.discipline.update({ where: { id }, data: { isActive: false } });
}

async function getClasses(id) {
  await getById(id);
  return prisma.class.findMany({
    where: { disciplineId: id, isActive: true },
    include: { instructor: { select: { id: true, email: true, member: { select: { firstName: true, lastName: true } } } } },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });
}

async function getEnrollments(id, query) {
  await getById(id);
  const { page, limit, skip } = getPagination(query);
  const where = { disciplineId: id };
  if (query.status) where.status = query.status;

  const [items, total] = await Promise.all([
    prisma.enrollment.findMany({
      where,
      include: { member: { select: { id: true, firstName: true, lastName: true, dni: true } } },
      skip,
      take: limit,
      orderBy: { enrolledAt: 'desc' },
    }),
    prisma.enrollment.count({ where }),
  ]);
  return paginatedResponse(items, total, { page, limit });
}

module.exports = { list, getById, create, update, remove, getClasses, getEnrollments };
