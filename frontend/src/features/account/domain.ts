// Validación y mensajes de la cuenta, sin dependencias de React Native para poder probarlos.
export type AuthMode = 'signin' | 'signup' | 'reset';
export type AuthForm = { email: string; password: string; confirm: string };
export type AuthField = keyof AuthForm;
export const MIN_PASSWORD = 8;

export function validateAuthForm(mode: AuthMode, form: AuthForm): Partial<Record<AuthField, string>> {
  const errors: Partial<Record<AuthField, string>> = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Ingresa un correo válido.';
  if (mode === 'reset') return errors;
  if (mode === 'signup' && form.password.length < MIN_PASSWORD) errors.password = `Usa al menos ${MIN_PASSWORD} caracteres.`;
  if (mode === 'signin' && !form.password) errors.password = 'Ingresa tu contraseña.';
  if (mode === 'signup' && form.confirm !== form.password) errors.confirm = 'Las contraseñas no coinciden.';
  return errors;
}

// Mensajes en español para los códigos de Supabase Auth; nunca se muestra el error crudo.
export function authErrorMessage(error: { code?: string; status?: number } | null | undefined): string {
  switch (error?.code) {
    case 'invalid_credentials': return 'Correo o contraseña incorrectos.';
    case 'email_not_confirmed': return 'Confirma tu correo con el enlace que te enviamos antes de iniciar sesión.';
    case 'user_already_exists': case 'email_exists': return 'Ya existe una cuenta con ese correo. Inicia sesión o recupera tu acceso.';
    case 'weak_password': return `La contraseña es muy débil. Usa al menos ${MIN_PASSWORD} caracteres combinando letras y números.`;
    case 'over_email_send_rate_limit': case 'over_request_rate_limit': return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
    default: return 'No pudimos completar la solicitud. Revisa tu conexión e inténtalo de nuevo.';
  }
}


export type AuthResult = { ok: true; message?: string; signedIn: boolean } | { ok: false; message: string };
