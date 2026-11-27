import { describe, expect, it } from 'vitest';
import { routeAccess, shouldPurge } from './access';

describe('routeAccess', () => {
  const base = { configured: true, sessionReady: true, userId: 'u1', status: 'ready' as const, statusError: false, deletion: 'none' as const, deletionError: false };

  it('sin claves de Supabase permite usar la app localmente', () => {
    expect(routeAccess({ ...base, configured: false, userId: null, status: undefined })).toBe('signed-out');
  });

  it('espera la sesión y el estado de la cuenta', () => {
    expect(routeAccess({ ...base, sessionReady: false })).toBe('loading');
    expect(routeAccess({ ...base, status: undefined })).toBe('loading');
    expect(routeAccess({ ...base, deletion: undefined })).toBe('loading');
  });

  it('sin sesión usa el modo local', () => {
    expect(routeAccess({ ...base, userId: null, status: undefined })).toBe('signed-out');
  });

  it('con sesión sigue el estado de la cuenta', () => {
    expect(routeAccess({ ...base, status: 'needs-onboarding' })).toBe('needs-onboarding');
    expect(routeAccess({ ...base, status: 'needs-consent' })).toBe('needs-consent');
    expect(routeAccess(base)).toBe('ready');
  });

  it('si no se pudo leer el estado y no hay caché, ofrece reintentar', () => {
    expect(routeAccess({ ...base, status: undefined, statusError: true })).toBe('status-error');
  });
});

describe('routeAccess con eliminación programada', () => {
  const base = { configured: true, sessionReady: true, userId: 'u1', status: 'ready' as const, statusError: false, deletion: 'pending' as const, deletionError: false };

  it('bloquea una cuenta lista con eliminación pendiente', () => {
    expect(routeAccess(base)).toBe('deletion-pending');
  });

  it('tiene prioridad sobre onboarding, consentimiento y el estado aún sin cargar', () => {
    expect(routeAccess({ ...base, status: 'needs-onboarding' })).toBe('deletion-pending');
    expect(routeAccess({ ...base, status: 'needs-consent' })).toBe('deletion-pending');
    expect(routeAccess({ ...base, status: undefined })).toBe('deletion-pending');
  });

  it('si no se pudo comprobar, no deja pasar y ofrece reintentar', () => {
    expect(routeAccess({ ...base, deletion: undefined, deletionError: true })).toBe('deletion-error');
    expect(routeAccess({ ...base, deletion: undefined })).toBe('loading');
  });

  it('sin sesión no aplica la guarda', () => {
    expect(routeAccess({ ...base, userId: null, status: undefined, deletion: undefined })).toBe('signed-out');
  });

  it('con deletion none sigue el flujo normal', () => {
    expect(routeAccess({ ...base, deletion: 'none' })).toBe('ready');
  });
});

describe('shouldPurge', () => {
  it('limpia los datos locales cuando entra otra cuenta', () => {
    expect(shouldPurge('u1', 'u2')).toBe(true);
  });

  it('conserva los datos si vuelve la misma cuenta o es la primera', () => {
    expect(shouldPurge('u1', 'u1')).toBe(false);
    expect(shouldPurge(null, 'u1')).toBe(false);
  });
});
