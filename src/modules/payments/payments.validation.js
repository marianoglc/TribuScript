const { z } = require('zod');

const create = z.object({
  body: z.object({
    member_id: z.string().uuid(),
    amount: z.number().positive(),
    currency: z.string().length(3).default('ARS').optional(),
    payment_method: z.enum(['cash', 'card', 'transfer', 'other']),
    description: z.string().optional(),
    period_start: z.string().date(),
    period_end: z.string().date(),
  }),
});

const updateStatus = z.object({
  body: z.object({
    status: z.enum(['pending', 'completed', 'failed', 'refunded']),
  }),
});

module.exports = { create, updateStatus };
