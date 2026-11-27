import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountDeletionSchema, HealthResponseSchema, IdentityResponseSchema } from '@strongerfit/contracts';
import { createApp } from '../src/app';

const { getUser, deleteUser, rpc, maybeSingle } = vi.hoisted(() => ({
  getUser: vi.fn(), deleteUser: vi.fn(), rpc: vi.fn(), maybeSingle: vi.fn(),
}));
vi.mock('@supabase/supabase-js', () => {
  const query = { select: () => query, eq: () => query, in: () => query, maybeSingle };
  return { createClient: () => ({ auth: { getUser, admin: { deleteUser } }, rpc, from: () => query }) };
});

beforeEach(() => { getUser.mockReset(); deleteUser.mockReset(); rpc.mockReset(); maybeSingle.mockReset(); });

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

  const id = 'dca740c0-b831-4e58-9009-a83cec248109';
  const config = { supabaseUrl: 'https://example.supabase.co', supabaseAnonKey: 'public-key' };
  const auth = { Authorization: 'Bearer valid-token' };
  const signedIn = () => getUser.mockResolvedValue({ data: { user: { id } }, error: null });

  it('programa la eliminación con plazo de gracia sin borrar la cuenta (CU-08)', async () => {
    signedIn();
    rpc.mockResolvedValue({ data: '2026-12-01T10:00:00+00:00', error: null });
    const response = await createApp(config).request('/v1/me', { method: 'DELETE', headers: auth });
    expect(response.status).toBe(202);
    expect(AccountDeletionSchema.parse(await response.json())).toEqual({ status: 'pending', scheduledFor: '2026-12-01T10:00:00.000Z' });
    expect(rpc).toHaveBeenCalledWith('request_account_deletion');
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it('no solicita la eliminación sin token ni con Supabase sin configurar', async () => {
    expect((await createApp().request('/v1/me', { method: 'DELETE' })).status).toBe(401);
    expect((await createApp().request('/v1/me', { method: 'DELETE', headers: auth })).status).toBe(503);
    expect(rpc).not.toHaveBeenCalled();
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it('responde 502 si la base falla al solicitar', async () => {
    signedIn();
    rpc.mockResolvedValue({ data: null, error: new Error('boom') });
    expect((await createApp(config).request('/v1/me', { method: 'DELETE', headers: auth })).status).toBe(502);
  });

  it('consulta el estado de la eliminación', async () => {
    signedIn();
    const app = createApp(config);
    maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    let response = await app.request('/v1/me/deletion', { headers: auth });
    expect(response.status).toBe(200);
    expect(AccountDeletionSchema.parse(await response.json())).toEqual({ status: 'none' });
    maybeSingle.mockResolvedValueOnce({ data: { scheduled_for: '2026-12-01T10:00:00+00:00' }, error: null });
    response = await app.request('/v1/me/deletion', { headers: auth });
    expect(AccountDeletionSchema.parse(await response.json())).toEqual({ status: 'pending', scheduledFor: '2026-12-01T10:00:00.000Z' });
    maybeSingle.mockResolvedValueOnce({ data: null, error: new Error('boom') });
    expect((await app.request('/v1/me/deletion', { headers: auth })).status).toBe(502);
  });

  it('cancela la eliminación o responde 404 si no había solicitud', async () => {
    signedIn();
    const app = createApp(config);
    rpc.mockResolvedValueOnce({ data: true, error: null });
    let response = await app.request('/v1/me/deletion/cancel', { method: 'POST', headers: auth });
    expect(response.status).toBe(200);
    expect(AccountDeletionSchema.parse(await response.json())).toEqual({ status: 'none' });
    expect(rpc).toHaveBeenCalledWith('cancel_account_deletion');
    rpc.mockResolvedValueOnce({ data: false, error: null });
    response = await app.request('/v1/me/deletion/cancel', { method: 'POST', headers: auth });
    expect(response.status).toBe(404);
    expect(response.headers.get('content-type')).toContain('application/problem+json');
    rpc.mockResolvedValueOnce({ data: null, error: new Error('boom') });
    expect((await app.request('/v1/me/deletion/cancel', { method: 'POST', headers: auth })).status).toBe(502);
  });

  it('exige sesión para consultar y cancelar la eliminación', async () => {
    const app = createApp(config);
    expect((await app.request('/v1/me/deletion')).status).toBe(401);
    expect((await app.request('/v1/me/deletion/cancel', { method: 'POST' })).status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('documenta los endpoints de eliminación', async () => {
    const spec = await (await createApp().request('/openapi.json')).json();
    expect(spec.paths['/v1/me'].delete.responses['202']).toBeDefined();
    expect(spec.paths['/v1/me/deletion'].get.security).toEqual([{ bearerAuth: [] }]);
    expect(spec.paths['/v1/me/deletion/cancel'].post.responses['404']).toBeDefined();
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
