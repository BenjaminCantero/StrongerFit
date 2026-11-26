import { describe, expect, it } from 'vitest';
import { isUuid, newClientId } from './ids';

describe('ids de cliente', () => {
  it('genera UUID v4 distintos', () => {
    const a = newClientId();
    const b = newClientId();
    expect(isUuid(a)).toBe(true);
    expect(a).not.toBe(b);
    expect(a[14]).toBe('4');
  });

  it('reconoce lo que no es UUID', () => {
    expect(isUuid('session-1732650000000')).toBe(false);
    expect(isUuid('')).toBe(false);
  });
});
