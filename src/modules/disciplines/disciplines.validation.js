const { z } = require('zod');

const create = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    description: z.string().optional(),
    category: z.enum(['sport', 'art', 'wellness', 'academic', 'other']),
    max_capacity: z.number().int().min(1),
    image_url: z.string().url().optional(),
  }),
});

const update = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().optional(),
    category: z.enum(['sport', 'art', 'wellness', 'academic', 'other']).optional(),
    max_capacity: z.number().int().min(1).optional(),
    is_active: z.boolean().optional(),
    image_url: z.string().url().nullable().optional(),
  }),
});

module.exports = { create, update };
