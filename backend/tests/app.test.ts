import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HealthResponseSchema, IdentityResponseSchema } from '@strongerfit/contracts';
import { createApp } from '../src/app';

const { getUser } = vi.hoisted(() => ({ getUser: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ auth: { getUser } }),
}));

beforeEach(() => getUser.mockReset());

describe('API inicial', () => {
  it('sirve health con el contrato compartido sin depender de Supabase', async () => {
    const response = await createApp().request('/v1/health');
    expect(response.status).toBe(200);
    expect(HealthResponseSchema.parse(await response.json()).status).toBe('ok');
    expect(getUser).not.toHaveBeenCalled();
  });

  it('conserva el prefijo de la Edge Function y lo documenta', async () => {
    const app = createApp({ basePath: '/api' });
    expect((await app.request('/api/v1/health')).status).toBe(200);
    const spec = await (await app.request('/api/openapi.json')).json();
    expect(spec.openapi).toBe('3.1.0');
    expect(spec.paths['/api/v1/health'].get.responses['200']).toBeDefined();
    expect(spec.paths['/api/v1/me'].get.security).toEqual([{ bearerAuth: [] }]);
  });

  it('rechaza consultas privadas sin token', async () => {
    const response = await createApp().request('/v1/me');
    expect(response.status).toBe(401);
    expect(response.headers.get('content-type')).toContain('application/problem+json');
    expect(getUser).not.toHaveBeenCalled();
  });

  it('falla de forma cerrada si Supabase no está configurado', async () => {
    const response = await createApp().request('/v1/me', { headers: { Authorization: 'Bearer test' } });
    expect(response.status).toBe(503);
    expect(getUser).not.toHaveBeenCalled();
  });

  it('rechaza un token que Supabase no valida', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: new Error('invalid') });
    const app = createApp({ supabaseUrl: 'https://example.supabase.co', supabaseAnonKey: 'public-key' });
    const response = await app.request('/v1/me', { headers: { Authorization: 'Bearer invalid-token' } });
    expect(response.status).toBe(401);
    expect(getUser).toHaveBeenCalledWith('invalid-token');
  });

  it('devuelve únicamente la identidad validada por Supabase', async () => {
    const id = 'dca740c0-b831-4e58-9009-a83cec248109';
    getUser.mockResolvedValue({ data: { user: { id, email: 'private@example.com' } }, error: null });
    const app = createApp({ supabaseUrl: 'https://example.supabase.co', supabaseAnonKey: 'public-key' });
    const response = await app.request('/v1/me', { headers: { Authorization: 'Bearer valid-token' } });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(IdentityResponseSchema.parse(body)).toEqual({ id });
    expect(body).not.toHaveProperty('email');
  });

  it('limita el tamaño del cuerpo y entrega errores problem+json', async () => {
    const response = await createApp().request('/v1/me', {
      method: 'POST', body: 'x'.repeat(1024 * 1024 + 1),
    });
    expect(response.status).toBe(413);
    expect(response.headers.get('content-type')).toContain('application/problem+json');
  });

  it('no permite CORS para un origen desconocido', async () => {
    const response = await createApp().request('/v1/health', { headers: { Origin: 'https://unknown.example' } });
    expect(response.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('devuelve un error consistente para rutas desconocidas', async () => {
    const response = await createApp().request('/missing');
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ status: 404, type: 'about:blank' });
  });
});
