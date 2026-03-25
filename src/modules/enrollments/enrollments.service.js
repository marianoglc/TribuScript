const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');
const { getPagination, paginatedResponse } = require('../../utils/pagination');

async function list(query) {
  const { page, limit, skip } = getPagination(query);
  const where = {};
  if (query.member_id) where.memberId = query.member_id;
  if (query.discipline_id) where.disciplineId = query.discipline_id;
  if (query.status) where.status = query.status;

  const [items, total] = await Promise.all([
    prisma.enrollment.findMany({
      where,
      include: {
        member: { select: { id: true, firstName: true, lastName: true, dni: true } },
        discipline: { select: { id: true, name: true, category: true } },
      },
      skip,
      take: limit,
      orderBy: { enrolledAt: 'desc' },
    }),
    prisma.enrollment.count({ where }),
  ]);
  return paginatedResponse(items, total, { page, limit });
}

async function getById(id) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id },
    include: { member: true, discipline: true },
  });
  if (!enrollment) throw new AppError('Inscripcion no encontrada', 404, 'ENROLLMENT_NOT_FOUND');
  return enrollment;
}

async function create(data) {
  // Validate member
  const member = await prisma.member.findUnique({ where: { id: data.member_id }, include: { plan: { include: { planDisciplines: true } } } });
  if (!member) throw new AppError('Miembro no encontrado', 404, 'MEMBER_NOT_FOUND');
  if (member.status !== 'active' && member.status !== 'trial') {
    throw new AppError('El miembro no esta activo', 422, 'MEMBER_NOT_ACTIVE');
  }

  // Validate discipline
  const discipline = await prisma.discipline.findUnique({ where: { id: data.discipline_id } });
  if (!discipline) throw new AppError('Disciplina no encontrada', 404, 'DISCIPLINE_NOT_FOUND');
  if (!discipline.isActive) throw new AppError('La disciplina no esta activa', 422, 'DISCIPLINE_INACTIVE');

  // Check plan includes discipline (if member has a plan)
  if (member.plan) {
    const planDisciplineIds = member.plan.planDisciplines.map((pd) => pd.disciplineId);
    const isUnlimited = member.plan.maxDisciplines === null;
    if (!isUnlimited && !planDisciplineIds.includes(data.discipline_id)) {
      throw new AppError('El plan del miembro no incluye esta disciplina', 422, 'DISCIPLINE_NOT_IN_PLAN');
    }
  }

  // Check duplicate active enrollment
  const existing = await prisma.enrollment.findFirst({
    where: { memberId: data.member_id, disciplineId: data.discipline_id, status: 'active' },
  });
  if (existing) throw new AppError('El miembro ya esta inscripto en esta disciplina', 409, 'ALREADY_ENROLLED');

  // Check capacity
  const activeCount = await prisma.enrollment.count({
    where: { disciplineId: data.discipline_id, status: 'active' },
  });
  if (activeCount >= discipline.maxCapacity) {
    throw new AppError('No hay cupo disponible en esta disciplina', 422, 'NO_CAPACITY');
  }

  return prisma.enrollment.create({
    data: { memberId: data.member_id, disciplineId: data.discipline_id },
    include: { member: { select: { firstName: true, lastName: true } }, discipline: { select: { name: true } } },
  });
}

async function cancel(id) {
  const enrollment = await getById(id);
  if (enrollment.status !== 'active') {
    throw new AppError('La inscripcion no esta activa', 422, 'NOT_ACTIVE');
  }

  return prisma.enrollment.update({
    where: { id },
    data: { status: 'cancelled', cancelledAt: new Date() },
  });
}

module.exports = { list, getById, create, cancel };
