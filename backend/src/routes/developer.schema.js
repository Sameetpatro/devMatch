const { z } = require('zod');

// `skills` accepts either ?skills=React,Node or ?skills=React&skills=Node.
const skillsParam = z
  .union([z.string(), z.array(z.string())])
  .optional()
  .transform((v) => {
    if (!v) return undefined;
    const arr = Array.isArray(v) ? v : v.split(',');
    return arr.map((s) => s.trim()).filter(Boolean);
  });

const boolish = z
  .union([z.string(), z.boolean()])
  .optional()
  .transform((v) => {
    if (v === undefined) return undefined;
    if (typeof v === 'boolean') return v;
    return v.toLowerCase() === 'true';
  });

const intParam = (def, min, max) =>
  z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v === undefined || v === '' ? def : Number(v)))
    .refine((n) => Number.isInteger(n) && n >= min && n <= max, `Must be int in [${min}, ${max}]`);

const developerListQuery = z.object({
  role: z.string().trim().min(1).max(60).optional(),
  search: z.string().trim().min(1).max(80).optional(),
  skills: skillsParam,
  availableOnly: boolish,
  page: intParam(1, 1, 1000),
  limit: intParam(20, 1, 100),
});

module.exports = { developerListQuery };
