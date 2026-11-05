import { describe, expect, it } from 'vitest';
import { exerciseById, validateExercise, type PlanInput } from './index';
import { planFromProgram, programById, programs } from './programs';

const gym: PlanInput = { days: 4, minutes: 90, environment: 'commercial-gym', equipment: ['dumbbells', 'barbell', 'bands', 'machines'], level: 'intermediate', zones: [] };

describe('programas clásicos', () => {
  it('tienen ids únicos, días válidos y solo ejercicios del catálogo', () => {
    expect(new Set(programs.map((program) => program.id)).size).toBe(programs.length);
    for (const program of programs) {
      expect(program.days.length, program.id).toBeGreaterThanOrEqual(2);
      expect(program.perWeek, program.id).toBeGreaterThanOrEqual(program.days.length);
      expect(new Set(program.days.map((day) => day.name)).size, program.id).toBe(program.days.length);
      expect(new Set(program.days.map((day) => day.weekday)).size, program.id).toBe(program.days.length);
      for (const day of program.days) {
        expect(day.weekday >= 0 && day.weekday <= 6, `${program.id} ${day.name}`).toBe(true);
        for (const item of day.exercises) expect(exerciseById(item.exerciseId), `${program.id} ${item.exerciseId}`).toBeDefined();
      }
    }
  });

  it('cada prescripción pasa la validación de edición con el equipo completo', () => {
    for (const program of programs) for (const day of program.days) for (const item of day.exercises) {
      expect(validateExercise(item, gym.equipment), `${program.id} ${day.name} ${item.exerciseId}`).toBeNull();
      expect(item.rir >= 0 && item.rir <= 5).toBe(true);
    }
  });

  it('en un gimnasio comercial se aplican tal cual, conservando notas y versión', () => {
    for (const program of programs) {
      const fit = planFromProgram(program, gym);
      expect(fit.ok, program.id).toBe(true);
      if (!fit.ok) continue;
      expect(fit.plan.changes).toEqual([]);
      expect(fit.plan.templateId).toBe(program.id);
      expect(fit.plan.input.days).toBe(program.days.length);
      expect(fit.plan.days.map((day) => day.exercises.length)).toEqual(program.days.map((day) => day.exercises.length));
    }
    const fit = planFromProgram(programById('531-bbb-4day')!, gym);
    expect(fit.ok && fit.plan.days[0]!.exercises[0]!.note).toMatch(/5\/3\/1/);
    expect(fit.ok && 'rir' in fit.plan.days[0]!.exercises[0]!).toBe(false);
  });

  it('sustituye un ejercicio sin máquinas y rechaza el programa si faltan demasiados', () => {
    const noMachines = { ...gym, equipment: ['dumbbells', 'barbell', 'bands'] as PlanInput['equipment'] };
    const wendler = planFromProgram(programById('531-bbb-4day')!, noMachines);
    expect(wendler.ok).toBe(true);
    if (wendler.ok) {
      const change = wendler.plan.changes.find((item) => item.exerciseId === 'close-grip-pulldown');
      expect(change?.action).toBe('substituted');
      expect(exerciseById(change!.replacementId!)!.equipment.includes('machines')).toBe(false);
    }
    // Cuerpo completo B tiene 2 de 4 ejercicios en máquina: supera el tope de sustituciones.
    const fullBody = planFromProgram(programById('full-body-3day')!, noMachines);
    expect(fullBody.ok).toBe(false);
    if (!fullBody.ok) expect(fullBody.missing).toEqual(expect.arrayContaining(['lat-pulldown', 'leg-curl']));
  });

  it('quita los ejercicios contraindicados y avisa revisión', () => {
    const fit = planFromProgram(programById('stronglifts-5x5-3day')!, { ...gym, zones: ['back'] });
    expect(fit.ok).toBe(true);
    if (!fit.ok) return;
    expect(fit.plan.warnings).toContain('injury-review');
    expect(fit.plan.changes.every((change) => change.reason === 'injury' && change.action === 'removed')).toBe(true);
    expect(fit.plan.days.flatMap((day) => day.exercises).some((item) => item.exerciseId === 'deadlift')).toBe(false);
  });
});
