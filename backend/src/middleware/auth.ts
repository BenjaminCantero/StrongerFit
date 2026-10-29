import { createClient } from '@supabase/supabase-js';
import { createMiddleware } from 'hono/factory';
import type { ApiConfig } from '../lib/config.ts';
import { problem } from '../lib/problem.ts';

export type AuthEnv = { Variables: { userId: string } };

export function requireAuth(config: ApiConfig) {
  return createMiddleware<AuthEnv>(async (c, next) => {
    const match = /^Bearer (\S+)$/i.exec(c.req.header('Authorization') ?? '');
    if (!match) return problem(c, 401, 'No autorizado', 'Se requiere una sesión válida.');

    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      return problem(c, 503, 'Servicio no disponible', 'La autenticación aún no está configurada.');
    }

    const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data, error } = await supabase.auth.getUser(match[1]);
    if (error || !data.user) {
      return problem(c, 401, 'No autorizado', 'La sesión expiró o no es válida.');
    }
    c.set('userId', data.user.id);
    await next();
  });
}
