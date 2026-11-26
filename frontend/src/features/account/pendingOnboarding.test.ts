import { describe, expect, it } from 'vitest';
import { completeOnboarding, createDraft, type Draft } from '../onboarding/domain/onboarding';
import { onboardingPayload } from './data/account.mappers';
import { decidePending, parsePending, PENDING_MAX_AGE_MS, serializePending } from './pendingOnboarding';

const draft = (): Draft => ({
  ...createDraft(), name: 'Ana', age: '30', sex: 'female', height: '165', weight: '80', activity: 'moderate',
  goal: 'strength', level: 'beginner', days: '3', minutes: '45', environment: 'small-gym', equipment: ['dumbbells'],
  targetWeight: '76', weeks: '8', exclusions: '', noHealthFlags: true, healthFlags: [], zones: [], disclaimerRead: true, consent: true,
});
const result = completeOnboarding(draft(), new Date('2026-11-24T12:00:00Z'), '2026-11-24');
if (!result.ok) throw new Error('borrador inválido');
const payload = onboardingPayload(result, '2026-11-24');
const saved = new Date('2026-11-24T12:00:00Z');
const later = (ms: number) => new Date(saved.getTime() + ms);

describe('onboarding pendiente (AU-01, RNF-05)', () => {
  it('guarda versión, fecha y payload, y lo lee de vuelta', () => {
    const raw = serializePending(payload, saved);
    expect(JSON.parse(raw)).toMatchObject({ version: 2, savedAt: saved.toISOString() });
    expect(parsePending(raw, later(60_000))).toEqual({ pending: { version: 2, savedAt: saved.toISOString(), payload }, discard: false });
  });

  it('no hay nada que descartar si no existe', () => {
    expect(parsePending(null, saved)).toEqual({ pending: null, discard: false });
  });

  it('caduca a los 7 días exactos pasados', () => {
    const raw = serializePending(payload, saved);
    expect(parsePending(raw, later(PENDING_MAX_AGE_MS)).pending).not.toBeNull();
    expect(parsePending(raw, later(PENDING_MAX_AGE_MS + 1))).toEqual({ pending: null, discard: true });
  });

  it('descarta fechas futuras, JSON roto, otra versión y payload inválido', () => {
    expect(parsePending(serializePending(payload, later(60_000)), saved).discard).toBe(true);
    expect(parsePending('{no es json', saved)).toEqual({ pending: null, discard: true });
    expect(parsePending(JSON.stringify({ version: 1, savedAt: saved.toISOString(), payload }), saved).discard).toBe(true);
    const bad = { ...payload, profile: { ...payload.profile, age_years: 12 } };
    expect(parsePending(JSON.stringify({ version: 2, savedAt: saved.toISOString(), payload: bad }), saved).discard).toBe(true);
  });
});

describe('decidePending', () => {
  const bound = { email: 'ana@example.com' };
  it('espera mientras no se conoce el estado', () => {
    expect(decidePending(undefined, bound, 'ana@example.com')).toBe('wait');
  });
  it('guarda solo si no hay perfil y el correo coincide', () => {
    expect(decidePending('needs-onboarding', bound, 'ana@example.com')).toBe('save');
    expect(decidePending('needs-onboarding', bound, '  ANA@Example.com ')).toBe('save');
    expect(decidePending('needs-onboarding', { email: ' Ana@EXAMPLE.com' }, 'ana@example.com')).toBe('save');
    expect(decidePending('needs-onboarding', null, 'ana@example.com')).toBe('none');
  });
  it('descarta si el correo difiere, falta en el pendiente o en la sesión', () => {
    expect(decidePending('needs-onboarding', bound, 'otra@example.com')).toBe('discard');
    expect(decidePending('needs-onboarding', {}, 'ana@example.com')).toBe('discard');
    expect(decidePending('needs-onboarding', bound, null)).toBe('discard');
    expect(decidePending('needs-onboarding', bound, undefined)).toBe('discard');
  });
  it('con perfil descarta el pendiente sin sobrescribir', () => {
    expect(decidePending('ready', bound, 'ana@example.com')).toBe('discard');
    expect(decidePending('needs-consent', bound, 'ana@example.com')).toBe('discard');
    expect(decidePending('ready', null, 'ana@example.com')).toBe('none');
  });
});
