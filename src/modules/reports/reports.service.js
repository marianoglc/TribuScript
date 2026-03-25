const prisma = require('../../config/database');

async function revenue(query) {
  const where = { status: 'completed' };
  if (query.date_from) where.paidAt = { ...where.paidAt, gte: new Date(query.date_from) };
  if (query.date_to) where.paidAt = { ...where.paidAt, lte: new Date(query.date_to) };
  if (query.payment_method) where.paymentMethod = query.payment_method;

  const payments = await prisma.payment.findMany({ where, orderBy: { paidAt: 'asc' } });

  const total = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const count = payments.length;

  // Group by method
  const byMethod = {};
  for (const p of payments) {
    byMethod[p.paymentMethod] = (byMethod[p.paymentMethod] || 0) + Number(p.amount);
  }

  // Group by month
  const byMonth = {};
  for (const p of payments) {
    const key = p.paidAt.toISOString().slice(0, 7); // YYYY-MM
    if (!byMonth[key]) byMonth[key] = { period: key, total: 0, count: 0 };
    byMonth[key].total += Number(p.amount);
    byMonth[key].count += 1;
  }

  return {
    summary: { total, count, average: count ? +(total / count).toFixed(2) : 0 },
    breakdown: Object.values(byMonth),
    by_method: byMethod,
  };
}

async function debtors() {
  const pending = await prisma.payment.findMany({
    where: { status: 'pending', periodEnd: { lt: new Date() } },
    include: {
      member: { select: { id: true, firstName: true, lastName: true, dni: true, phone: true, status: true } },
    },
    orderBy: { periodEnd: 'asc' },
  });

  // Group by member
  const memberMap = {};
  for (const p of pending) {
    const mid = p.memberId;
    if (!memberMap[mid]) {
      memberMap[mid] = { member: p.member, total_debt: 0, overdue_payments: [] };
    }
    memberMap[mid].total_debt += Number(p.amount);
    memberMap[mid].overdue_payments.push({
      id: p.id,
      amount: Number(p.amount),
      period_start: p.periodStart,
      period_end: p.periodEnd,
    });
  }

  return Object.values(memberMap).sort((a, b) => b.total_debt - a.total_debt);
}

async function attendance(query) {
  const where = {};
  if (query.discipline_id) {
    where.class = { disciplineId: query.discipline_id };
  }
  if (query.date_from || query.date_to) {
    where.date = {};
    if (query.date_from) where.date.gte = new Date(query.date_from);
    if (query.date_to) where.date.lte = new Date(query.date_to);
  }

  const records = await prisma.attendance.findMany({
    where,
    include: { class: { select: { discipline: { select: { id: true, name: true } } } } },
  });

  const total = records.length;
  const present = records.filter((r) => r.status === 'present' || r.status === 'late').length;
  const absent = records.filter((r) => r.status === 'absent').length;

  // By discipline
  const byDiscipline = {};
  for (const r of records) {
    const name = r.class.discipline.name;
    if (!byDiscipline[name]) byDiscipline[name] = { total: 0, present: 0, absent: 0 };
    byDiscipline[name].total += 1;
    if (r.status === 'present' || r.status === 'late') byDiscipline[name].present += 1;
    if (r.status === 'absent') byDiscipline[name].absent += 1;
  }

  // Add attendance rate
  for (const d of Object.values(byDiscipline)) {
    d.rate = d.total ? +((d.present / d.total) * 100).toFixed(1) : 0;
  }

  return {
    summary: { total, present, absent, rate: total ? +((present / total) * 100).toFixed(1) : 0 },
    by_discipline: byDiscipline,
  };
}

async function occupancy() {
  const disciplines = await prisma.discipline.findMany({
    where: { isActive: true },
    include: { _count: { select: { enrollments: { where: { status: 'active' } } } } },
  });

  return disciplines.map((d) => ({
    id: d.id,
    name: d.name,
    category: d.category,
    max_capacity: d.maxCapacity,
    enrolled: d._count.enrollments,
    occupancy_rate: +((d._count.enrollments / d.maxCapacity) * 100).toFixed(1),
  })).sort((a, b) => b.occupancy_rate - a.occupancy_rate);
}

async function members(query) {
  const dateFrom = query.date_from ? new Date(query.date_from) : new Date(new Date().getFullYear(), 0, 1);
  const dateTo = query.date_to ? new Date(query.date_to) : new Date();

  const [newMembers, totalActive, totalInactive, totalSuspended] = await Promise.all([
    prisma.member.count({ where: { enrollmentDate: { gte: dateFrom, lte: dateTo } } }),
    prisma.member.count({ where: { status: 'active' } }),
    prisma.member.count({ where: { status: 'inactive' } }),
    prisma.member.count({ where: { status: 'suspended' } }),
  ]);

  return {
    new_members: newMembers,
    total_active: totalActive,
    total_inactive: totalInactive,
    total_suspended: totalSuspended,
    period: { from: dateFrom, to: dateTo },
  };
}

module.exports = { revenue, debtors, attendance, occupancy, members };
