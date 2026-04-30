const { z } = require('zod');

// Free-form role so users can self-describe ("Backend Systems",
// "Android Developer", "ML/AI Engineer", etc.). Filtering in Step 4
// will use case-insensitive substring matching.
const registerSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1).max(80).trim(),
  role: z.string().min(1).max(60).trim(),
  bio: z.string().max(1000).optional(),
  experienceYears: z.number().int().min(0).max(60).optional(),
  skills: z.array(z.string().min(1).max(40)).max(30).optional(),
});

const loginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

module.exports = { registerSchema, loginSchema };
