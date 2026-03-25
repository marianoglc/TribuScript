const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');
const { getPagination, paginatedResponse } = require('../../utils/pagination');

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

async function list(query) {
  const { page, limit, skip } = getPagination(query);
  const where = {};
  if (query.discipline_id) where.disciplineId = query.discipline_id;
  if (query.instructor_id) where.instructorId = query.instructor_id;
  if (query.day_of_week) where.dayOfWeek = query.day_of_week;
  if (query.is_active !== undefined) where.isActive = query.is_active === 'true';

  const [items, total] = await Promise.all([
    prisma.class.findMany({
      where,
      include: {
        discipline: { select: { id: true, name: true, category: true } },
        instructor: { select: { id: true, email: true, member: { select: { firstName: true, lastName: true } } } },
      },
      skip,
      take: limit,
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    }),
    prisma.class.count({ where }),
  ]);
  return paginatedResponse(items, total, { page, limit });
}

async function getById(id) {
  const cls = await prisma.class.findUnique({
    where: { id },
    include: {
      discipline: true,
      instructor: { select: { id: true, email: true, member: { select: { firstName: true, lastName: true } } } },
    },
  });
  if (!cls) throw new AppError('Clase no encontrada', 404, 'CLASS_NOT_FOUND');
  return cls;
}

async function create(data) {
  // Validate instructor role
  const instructor = await prisma.user.findUnique({ where: { id: data.instructor_id } });
  if (!instructor || instructor.role !== 'instructor') {
    throw new AppError('El usuario no es un instructor', 422, 'INVALID_INSTRUCTOR');
  }

  // Validate discipline exists
  const discipline = await prisma.discipline.findUnique({ where: { id: data.discipline_id } });
  if (!discipline) throw new AppError('Disciplina no encontrada', 404, 'DISCIPLINE_NOT_FOUND');

  // Check schedule conflicts for instructor
  const conflict = await prisma.class.findFirst({
    where: {
      instructorId: data.instructor_id,
      dayOfWeek: data.day_of_week,
      isActive: true,
      OR: [
        { startTime: { lt: data.end_time }, endTime: { gt: data.start_time } },
      ],
    },
  });
  if (conflict) {
    throw new AppError('El instructor tiene un conflicto de horario', 409, 'SCHEDULE_CONFLICT');
  }

  return prisma.class.create({
    data: {
      disciplineId: data.discipline_id,
      instructorId: data.instructor_id,
      name: data.name,
      dayOfWeek: data.day_of_week,
      startTime: data.start_time,
      endTime: data.end_time,
      location: data.location || null,
      maxCapacity: data.max_capacity || discipline.maxCapacity,
    },
    include: { discipline: true, instructor: { select: { id: true, email: true } } },
  });
}

async function update(id, data) {
  await getById(id);
  return prisma.class.update({
    where: { id },
    data: {
      instructorId: data.instructor_id ?? undefined,
      name: data.name ?? undefined,
      dayOfWeek: data.day_of_week ?? undefined,
      startTime: data.start_time ?? undefined,
      endTime: data.end_time ?? undefined,
      location: data.location ?? undefined,
      maxCapacity: data.max_capacity ?? undefined,
      isActive: data.is_active ?? undefined,
    },
    include: { discipline: true },
  });
}

async function remove(id) {
  await getById(id);
  return prisma.class.update({ where: { id }, data: { isActive: false } });
}

async function getSchedule() {
  const classes = await prisma.class.findMany({
    where: { isActive: true },
    include: {
      discipline: { select: { id: true, name: true, category: true } },
      instructor: { select: { id: true, member: { select: { firstName: true, lastName: true } } } },
    },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });

  // Group by day
  const schedule = {};
  for (const day of DAY_ORDER) {
    schedule[day] = classes.filter((c) => c.dayOfWeek === day);
  }
  return schedule;
}

async function getToday() {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = days[new Date().getDay()];

  return prisma.class.findMany({
    where: { dayOfWeek: today, isActive: true },
    include: {
      discipline: { select: { id: true, name: true } },
      instructor: { select: { id: true, member: { select: { firstName: true, lastName: true } } } },
    },
    orderBy: { startTime: 'asc' },
  });
}

module.exports = { list, getById, create, update, remove, getSchedule, getToday };
