const { z } = require('zod');

const create = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    description: z.string().optional(),
    price: z.number().min(0),
    billing_period: z.enum(['monthly', 'quarterly', 'semi_annual', 'annual']),
    max_disciplines: z.number().int().min(1).nullable().optional(),
    discipline_ids: z.array(z.string().uuid()).optional(),
  }),
});

const update = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().optional(),
    price: z.number().min(0).optional(),
    billing_period: z.enum(['monthly', 'quarterly', 'semi_annual', 'annual']).optional(),
    max_disciplines: z.number().int().min(1).nullable().optional(),
    is_active: z.boolean().optional(),
  }),
});

const addDiscipline = z.object({
  body: z.object({
    discipline_id: z.string().uuid(),
  }),
});

module.exports = { create, update, addDiscipline };
