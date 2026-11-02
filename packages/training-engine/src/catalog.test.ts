import { describe, expect, it } from 'vitest';
import { catalog, difficultyLabels, equipmentLabels, muscleLabels, searchExercises, zoneLabels } from './catalog';

describe('catálogo de ejercicios', () => {
  it('tiene al menos 100 ejercicios con identificadores y nombres únicos (CA-24)', () => {
    expect(catalog.length).toBeGreaterThanOrEqual(100);
    expect(new Set(catalog.map((exercise) => exercise.id)).size).toBe(catalog.length);
    expect(new Set(catalog.map((exercise) => exercise.name)).size).toBe(catalog.length);
  });

  it('cada ejercicio tiene todos los campos de RNF-28', () => {
    for (const exercise of catalog) {
      expect(exercise.description.length, exercise.id).toBeGreaterThan(20);
      expect(muscleLabels[exercise.primary], exercise.id).toBeDefined();
      expect(exercise.secondary.every((muscle) => muscle in muscleLabels && muscle !== exercise.primary), exercise.id).toBe(true);
      expect(exercise.equipment.length, exercise.id).toBeGreaterThan(0);
      expect(exercise.equipment.every((item) => item in equipmentLabels), exercise.id).toBe(true);
      expect(difficultyLabels[exercise.difficulty], exercise.id).toBeDefined();
      // Una lista vacía solo se admite con la marca explícita.
      const zones = exercise.contraindications;
      expect(zones === 'none-validated' || (zones.length > 0 && zones.every((zone) => zone in zoneLabels)), exercise.id).toBe(true);
      expect(exercise.measure === 'duration', exercise.id).toBe(exercise.kind === 'isometric');
    }
  });

  it('busca por nombre sin tildes y filtra por músculo, equipo y dificultad (RF-04)', () => {
    expect(searchExercises('sentadilla bulgara').map((exercise) => exercise.id)).toEqual(['bulgarian-split-squat']);
    expect(searchExercises('PRESS banca').every((exercise) => exercise.name.includes('banca'))).toBe(true);
    const filtered = searchExercises('', { muscle: 'chest', equipment: 'bodyweight', difficulty: 'beginner' });
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((exercise) => exercise.primary === 'chest' && exercise.equipment.includes('bodyweight') && exercise.difficulty === 'beginner')).toBe(true);
    expect(searchExercises('zzz')).toEqual([]);
    expect(searchExercises('')).toHaveLength(catalog.length);
  });

  it('responde en menos de 1 s con 500 ejercicios (CA-24)', () => {
    const large = Array.from({ length: 5 }, (_, copy) => catalog.map((exercise) => ({ ...exercise, id: `${exercise.id}-${copy}` }))).flat();
    expect(large.length).toBeGreaterThanOrEqual(500);
    const start = performance.now();
    for (let run = 0; run < 20; run += 1) searchExercises('remo', { equipment: 'dumbbells' }, large);
    expect((performance.now() - start) / 20).toBeLessThan(1000);
  });
});
