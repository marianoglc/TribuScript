const { z } = require('zod');

const register = z.object({
  body: z.object({
    email: z.string().email('Email invalido'),
    password: z.string().min(8, 'La contrasena debe tener al menos 8 caracteres'),
    first_name: z.string().min(2).max(100),
    last_name: z.string().min(2).max(100),
    dni: z.string().min(6).max(20),
    phone: z.string().optional(),
    date_of_birth: z.string().date('Fecha invalida (YYYY-MM-DD)'),
  }),
});

const login = z.object({
  body: z.object({
    email: z.string().email('Email invalido'),
    password: z.string().min(1, 'Contrasena requerida'),
  }),
});

const forgotPassword = z.object({
  body: z.object({
    email: z.string().email('Email invalido'),
  }),
});

const resetPassword = z.object({
  body: z.object({
    token: z.string().min(1),
    password: z.string().min(8, 'La contrasena debe tener al menos 8 caracteres'),
  }),
});

const updateProfile = z.object({
  body: z.object({
    first_name: z.string().min(2).max(100).optional(),
    last_name: z.string().min(2).max(100).optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    emergency_contact: z.string().optional(),
    emergency_phone: z.string().optional(),
  }),
});

const changePassword = z.object({
  body: z.object({
    current_password: z.string().min(1),
    new_password: z.string().min(8, 'La contrasena debe tener al menos 8 caracteres'),
  }),
});

module.exports = { register, login, forgotPassword, resetPassword, updateProfile, changePassword };
