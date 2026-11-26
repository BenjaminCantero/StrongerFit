import type { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { apiUrl } from '../../lib/env';
import { getSupabase } from '../../lib/supabase';
import { authErrorMessage, type AuthForm, type AuthMode, type AuthResult } from './domain';

export * from './domain';

// RF-01: cuenta con Supabase Auth. Sin claves configuradas la app sigue funcionando solo en el dispositivo.
export const isAuthConfigured = () => !!process.env.EXPO_PUBLIC_SUPABASE_URL && !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
  && !!apiUrl;

export async function submitAuth(mode: AuthMode, form: AuthForm): Promise<AuthResult> {
  const auth = getSupabase().auth;
  const email = form.email.trim().toLowerCase();
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

// CU-08: reautentica con la contraseña y pide al servidor eliminar la cuenta; luego cierra la sesión.
export async function deleteAccount(password: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const auth = getSupabase().auth;
  const email = (await auth.getUser()).data.user?.email;
  if (!email) return { ok: false, message: 'Tu sesión expiró. Inicia sesión de nuevo.' };
  const { data, error } = await auth.signInWithPassword({ email, password });
  if (error || !data.session) return { ok: false, message: error ? authErrorMessage(error) : 'No pudimos confirmar tu identidad.' };
  try {
    const response = await fetch(`${apiUrl.replace(/\/$/, '')}/v1/me`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${data.session.access_token}` },
    });
    if (response.status !== 204) return { ok: false, message: 'El servidor no pudo eliminar tu cuenta. Inténtalo más tarde.' };
  } catch {
    return { ok: false, message: 'No hay conexión con el servidor. Inténtalo más tarde.' };
  }
  await auth.signOut().catch(() => undefined);
  return { ok: true };
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
