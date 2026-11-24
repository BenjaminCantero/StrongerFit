import { expect, it } from 'vitest';
import { cacheBuster, userKey } from './keys';

it('las claves de datos llevan el usuario para no mezclar cuentas', () => {
  expect(userKey('u1', 'profile')).toEqual(['u', 'u1', 'profile']);
  expect(userKey('u1', 'diary', '2026-11-24')).toEqual(['u', 'u1', 'diary', '2026-11-24']);
});

it('la caché persistida se invalida al cambiar de usuario o de esquema', () => {
  expect(cacheBuster('u1')).not.toBe(cacheBuster('u2'));
  expect(cacheBuster('u1')).toContain('u1');
});
