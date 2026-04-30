const { z } = require('zod');

const swipeBody = z.object({
  toUserId: z.number().int().positive(),
  direction: z.enum(['LIKE', 'PASS']),
});

module.exports = { swipeBody };
