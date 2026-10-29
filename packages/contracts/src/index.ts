import { z } from 'zod';

export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.literal('strongerfit-api'),
  version: z.literal('0.1.0'),
});

export const IdentityResponseSchema = z.object({ id: z.uuid() });

export const ProblemSchema = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int(),
  detail: z.string(),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
export type IdentityResponse = z.infer<typeof IdentityResponseSchema>;
