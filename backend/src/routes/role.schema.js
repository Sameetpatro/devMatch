const { z } = require('zod');

const createRoleSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(100),
  companyName: z.string().min(1, 'Company name is required').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  location: z.string().max(100).optional(),
  isRemote: z.boolean().optional().default(true),
  experienceYearsRequired: z.number().int().min(0).max(40).optional().default(0),
  salaryRange: z.string().max(60).optional(),
  skills: z.array(z.string().min(1).max(40)).min(1, 'At least one skill is required'),
});

const updateRoleSchema = z.object({
  title: z.string().min(2).max(100).optional(),
  companyName: z.string().min(1).max(100).optional(),
  description: z.string().min(10).optional(),
  location: z.string().max(100).optional(),
  isRemote: z.boolean().optional(),
  experienceYearsRequired: z.number().int().min(0).max(40).optional(),
  salaryRange: z.string().max(60).optional(),
  status: z.enum(['OPEN', 'CLOSED']).optional(),
});

const applyRoleSchema = z.object({
  coverLetter: z.string().max(2000).optional(),
});

const decisionSchema = z.object({
  decision: z.enum(['ACCEPTED', 'REJECTED'], {
    errorMap: () => ({ message: 'Decision must be either ACCEPTED or REJECTED' }),
  }),
});

module.exports = {
  createRoleSchema,
  updateRoleSchema,
  applyRoleSchema,
  decisionSchema,
};

