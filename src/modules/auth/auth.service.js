const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/database');
const env = require('../../config/env');
const AppError = require('../../utils/AppError');

const SALT_ROUNDS = 12;

function generateTokens(user) {
  const payload = { id: user.id, email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiration,
  });
  const refreshToken = jwt.sign({ id: user.id }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiration,
  });
  return { access_token: accessToken, refresh_token: refreshToken, expires_in: 900 };
}

async function register(data) {
  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: 'member',
      },
    });

    const member = await tx.member.create({
      data: {
        userId: user.id,
        firstName: data.first_name,
        lastName: data.last_name,
        dni: data.dni,
        phone: data.phone || null,
        dateOfBirth: new Date(data.date_of_birth),
        status: 'trial',
      },
    });

    return { user, member };
  });

  const tokens = generateTokens(result.user);

  return {
    user: { id: result.user.id, email: result.user.email, role: result.user.role },
    member: {
      id: result.member.id,
      first_name: result.member.firstName,
      last_name: result.member.lastName,
      status: result.member.status,
    },
    tokens,
  };
}

async function login(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError('Credenciales invalidas', 401, 'INVALID_CREDENTIALS');
  }

  if (!user.isActive) {
    throw new AppError('Cuenta desactivada', 403, 'ACCOUNT_DISABLED');
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new AppError('Credenciales invalidas', 401, 'INVALID_CREDENTIALS');
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

  const tokens = generateTokens(user);
  return {
    user: { id: user.id, email: user.email, role: user.role },
    tokens,
  };
}

async function refreshToken(token) {
  try {
    const decoded = jwt.verify(token, env.jwt.refreshSecret);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || !user.isActive) {
      throw new AppError('Token invalido', 401, 'INVALID_TOKEN');
    }
    return generateTokens(user);
  } catch (err) {
    if (err.isOperational) throw err;
    throw new AppError('Token invalido o expirado', 401, 'INVALID_TOKEN');
  }
}

async function getProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { member: { include: { plan: true } } },
  });
  if (!user) throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND');

  const { password: _, ...userData } = user;
  return userData;
}

async function updateProfile(userId, data) {
  const member = await prisma.member.findUnique({ where: { userId } });
  if (!member) throw new AppError('Perfil no encontrado', 404, 'NOT_FOUND');

  const updated = await prisma.member.update({
    where: { id: member.id },
    data: {
      firstName: data.first_name ?? undefined,
      lastName: data.last_name ?? undefined,
      phone: data.phone ?? undefined,
      address: data.address ?? undefined,
      emergencyContact: data.emergency_contact ?? undefined,
      emergencyPhone: data.emergency_phone ?? undefined,
    },
  });
  return updated;
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('Usuario no encontrado', 404, 'NOT_FOUND');

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw new AppError('Contrasena actual incorrecta', 400, 'INVALID_PASSWORD');

  const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
}

module.exports = { register, login, refreshToken, getProfile, updateProfile, changePassword };
