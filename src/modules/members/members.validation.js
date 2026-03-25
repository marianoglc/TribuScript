const { z } = require('zod');

const create = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    first_name: z.string().min(2).max(100),
    last_name: z.string().min(2).max(100),
    dni: z.string().min(6).max(20),
    phone: z.string().optional(),
    date_of_birth: z.string().date(),
    gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
    address: z.string().optional(),
    emergency_contact: z.string().optional(),
    emergency_phone: z.string().optional(),
    plan_id: z.string().uuid().optional(),
  }),
});

const update = z.object({
  body: z.object({
    first_name: z.string().min(2).max(100).optional(),
    last_name: z.string().min(2).max(100).optional(),
    phone: z.string().optional(),
    gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
    address: z.string().optional(),
    emergency_contact: z.string().optional(),
    emergency_phone: z.string().optional(),
    plan_id: z.string().uuid().nullable().optional(),
  }),
});

const updateStatus = z.object({
  body: z.object({
    status: z.enum(['active', 'inactive', 'suspended', 'trial']),
  }),
});

module.exports = { create, update, updateStatus };
