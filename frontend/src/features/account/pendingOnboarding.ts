import { useEffect, useState } from 'react';
import { z } from 'zod';
import { clearPendingOnboarding, readPendingOnboardingRaw, writePendingOnboardingRaw } from '../../storage/pendingOnboarding';
import { OnboardingPayloadSchema, type AccountStatus, type OnboardingPayload } from './data/account.mappers';

export { clearPendingOnboarding };

// Perfil del onboarding hecho antes de crear la cuenta (AU-01). Son datos de salud en el teléfono
// sin cuenta (SRS 11.4, RNF-05): se guardan lo mínimo y caducan a los 7 días.
export const PENDING_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const PendingSchema = z.object({
  version: z.literal(2),
  savedAt: z.iso.datetime(),
  // Correo con el que se crea o inicia la cuenta; liga el pendiente a esa persona.
  email: z.string().optional(),
  payload: OnboardingPayloadSchema,
});
export type PendingOnboarding = z.infer<typeof PendingSchema>;

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const serializePending = (payload: OnboardingPayload, now: Date): string =>
  JSON.stringify({ version: 2, savedAt: now.toISOString(), payload } satisfies PendingOnboarding);

// null si no hay nada, está dañado, es de otra versión o caducó. `discard` avisa que hay que borrarlo.
export function parsePending(raw: string | null, now: Date): { pending: PendingOnboarding | null; discard: boolean } {
  if (raw === null) return { pending: null, discard: false };
  try {
    const parsed = PendingSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return { pending: null, discard: true };
    const age = now.getTime() - Date.parse(parsed.data.savedAt);
    // Una fecha futura (reloj movido) también se descarta: no se puede garantizar la caducidad.
    if (age > PENDING_MAX_AGE_MS || age < 0) return { pending: null, discard: true };
    return { pending: parsed.data, discard: false };
  } catch {
    return { pending: null, discard: true };
  }
}

export async function readPendingOnboarding(now: Date = new Date()): Promise<PendingOnboarding | null> {
  const { pending, discard } = parsePending(await readPendingOnboardingRaw().catch(() => null), now);
  if (discard) await clearPendingOnboarding().catch(() => undefined);
  return pending;
}

export async function writePendingOnboarding(payload: OnboardingPayload, now: Date = new Date()): Promise<void> {
  await writePendingOnboardingRaw(serializePending(payload, now));
}

// Liga el pendiente al correo con el que se va a crear o iniciar la cuenta, antes de llamar a Supabase.
// Sin pendiente no hace nada; si se reintenta con otro correo, se sobrescribe.
export async function bindPendingOnboardingEmail(email: string, now: Date = new Date()): Promise<void> {
  const pending = await readPendingOnboarding(now);
  if (!pending) return;
  await writePendingOnboardingRaw(JSON.stringify({ ...pending, email: normalizeEmail(email) } satisfies PendingOnboarding));
}

// Qué hacer con el pendiente según el estado de la cuenta. Un solo intento automático: el reintento
// lo decide la persona. 'wait' = aún no se sabe el estado.
export type PendingDecision = 'wait' | 'discard' | 'save' | 'none';
// Solo se guarda si el pendiente está ligado al mismo correo de la sesión: si falta o difiere
// (otra persona en el mismo teléfono) se descarta sin guardar nada.
export function decidePending(
  status: AccountStatus | undefined, pending: { email?: string } | null, sessionEmail: string | null | undefined,
): PendingDecision {
  if (!status) return 'wait';
  if (!pending) return 'none';
  if (status !== 'needs-onboarding') return 'discard';
  const same = !!pending.email && !!sessionEmail && normalizeEmail(pending.email) === normalizeEmail(sessionEmail);
  return same ? 'save' : 'discard';
}

// Para la nota de AuthScreen: ¿hay un perfil listo esperando cuenta?
export function useHasPendingOnboarding(): boolean {
  const [has, setHas] = useState(false);
  useEffect(() => {
    let cancelled = false;
    readPendingOnboarding().then((pending) => { if (!cancelled) setHas(pending !== null); }).catch(() => undefined);
    return () => { cancelled = true; };
  }, []);
  return has;
}
