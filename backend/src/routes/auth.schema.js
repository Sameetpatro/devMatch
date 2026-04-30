const { z } = require('zod');

// Allow common phone formats: +91 9876543210, +1-555-123-4567, 9876543210, etc.
// We accept anything 7..30 chars made of digits, spaces, dashes, parens, and a
// leading + — keeping it lenient to match real-world patterns.
const phoneRegex = /^\+?[\d\s\-()]{7,30}$/;
const optionalUrl = z.string().trim().url().max(200).optional().or(z.literal('').transform(() => undefined));
const optionalShort = z.string().trim().min(1).max(80).optional().or(z.literal('').transform(() => undefined));

const registerSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1).max(80).trim(),
  role: z.string().min(1).max(60).trim(),
  bio: z.string().max(1000).optional(),
  experienceYears: z.number().int().min(0).max(60).optional(),
  skills: z.array(z.string().min(1).max(40)).max(30).optional(),

  // --- Contact info ---
  phone: z
    .string()
    .trim()
    .min(7, 'Phone is required')
    .max(30)
    .regex(phoneRegex, 'Phone must be a valid number (digits, spaces, dashes, optional +)'),
  linkedin: optionalUrl,
  github: optionalUrl,
  telegram: optionalShort,
});

const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

module.exports = { registerSchema, loginSchema };
