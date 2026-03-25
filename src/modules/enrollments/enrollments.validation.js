const { z } = require('zod');

const create = z.object({
  body: z.object({
    member_id: z.string().uuid(),
    discipline_id: z.string().uuid(),
  }),
});

module.exports = { create };
