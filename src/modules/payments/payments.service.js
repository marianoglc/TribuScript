const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');
const { getPagination, paginatedResponse } = require('../../utils/pagination');

async function generateReceiptNumber() {
  const year = new Date().getFullYear();
  const lastPayment = await prisma.payment.findFirst({
    where: { receiptNumber: { startsWith: `${year}-` } },
    orderBy: { receiptNumber: 'desc' },
  });

  if (!lastPayment?.receiptNumber) {
    return `${year}-000001`;
  }

  const lastNum = parseInt(lastPayment.receiptNumber.split('-')[1], 10);
  return `${year}-${String(lastNum + 1).padStart(6, '0')}`;
}

async function list(query) {
  const { page, limit, skip } = getPagination(query);
  const where = {};
  if (query.member_id) where.memberId = query.member_id;
  if (query.status) where.status = query.status;
  if (query.payment_method) where.paymentMethod = query.payment_method;
  if (query.date_from || query.date_to) {
    where.periodStart = {};
    if (query.date_from) where.periodStart.gte = new Date(query.date_from);
    if (query.date_to) where.periodStart.lte = new Date(query.date_to);
  }

  const [items, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: { member: { select: { id: true, firstName: true, lastName: true, dni: true } } },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.payment.count({ where }),
  ]);
  return paginatedResponse(items, total, { page, limit });
}

async function getById(id) {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { member: { select: { id: true, firstName: true, lastName: true, dni: true, plan: true } } },
  });
  if (!payment) throw new AppError('Pago no encontrado', 404, 'PAYMENT_NOT_FOUND');
  return payment;
}

async function create(data, processedById) {
  const member = await prisma.member.findUnique({ where: { id: data.member_id } });
  if (!member) throw new AppError('Miembro no encontrado', 404, 'MEMBER_NOT_FOUND');

  const receiptNumber = await generateReceiptNumber();

  const payment = await prisma.payment.create({
    data: {
      memberId: data.member_id,
      amount: data.amount,
      currency: data.currency || 'ARS',
      paymentMethod: data.payment_method,
      status: 'completed',
      description: data.description || null,
      periodStart: new Date(data.period_start),
      periodEnd: new Date(data.period_end),
      paidAt: new Date(),
      receiptNumber,
      processedBy: processedById,
    },
    include: { member: { select: { firstName: true, lastName: true } } },
  });

  // Reactivate suspended member if needed
  if (member.status === 'suspended') {
    await prisma.member.update({ where: { id: member.id }, data: { status: 'active' } });
  }

  return payment;
}

async function updateStatus(id, status) {
  const payment = await getById(id);
  if (payment.status === status) return payment;

  const data = { status };
  if (status === 'completed' && !payment.paidAt) {
    data.paidAt = new Date();
    if (!payment.receiptNumber) {
      data.receiptNumber = await generateReceiptNumber();
    }
  }

  return prisma.payment.update({ where: { id }, data });
}

async function getPending(query) {
  const { page, limit, skip } = getPagination(query);
  const where = { status: 'pending' };

  const [items, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: { member: { select: { id: true, firstName: true, lastName: true, dni: true, phone: true } } },
      skip,
      take: limit,
      orderBy: { periodEnd: 'asc' },
    }),
    prisma.payment.count({ where }),
  ]);
  return paginatedResponse(items, total, { page, limit });
}

async function generateForPeriod(periodStart, periodEnd) {
  const activeMembers = await prisma.member.findMany({
    where: { status: 'active', planId: { not: null } },
    include: { plan: true },
  });

  const created = [];
  for (const member of activeMembers) {
    // Check if payment already exists for this period
    const exists = await prisma.payment.findFirst({
      where: {
        memberId: member.id,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
      },
    });

    if (!exists && member.plan) {
      const payment = await prisma.payment.create({
        data: {
          memberId: member.id,
          amount: member.plan.price,
          paymentMethod: 'other',
          status: 'pending',
          description: `Cuota ${member.plan.name} - ${periodStart} a ${periodEnd}`,
          periodStart: new Date(periodStart),
          periodEnd: new Date(periodEnd),
        },
      });
      created.push(payment);
    }
  }

  return { generated: created.length, payments: created };
}

module.exports = { list, getById, create, updateStatus, getPending, generateForPeriod };
