import { ZodError } from 'zod';

// Errores de datos con un tipo estable para que cada pantalla reaccione igual (SY-01).
// El detalle técnico nunca llega al mensaje visible ni a los logs (RNF-19).
export type DataErrorKind = 'offline' | 'session' | 'consent' | 'conflict' | 'invalid' | 'unknown';

export class DataError extends Error {
  constructor(readonly kind: DataErrorKind, readonly userMessage?: string) {
    super(userMessage ?? kind);
    this.name = 'DataError';
  }
}

const messages: Record<DataErrorKind, string> = {
  offline: 'Sin conexión. Lo que ves puede no estar al día.',
  session: 'Tu sesión expiró. Inicia sesión de nuevo.',
  consent: 'Necesitamos tu consentimiento para guardar datos de salud.',
  conflict: 'Ese registro ya existe.',
  invalid: 'Revisa los datos e inténtalo de nuevo.',
  unknown: 'Algo falló. Inténtalo de nuevo.',
};

export const dataErrorMessage = (error: DataError) => error.userMessage ?? messages[error.kind];

const offlinePattern = /network request failed|failed to fetch|fetch failed|network error/i;

function kindFromCode(code: string): DataErrorKind | null {
  if (code === '42501') return 'consent';
  if (code === '23505') return 'conflict';
  if (code === '23514' || code === '23503' || code === '23502' || code === '22P02') return 'invalid';
  if (code.startsWith('PGRST30')) return 'session';
  return null;
}

export function toDataError(error: unknown): DataError {
  if (error instanceof DataError) return error;
  if (error instanceof ZodError) return new DataError('invalid');
  if (typeof error === 'object' && error !== null) {
    const { code, message, status, name } = error as { code?: unknown; message?: unknown; status?: unknown; name?: unknown };
    if (name === 'AuthSessionMissingError' || status === 401) return new DataError('session');
    if (typeof message === 'string' && offlinePattern.test(message)) return new DataError('offline');
    if (typeof code === 'string') {
      const kind = kindFromCode(code);
      if (kind) return new DataError(kind);
    }
  }
  return new DataError('unknown');
}

// Lanza un DataError si la respuesta de Supabase trae error; si no, devuelve los datos.
export function unwrap<T>(result: { data: T; error: unknown }): T {
  if (result.error) throw toDataError(result.error);
  return result.data;
}
