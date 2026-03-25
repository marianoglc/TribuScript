const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');
const { getPagination, paginatedResponse } = require('../../utils/pagination');

async function list(query) {
  const { page, limit, skip } = getPagination(query);
  const where = {};
  if (query.class_id) where.classId = query.class_id;
  if (query.member_id) where.memberId = query.member_id;
  if (query.date) where.date = new Date(query.date);
  if (query.date_from || query.date_to) {
    where.date = {};
    if (query.date_from) where.date.gte = new Date(query.date_from);
    if (query.date_to) where.date.lte = new Date(query.date_to);
  }

  const [items, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      include: {
        member: { select: { id: true, firstName: true, lastName: true, dni: true } },
        class: { select: { id: true, name: true, discipline: { select: { name: true } } } },
      },
      skip,
      take: limit,
      orderBy: { date: 'desc' },
    }),
    prisma.attendance.count({ where }),
  ]);
  return paginatedResponse(items, total, { page, limit });
}

async function create(data, checkedById) {
  // Validate class
  const cls = await prisma.class.findUnique({ where: { id: data.class_id }, include: { discipline: true } });
  if (!cls) throw new AppError('Clase no encontrada', 404, 'CLASS_NOT_FOUND');

  // Validate member is enrolled in the discipline
  const enrollment = await prisma.enrollment.findFirst({
    where: { memberId: data.member_id, disciplineId: cls.disciplineId, status: 'active' },
  });
  if (!enrollment) {
    throw new AppError('El miembro no esta inscripto en la disciplina de esta clase', 422, 'NOT_ENROLLED');
  }

  return prisma.attendance.create({
    data: {
      memberId: data.member_id,
      classId: data.class_id,
      date: new Date(data.date),
      status: data.status,
      notes: data.notes || null,
      checkedBy: checkedById,
    },
    include: { member: { select: { firstName: true, lastName: true } } },
  });
}

async function bulkCreate(data, checkedById) {
  const cls = await prisma.class.findUnique({ where: { id: data.class_id }, include: { discipline: true } });
  if (!cls) throw new AppError('Clase no encontrada', 404, 'CLASS_NOT_FOUND');

  const date = new Date(data.date);
  const results = [];

  for (const record of data.records) {
    try {
      const created = await prisma.attendance.create({
        data: {
          memberId: record.member_id,
          classId: data.class_id,
          date,
          status: record.status,
          notes: record.notes || null,
          checkedBy: checkedById,
        },
      });
      results.push(created);
    } catch (err) {
      // Skip duplicates (unique constraint on member+class+date)
      if (err.code !== 'P2002') throw err;
    }
  }

  return { created: results.length, records: results };
}

async function update(id, data) {
  const record = await prisma.attendance.findUnique({ where: { id } });
  if (!record) throw new AppError('Registro de asistencia no encontrado', 404, 'ATTENDANCE_NOT_FOUND');

  return prisma.attendance.update({
    where: { id },
    data: {
      status: data.status ?? undefined,
      notes: data.notes ?? undefined,
    },
  });
}

module.exports = { list, create, bulkCreate, update };
