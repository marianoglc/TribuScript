const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');
const { getPagination, paginatedResponse } = require('../../utils/pagination');

async function list(query) {
  const { page, limit, skip } = getPagination(query);
  const where = {};
  if (query.is_active !== undefined) where.isActive = query.is_active === 'true';

  const [items, total] = await Promise.all([
    prisma.plan.findMany({
      where,
      include: { planDisciplines: { include: { discipline: true } }, _count: { select: { members: true } } },
      skip,
      take: limit,
      orderBy: { price: 'asc' },
    }),
    prisma.plan.count({ where }),
  ]);
  return paginatedResponse(items, total, { page, limit });
}

async function getById(id) {
  const plan = await prisma.plan.findUnique({
    where: { id },
    include: { planDisciplines: { include: { discipline: true } }, _count: { select: { members: true } } },
  });
  if (!plan) throw new AppError('Plan no encontrado', 404, 'PLAN_NOT_FOUND');
  return plan;
}

async function create(data) {
  return prisma.$transaction(async (tx) => {
    const plan = await tx.plan.create({
      data: {
        name: data.name,
        description: data.description || null,
        price: data.price,
        billingPeriod: data.billing_period,
        maxDisciplines: data.max_disciplines ?? null,
      },
    });

    if (data.discipline_ids?.length) {
      await tx.planDiscipline.createMany({
        data: data.discipline_ids.map((did) => ({ planId: plan.id, disciplineId: did })),
      });
    }

    return tx.plan.findUnique({
      where: { id: plan.id },
      include: { planDisciplines: { include: { discipline: true } } },
    });
  });
}

async function update(id, data) {
  await getById(id);
  return prisma.plan.update({
    where: { id },
    data: {
      name: data.name ?? undefined,
      description: data.description ?? undefined,
      price: data.price ?? undefined,
      billingPeriod: data.billing_period ?? undefined,
      maxDisciplines: data.max_disciplines !== undefined ? data.max_disciplines : undefined,
      isActive: data.is_active ?? undefined,
    },
    include: { planDisciplines: { include: { discipline: true } } },
  });
}

async function remove(id) {
  await getById(id);
  return prisma.plan.update({ where: { id }, data: { isActive: false } });
}

async function addDiscipline(planId, disciplineId) {
  await getById(planId);
  const discipline = await prisma.discipline.findUnique({ where: { id: disciplineId } });
  if (!discipline) throw new AppError('Disciplina no encontrada', 404, 'DISCIPLINE_NOT_FOUND');

  return prisma.planDiscipline.create({
    data: { planId, disciplineId },
    include: { discipline: true },
  });
}

async function removeDiscipline(planId, disciplineId) {
  const link = await prisma.planDiscipline.findFirst({ where: { planId, disciplineId } });
  if (!link) throw new AppError('La disciplina no esta asociada al plan', 404, 'NOT_FOUND');
  await prisma.planDiscipline.delete({ where: { id: link.id } });
}

module.exports = { list, getById, create, update, remove, addDiscipline, removeDiscipline };
