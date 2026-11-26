import { describe, expect, it } from 'vitest';
import { catalog } from './catalog';
import { TECHNIQUE_SOURCE, TECHNIQUE_VERSION, techniqueById, techniqueFor } from './technique';

describe('indicaciones de técnica', () => {
  it('cada ejercicio del catálogo tiene entre 3 y 4 indicaciones', () => {
    for (const exercise of catalog) {
      const points = techniqueById[exercise.id];
      expect(points, exercise.id).toBeDefined();
      expect(points!.length, exercise.id).toBeGreaterThanOrEqual(3);
      expect(points!.length, exercise.id).toBeLessThanOrEqual(4);
    }
  });

  it('no hay indicaciones para ejercicios que no existen en el catálogo', () => {
    const ids = new Set(catalog.map((exercise) => exercise.id));
    expect(Object.keys(techniqueById).filter((id) => !ids.has(id))).toEqual([]);
  });

  it('ninguna indicación está vacía, repetida ni supera 110 caracteres', () => {
    for (const [id, points] of Object.entries(techniqueById)) {
      expect(new Set(points).size, id).toBe(points.length);
      for (const point of points) {
        expect(point.trim(), id).not.toBe('');
        expect(point.length, `${id}: ${point}`).toBeLessThanOrEqual(110);
      }
    }
  });

  it('techniqueFor devuelve las indicaciones o una lista vacía', () => {
    expect(techniqueFor('plank')).toBe(techniqueById.plank);
    expect(techniqueFor('no-existe')).toEqual([]);
  });

  it('sigue marcada como pendiente de revisión profesional', () => {
    expect(TECHNIQUE_SOURCE.reviewed).toBe(false);
    expect(TECHNIQUE_VERSION).toBe('tecnica-0.1');
  });
});
