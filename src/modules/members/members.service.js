const bcrypt = require('bcrypt');
const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');
const { getPagination, paginatedResponse } = require('../../utils/pagination');

async function list(query) {
  const { page, limit, skip } = getPagination(query);

  const where = {};
  if (query.status) where.status = query.status;
  if (query.plan_id) where.planId = query.plan_id;
  if (query.search) {
    where.OR = [
      { firstName: { contains: query.search, mode: 'insensitive' } },
      { lastName: { contains: query.search, mode: 'insensitive' } },
      { dni: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const orderBy = {};
  if (query.sort) {
    const field = {
      first_name: 'firstName',
      last_name: 'lastName',
      enrollment_date: 'enrollmentDate',
      created_at: 'createdAt',
    }[query.sort] || 'createdAt';
    orderBy[field] = query.order === 'desc' ? 'desc' : 'asc';
  } else {
    orderBy.createdAt = 'desc';
  }

  const [members, total] = await Promise.all([
    prisma.member.findMany({
      where,
      include: { plan: true, user: { select: { email: true, role: true, isActive: true } } },
      skip,
      take: limit,
      orderBy,
    }),
    prisma.member.count({ where }),
  ]);

  return paginatedResponse(members, total, { page, limit });
}

async function getById(id) {
  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      plan: true,
      user: { select: { email: true, role: true, isActive: true } },
      enrollments: { include: { discipline: true }, where: { status: 'active' } },
    },
  });
  if (!member) throw new AppError('Miembro no encontrado', 404, 'MEMBER_NOT_FOUND');
  return member;
}

async function create(data) {
  const hashedPassword = await bcrypt.hash(data.password, 12);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email: data.email, password: hashedPassword, role: 'member' },
    });

    const member = await tx.member.create({
      data: {
        userId: user.id,
        firstName: data.first_name,
        lastName: data.last_name,
        dni: data.dni,
        phone: data.phone || null,
        dateOfBirth: new Date(data.date_of_birth),
        gender: data.gender || null,
        address: data.address || null,
        emergencyContact: data.emergency_contact || null,
        emergencyPhone: data.emergency_phone || null,
        planId: data.plan_id || null,
        status: data.plan_id ? 'active' : 'trial',
      },
      include: { plan: true, user: { select: { email: true, role: true } } },
    });

    return member;
  });

  return result;
}

async function update(id, data) {
  const member = await prisma.member.findUnique({ where: { id } });
  if (!member) throw new AppError('Miembro no encontrado', 404, 'MEMBER_NOT_FOUND');

  return prisma.member.update({
    where: { id },
    data: {
      firstName: data.first_name ?? undefined,
      lastName: data.last_name ?? undefined,
      phone: data.phone ?? undefined,
      gender: data.gender ?? undefined,
      address: data.address ?? undefined,
      emergencyContact: data.emergency_contact ?? undefined,
      emergencyPhone: data.emergency_phone ?? undefined,
      planId: data.plan_id !== undefined ? data.plan_id : undefined,
    },
    include: { plan: true, user: { select: { email: true, role: true } } },
  });
}

async function updateStatus(id, status) {
  const member = await prisma.member.findUnique({ where: { id } });
  if (!member) throw new AppError('Miembro no encontrado', 404, 'MEMBER_NOT_FOUND');

  return prisma.member.update({
    where: { id },
    data: { status },
  });
}

async function getEnrollments(id) {
  const member = await prisma.member.findUnique({ where: { id } });
  if (!member) throw new AppError('Miembro no encontrado', 404, 'MEMBER_NOT_FOUND');

  return prisma.enrollment.findMany({
    where: { memberId: id },
    include: { discipline: true },
    orderBy: { enrolledAt: 'desc' },
  });
}

async function getPayments(id, query) {
  const member = await prisma.member.findUnique({ where: { id } });
  if (!member) throw new AppError('Miembro no encontrado', 404, 'MEMBER_NOT_FOUND');

  const { page, limit, skip } = getPagination(query);
  const where = { memberId: id };
  if (query.status) where.status = query.status;

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.payment.count({ where }),
  ]);

  return paginatedResponse(payments, total, { page, limit });
}

async function getAttendance(id, query) {
  const member = await prisma.member.findUnique({ where: { id } });
  if (!member) throw new AppError('Miembro no encontrado', 404, 'MEMBER_NOT_FOUND');

  const { page, limit, skip } = getPagination(query);
  const where = { memberId: id };
  if (query.date_from) where.date = { ...where.date, gte: new Date(query.date_from) };
  if (query.date_to) where.date = { ...where.date, lte: new Date(query.date_to) };

  const [records, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      include: { class: { include: { discipline: true } } },
      skip,
      take: limit,
      orderBy: { date: 'desc' },
    }),
    prisma.attendance.count({ where }),
  ]);

  return paginatedResponse(records, total, { page, limit });
}

module.exports = { list, getById, create, update, updateStatus, getEnrollments, getPayments, getAttendance };
