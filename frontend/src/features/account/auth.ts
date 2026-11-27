import type { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { apiUrl } from '../../lib/env';
import { getSupabase } from '../../lib/supabase';
import { parseAccountDeletion } from './data/account.mappers';
import { bindPendingOnboardingEmail } from './pendingOnboarding';
import { authErrorMessage, type AuthForm, type AuthMode, type AuthResult } from './domain';

export * from './domain';

// RF-01: cuenta con Supabase Auth. Sin claves configuradas la app sigue funcionando solo en el dispositivo.
export const isAuthConfigured = () => !!process.env.EXPO_PUBLIC_SUPABASE_URL && !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  && !!apiUrl;

export async function submitAuth(mode: AuthMode, form: AuthForm): Promise<AuthResult> {
  const auth = getSupabase().auth;
  const email = form.email.trim().toLowerCase();
  // El onboarding pendiente se liga al correo con que se CREA la cuenta en este teléfono: solo esa cuenta
  // podrá guardarlo. En signin no se liga, para que otra persona no lo reclame con una cuenta existente.
  if (mode === 'signup') await bindPendingOnboardingEmail(email).catch(() => undefined);
  if (mode === 'signin') {
    const { error } = await auth.signInWithPassword({ email, password: form.password });
    return error ? { ok: false, message: authErrorMessage(error) } : { ok: true, signedIn: true };
  }
  if (mode === 'signup') {
    const { data, error } = await auth.signUp({ email, password: form.password });
    if (error) return { ok: false, message: authErrorMessage(error) };
    return data.session ? { ok: true, signedIn: true }
      : { ok: true, signedIn: false, message: 'Te enviamos un correo para confirmar tu cuenta. Después vuelve e inicia sesión.' };
  }
  const { error } = await auth.resetPasswordForEmail(email);
  return error ? { ok: false, message: authErrorMessage(error) }
    : { ok: true, signedIn: false, message: 'Si existe una cuenta con ese correo, te enviamos un enlace para recuperar el acceso.' };
}

// CU-08: reautentica con la contraseña y pide al servidor eliminar la cuenta. La eliminación queda programada
// (plazo de 4 días para cancelarla) y devuelve la fecha. NO cierra la sesión: quien llama muestra el aviso y
// luego cierra sesión y limpia el teléfono con signOutAndPurge.
export async function deleteAccount(password: string): Promise<{ ok: true; scheduledFor: string } | { ok: false; message: string }> {
  const auth = getSupabase().auth;
  const email = (await auth.getUser()).data.user?.email;
  if (!email) return { ok: false, message: 'Tu sesión expiró. Inicia sesión de nuevo.' };
  const { data, error } = await auth.signInWithPassword({ email, password });
  if (error || !data.session) return { ok: false, message: error ? authErrorMessage(error) : 'No pudimos confirmar tu identidad.' };
  const serverError = { ok: false, message: 'El servidor no pudo eliminar tu cuenta. Inténtalo más tarde.' } as const;
  let response: Response;
  try {
    response = await fetch(`${apiUrl.replace(/\/$/, '')}/v1/me`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${data.session.access_token}` },
    });
  } catch {
    return { ok: false, message: 'No hay conexión con el servidor. Inténtalo más tarde.' };
  }
  if (response.status !== 202) return serverError;
  const body = await response.json().then(parseAccountDeletion, () => null).catch(() => null);
  return body?.status === 'pending' ? { ok: true, scheduledFor: body.scheduledFor } : serverError;
}

export function useAuthSession() {
  const configured = isAuthConfigured();
  const [state, setState] = useState<{ ready: boolean; session: Session | null }>({ ready: !configured, session: null });
  useEffect(() => {
    if (!configured) return;
    const auth = getSupabase().auth;
    auth.getSession().then(({ data }) => setState({ ready: true, session: data.session })).catch(() => setState({ ready: true, session: null }));
    const { data } = auth.onAuthStateChange((_event, session) => setState({ ready: true, session }));
    return () => data.subscription.unsubscribe();
  }, [configured]);
  return { configured, ...state };
}
