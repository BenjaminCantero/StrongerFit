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

// Eliminación de cuenta con plazo de gracia (CU-08): 'none' sin solicitud abierta,
// 'pending' con la fecha en que se ejecutará (ISO 8601).
export const AccountDeletionSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('none') }),
  z.object({ status: z.literal('pending'), scheduledFor: z.iso.datetime({ offset: true }) }),
]);

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
export type IdentityResponse = z.infer<typeof IdentityResponseSchema>;
export type AccountDeletion = z.infer<typeof AccountDeletionSchema>;
