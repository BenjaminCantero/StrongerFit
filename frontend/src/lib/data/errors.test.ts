import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { DataError, dataErrorMessage, toDataError } from './errors';

const postgrest = (code: string, message = 'x') => ({ code, message, details: null, hint: null });

describe('toDataError', () => {
  it.each([
    ['42501', 'consent'],
    ['23505', 'conflict'],
    ['23514', 'invalid'],
    ['23503', 'invalid'],
    ['PGRST301', 'session'],
    ['PGRST303', 'session'],
    ['XX000', 'unknown'],
  ] as const)('el código %s es %s', (code, kind) => {
    expect(toDataError(postgrest(code)).kind).toBe(kind);
  });

  it.each(['TypeError: Network request failed', 'Failed to fetch', 'fetch failed'])('«%s» es sin conexión', (message) => {
    expect(toDataError(postgrest('', message)).kind).toBe('offline');
    expect(toDataError(new TypeError(message)).kind).toBe('offline');
  });

  it('una respuesta 401 es una sesión vencida', () => {
    expect(toDataError({ status: 401, message: 'JWT expired' }).kind).toBe('session');
  });

  it('una sesión ausente de Auth es una sesión vencida', () => {
    const error = Object.assign(new Error('Auth session missing!'), { name: 'AuthSessionMissingError' });
    expect(toDataError(error).kind).toBe('session');
  });

  it('un dato que no cumple el esquema es inválido', () => {
    const result = z.object({ id: z.uuid() }).safeParse({ id: 'no' });
    expect(result.success).toBe(false);
    if (!result.success) expect(toDataError(result.error).kind).toBe('invalid');
  });

  it('conserva un DataError existente', () => {
    const original = new DataError('conflict', 'ya existe');
    expect(toDataError(original)).toBe(original);
  });

  it('no copia el detalle técnico al mensaje visible', () => {
    const error = toDataError(postgrest('XX000', 'relation secret_table violates row for user 123'));
    expect(dataErrorMessage(error)).not.toContain('secret_table');
  });
});

describe('dataErrorMessage', () => {
  it('usa el mensaje propio del dominio cuando existe', () => {
    expect(dataErrorMessage(new DataError('conflict', 'Ya registraste un pesaje hoy.'))).toBe('Ya registraste un pesaje hoy.');
  });

  it.each(['offline', 'session', 'consent', 'conflict', 'invalid', 'unknown'] as const)('tiene un mensaje en español para %s', (kind) => {
    expect(dataErrorMessage(new DataError(kind)).length).toBeGreaterThan(10);
  });
});
