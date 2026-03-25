const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.attendance.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.class.deleteMany();
  await prisma.planDiscipline.deleteMany();
  await prisma.member.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.discipline.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash('password123', 12);

  // Users
  const admin = await prisma.user.create({
    data: { email: 'admin@tribuscript.com', password, role: 'admin' },
  });

  const staff = await prisma.user.create({
    data: { email: 'staff@tribuscript.com', password, role: 'staff' },
  });

  const instructor1 = await prisma.user.create({
    data: { email: 'instructor1@tribuscript.com', password, role: 'instructor' },
  });

  const instructor2 = await prisma.user.create({
    data: { email: 'instructor2@tribuscript.com', password, role: 'instructor' },
  });

  const memberUser1 = await prisma.user.create({
    data: { email: 'juan@email.com', password, role: 'member' },
  });

  const memberUser2 = await prisma.user.create({
    data: { email: 'maria@email.com', password, role: 'member' },
  });

  const memberUser3 = await prisma.user.create({
    data: { email: 'carlos@email.com', password, role: 'member' },
  });

  // Instructor member profiles
  await prisma.member.create({
    data: {
      userId: instructor1.id, firstName: 'Laura', lastName: 'Garcia',
      dni: '30111222', dateOfBirth: new Date('1988-03-15'), status: 'active',
    },
  });

  await prisma.member.create({
    data: {
      userId: instructor2.id, firstName: 'Martin', lastName: 'Lopez',
      dni: '31222333', dateOfBirth: new Date('1990-07-20'), status: 'active',
    },
  });

  // Disciplines
  const futbol = await prisma.discipline.create({
    data: { name: 'Futbol', category: 'sport', maxCapacity: 30, description: 'Futbol 11 y futbol 5' },
  });

  const basquet = await prisma.discipline.create({
    data: { name: 'Basquet', category: 'sport', maxCapacity: 20, description: 'Basquet recreativo y competitivo' },
  });

  const yoga = await prisma.discipline.create({
    data: { name: 'Yoga', category: 'wellness', maxCapacity: 15, description: 'Hatha yoga y meditacion' },
  });

  const pintura = await prisma.discipline.create({
    data: { name: 'Pintura', category: 'art', maxCapacity: 12, description: 'Oleo, acuarela y dibujo' },
  });

  const natacion = await prisma.discipline.create({
    data: { name: 'Natacion', category: 'sport', maxCapacity: 25, description: 'Natacion para todas las edades' },
  });

  // Plans
  const planBasico = await prisma.plan.create({
    data: { name: 'Basico', price: 15000, billingPeriod: 'monthly', maxDisciplines: 1, description: '1 disciplina a eleccion' },
  });

  const planIntermedio = await prisma.plan.create({
    data: { name: 'Intermedio', price: 25000, billingPeriod: 'monthly', maxDisciplines: 3, description: 'Hasta 3 disciplinas' },
  });

  const planPremium = await prisma.plan.create({
    data: { name: 'Premium', price: 40000, billingPeriod: 'monthly', maxDisciplines: null, description: 'Acceso ilimitado a todas las disciplinas' },
  });

  // Link all disciplines to all plans (simplification for seed)
  for (const plan of [planBasico, planIntermedio, planPremium]) {
    for (const disc of [futbol, basquet, yoga, pintura, natacion]) {
      await prisma.planDiscipline.create({ data: { planId: plan.id, disciplineId: disc.id } });
    }
  }

  // Members
  const member1 = await prisma.member.create({
    data: {
      userId: memberUser1.id, firstName: 'Juan', lastName: 'Perez',
      dni: '33444555', phone: '+5491112345678', dateOfBirth: new Date('1995-01-10'),
      gender: 'male', status: 'active', planId: planPremium.id,
    },
  });

  const member2 = await prisma.member.create({
    data: {
      userId: memberUser2.id, firstName: 'Maria', lastName: 'Gonzalez',
      dni: '34555666', phone: '+5491198765432', dateOfBirth: new Date('1992-06-25'),
      gender: 'female', status: 'active', planId: planIntermedio.id,
    },
  });

  const member3 = await prisma.member.create({
    data: {
      userId: memberUser3.id, firstName: 'Carlos', lastName: 'Rodriguez',
      dni: '35666777', dateOfBirth: new Date('2000-11-03'),
      gender: 'male', status: 'trial',
    },
  });

  // Classes
  const claseFutbol = await prisma.class.create({
    data: {
      disciplineId: futbol.id, instructorId: instructor1.id,
      name: 'Futbol - Turno Manana', dayOfWeek: 'monday',
      startTime: '09:00', endTime: '10:30', location: 'Cancha 1', maxCapacity: 30,
    },
  });

  const claseYoga = await prisma.class.create({
    data: {
      disciplineId: yoga.id, instructorId: instructor2.id,
      name: 'Yoga - Turno Tarde', dayOfWeek: 'wednesday',
      startTime: '17:00', endTime: '18:00', location: 'Salon A', maxCapacity: 15,
    },
  });

  await prisma.class.create({
    data: {
      disciplineId: basquet.id, instructorId: instructor1.id,
      name: 'Basquet - Turno Noche', dayOfWeek: 'thursday',
      startTime: '20:00', endTime: '21:30', location: 'Gimnasio', maxCapacity: 20,
    },
  });

  // Enrollments
  await prisma.enrollment.create({ data: { memberId: member1.id, disciplineId: futbol.id } });
  await prisma.enrollment.create({ data: { memberId: member1.id, disciplineId: yoga.id } });
  await prisma.enrollment.create({ data: { memberId: member2.id, disciplineId: yoga.id } });
  await prisma.enrollment.create({ data: { memberId: member2.id, disciplineId: basquet.id } });

  // Payments
  await prisma.payment.create({
    data: {
      memberId: member1.id, amount: 40000, paymentMethod: 'transfer',
      status: 'completed', description: 'Cuota Premium - Marzo 2026',
      periodStart: new Date('2026-03-01'), periodEnd: new Date('2026-03-31'),
      paidAt: new Date(), receiptNumber: '2026-000001', processedBy: staff.id,
    },
  });

  await prisma.payment.create({
    data: {
      memberId: member2.id, amount: 25000, paymentMethod: 'cash',
      status: 'completed', description: 'Cuota Intermedio - Marzo 2026',
      periodStart: new Date('2026-03-01'), periodEnd: new Date('2026-03-31'),
      paidAt: new Date(), receiptNumber: '2026-000002', processedBy: staff.id,
    },
  });

  // Attendance
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.attendance.create({
    data: { memberId: member1.id, classId: claseFutbol.id, date: today, status: 'present', checkedBy: instructor1.id },
  });

  await prisma.attendance.create({
    data: { memberId: member1.id, classId: claseYoga.id, date: today, status: 'present', checkedBy: instructor2.id },
  });

  await prisma.attendance.create({
    data: { memberId: member2.id, classId: claseYoga.id, date: today, status: 'late', notes: 'Llego 10 min tarde', checkedBy: instructor2.id },
  });

  console.log('Seed completed!');
  console.log('');
  console.log('Usuarios de prueba (password: password123):');
  console.log('  Admin:       admin@tribuscript.com');
  console.log('  Staff:       staff@tribuscript.com');
  console.log('  Instructor:  instructor1@tribuscript.com');
  console.log('  Miembro:     juan@email.com');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
