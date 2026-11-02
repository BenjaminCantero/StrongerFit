import { describe, expect, it } from 'vitest';
import { exerciseById } from './index';
import { environmentEquipment, nearestFrequency, selectTemplate, templates } from './templates';

describe('plantillas curadas (CA-29)', () => {
  it('existe exactamente una plantilla por cada una de las 24 combinaciones', () => {
    expect(templates).toHaveLength(24);
    const keys = templates.map((item) => `${item.environment}/${item.level}/${item.days}`);
    expect(new Set(keys).size).toBe(24);
    expect(new Set(templates.map((item) => item.id)).size).toBe(24);
  });

  it('cada sesión tiene de 3 a 6 ejercicios del catálogo, sin repetir y con el equipo del entorno', () => {
    for (const template of templates) {
      expect(template.plan).toHaveLength(template.days);
      for (const day of template.plan) {
        const label = `${template.id} ${day.name}`;
        expect(day.exerciseIds.length, label).toBeGreaterThanOrEqual(3);
        expect(day.exerciseIds.length, label).toBeLessThanOrEqual(6);
        expect(new Set(day.exerciseIds).size, label).toBe(day.exerciseIds.length);
        for (const id of day.exerciseIds) {
          const exercise = exerciseById(id);
          expect(exercise, `${label} ${id}`).toBeDefined();
          expect(exercise!.equipment.some((item) => environmentEquipment[template.environment].includes(item)), `${label} ${id}`).toBe(true);
        }
      }
    }
  });

  it('usa la frecuencia más cercana con empate hacia abajo', () => {
    expect([1, 2, 3, 4, 5, 6, 7].map(nearestFrequency)).toEqual([3, 3, 3, 4, 5, 5, 5]);
    expect(selectTemplate('none', 'beginner', 6).id).toBe('none-beginner-5d');
  });
});
