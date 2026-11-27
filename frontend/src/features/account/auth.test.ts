import { afterEach, describe, expect, it, vi } from 'vitest';
import { authErrorMessage, validateAuthForm } from './domain';

describe('formulario de cuenta (RF-01)', () => {
  const form = { email: 'ana@example.com', password: 'segura123', confirm: 'segura123' };
  it('valida correo, largo de contraseña y confirmación', () => {
    expect(validateAuthForm('signup', form)).toEqual({});
    expect(Object.keys(validateAuthForm('signup', { email: 'ana', password: 'corta', confirm: 'otra' })).sort()).toEqual(['confirm', 'email', 'password']);
    expect(validateAuthForm('signin', { ...form, password: '' })).toHaveProperty('password');
    expect(validateAuthForm('reset', { email: 'ana@example.com', password: '', confirm: '' })).toEqual({});
  });
  it('traduce errores conocidos y oculta los desconocidos', () => {
    expect(authErrorMessage({ code: 'invalid_credentials' })).toMatch(/incorrectos/);
    expect(authErrorMessage({ code: 'algo_raro' })).toMatch(/No pudimos/);
  });
});

describe('deleteAccount (CU-08)', () => {
  const session = { access_token: 'tok' };
  const setup = (response: Response | Error) => {
    vi.resetModules();
    vi.doMock('../../lib/env', () => ({ apiUrl: 'http://api.test/' }));
    vi.doMock('../../lib/supabase', () => ({ getSupabase: () => ({ auth: {
      getUser: async () => ({ data: { user: { email: 'ana@example.com' } } }),
      signInWithPassword: async () => ({ data: { session }, error: null }),
    } }) }));
    vi.doMock('./pendingOnboarding', () => ({ bindPendingOnboardingEmail: async () => undefined }));
    vi.stubGlobal('fetch', vi.fn(async () => { if (response instanceof Error) throw response; return response; }));
    return import('./auth');
  };
  const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
  afterEach(() => { vi.unstubAllGlobals(); vi.doUnmock('../../lib/env'); vi.doUnmock('../../lib/supabase'); vi.doUnmock('./pendingOnboarding'); });

  it('acepta 202 y devuelve la fecha programada', async () => {
    const { deleteAccount } = await setup(json(202, { status: 'pending', scheduledFor: '2026-12-01T15:00:00.000Z' }));
    expect(await deleteAccount('segura123')).toEqual({ ok: true, scheduledFor: '2026-12-01T15:00:00.000Z' });
    expect(fetch).toHaveBeenCalledWith('http://api.test/v1/me', expect.objectContaining({ method: 'DELETE' }));
  });

  it('rechaza el 204 antiguo, un cuerpo inválido y un estado none', async () => {
    for (const response of [new Response(null, { status: 204 }), json(202, { nope: true }), json(202, { status: 'none' }), new Response('x', { status: 202 })]) {
      const { deleteAccount } = await setup(response);
      expect(await deleteAccount('segura123')).toEqual({ ok: false, message: 'El servidor no pudo eliminar tu cuenta. Inténtalo más tarde.' });
    }
  });

  it('informa la falta de conexión', async () => {
    const { deleteAccount } = await setup(new Error('Network request failed'));
    expect(await deleteAccount('segura123')).toEqual({ ok: false, message: 'No hay conexión con el servidor. Inténtalo más tarde.' });
  });
});
