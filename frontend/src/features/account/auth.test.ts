import { describe, expect, it } from 'vitest';
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
