const { z } = require('zod');

const create = z.object({
  body: z.object({
    discipline_id: z.string().uuid(),
    instructor_id: z.string().uuid(),
    name: z.string().min(2).max(150),
    day_of_week: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
    start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
    end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
    location: z.string().optional(),
    max_capacity: z.number().int().min(1).optional(),
  }),
});

const update = z.object({
  body: z.object({
    instructor_id: z.string().uuid().optional(),
    name: z.string().min(2).max(150).optional(),
    day_of_week: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']).optional(),
    start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM').optional(),
    end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM').optional(),
    location: z.string().optional(),
    max_capacity: z.number().int().min(1).optional(),
    is_active: z.boolean().optional(),
  }),
});

module.exports = { create, update };
