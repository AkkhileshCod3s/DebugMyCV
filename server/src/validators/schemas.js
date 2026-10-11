import { z } from 'zod';
import { env } from '../config/env.js';

const MAX = env.MAX_INPUT_CHARACTERS;

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(120),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(255),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(72, 'Password must be at most 72 characters.'),
  consent: z
    .boolean()
    .refine((v) => v === true, { message: 'You must accept the Privacy Policy and Cookie Policy to register.' }),
  consentVersion: z
    .string()
    .trim()
    .min(1, 'Missing consent version. Please reload the page and try again.'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(255),
  password: z.string().min(1, 'Password is required.').max(72),
});

export const resumeTextSchema = z.object({
  originalFilename: z.string().trim().min(1).max(255).optional(),
  text: z.string().trim().min(50, 'Resume text is too short to analyse.').max(MAX, `Resume text must be at most ${MAX} characters.`),
});

export const jobSchema = z.object({
  label: z.string().trim().min(1, 'Add a short label for this job.').max(160),
  descriptionText: z.string().trim().min(30, 'Job description is too short.').max(MAX, `Job description must be at most ${MAX} characters.`),
});

export const analyzeSchema = z.object({
  resumeId: z.coerce.number().int().positive('Select a resume.'),
  jobDescriptionId: z.coerce.number().int().positive('Select a job description.'),
  aiConsent: z
    .boolean()
    .refine((v) => v === true, {
      message: 'AI processing consent is required to run an analysis.',
    }),
});

export const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

export const profileSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    currentPassword: z.string().min(1).max(72).optional(),
    newPassword: z.string().min(8).max(72).optional(),
  })
  .refine((v) => v.name !== undefined || (v.currentPassword && v.newPassword), {
    message: 'Provide a name or both current and new password.',
  });

/** Shape we require back from the AI provider (validated server-side). */
export const aiResultSchema = z.object({
  matchedSkills: z.array(z.string()).default([]),
  missingSkills: z.array(z.string()).default([]),
  relatedSkills: z.array(z.string()).default([]),
  strengths: z.array(z.string()).default([]),
  improvements: z.array(z.string()).default([]),
  requirementsNotMet: z.array(z.string()).default([]),
  suggestedKeywords: z.array(z.string()).default([]),
  interviewQuestions: z.array(z.string()).default([]),
  requirements: z
    .array(z.object({ requirement: z.string(), demonstrated: z.boolean() }))
    .default([]),
  scoreExplanation: z.string().default(''),
  resumeSummary: z.string().default(''),
});
