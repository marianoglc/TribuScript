const { z } = require('zod');

const create = z.object({
  body: z.object({
    member_id: z.string().uuid(),
    class_id: z.string().uuid(),
    date: z.string().date(),
    status: z.enum(['present', 'absent', 'late', 'justified']),
    notes: z.string().optional(),
  }),
});

const bulk = z.object({
  body: z.object({
    class_id: z.string().uuid(),
    date: z.string().date(),
    records: z.array(z.object({
      member_id: z.string().uuid(),
      status: z.enum(['present', 'absent', 'late', 'justified']),
      notes: z.string().optional(),
    })).min(1),
  }),
});

const update = z.object({
  body: z.object({
    status: z.enum(['present', 'absent', 'late', 'justified']).optional(),
    notes: z.string().optional(),
  }),
});

module.exports = { create, bulk, update };
