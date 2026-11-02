import { describe, expect, it } from 'vitest';
import {
  adaptDay, environmentEquipment, exerciseById, generatePlan, substitutionCeiling, swapOptions, validateExercise, type PlanInput,
} from './index';

const base: PlanInput = { days: 3, minutes: 60, environment: 'small-gym', equipment: environmentEquipment['small-gym'], level: 'intermediate', zones: [] };
const ids = (plan: ReturnType<typeof generatePlan>) => plan.days.flatMap((day) => day.exercises.map((item) => item.exerciseId));
const uses = (equipment: string[]) => (id: string) => exerciseById(id)!.equipment.some((item) => item === 'bodyweight' || equipment.includes(item));

describe('generador de rutina', () => {
  it('elige la plantilla del entorno, nivel y frecuencia, y la explica (RF-05, CA-29)', () => {
    const plan = generatePlan(base);
    expect(plan).toMatchObject({ templateId: 'small-gym-intermediate-3d', templateVersion: 'plantillas-0.1', ruleVersion: 'entrenamiento-0.2', warnings: [] });
    expect(plan.days.map((day) => day.weekday)).toEqual([0, 2, 4]);
    expect(generatePlan(base)).toEqual(generatePlan(base));
    expect(generatePlan({ ...base, level: 'beginner' }).templateId).toBe('small-gym-beginner-3d');
  });

  it('usa la frecuencia cubierta más cercana con aviso', () => {
    expect(generatePlan({ ...base, days: 6 })).toMatchObject({ templateId: 'small-gym-intermediate-5d', warnings: ['frequency-adjusted'] });
    expect(generatePlan({ ...base, days: 2 }).days).toHaveLength(3);
    expect(generatePlan({ ...base, level: 'advanced' }).warnings).toContain('level-adjusted');
  });

  it('solo usa equipo disponible y sustituye dentro del techo (BR-03, RF-34)', () => {
    const noBands = generatePlan({ ...base, level: 'beginner', equipment: ['bodyweight', 'dumbbells', 'barbell'] });
    expect(noBands.templateId).toBe('small-gym-beginner-3d');
    expect(ids(noBands).every(uses(['dumbbells', 'barbell']))).toBe(true);
    expect(noBands.changes.some((change) => change.action === 'substituted' && change.reason === 'equipment' && change.replacementId)).toBe(true);
  });

  it('cambia a la plantilla de otro entorno si se supera el techo (CA-28)', () => {
    const plan = generatePlan({ ...base, environment: 'commercial-gym', equipment: ['bodyweight'] });
    expect(plan.warnings).toContain('environment-fallback');
    expect(plan.environment).toBe('none');
    expect(ids(plan).every(uses([]))).toBe(true);
  });

  it('elimina ejercicios contraindicados sin reemplazo y revalida sustitutos (CA-25)', () => {
    const plan = generatePlan({ ...base, zones: ['knee'], equipment: ['bodyweight', 'dumbbells', 'bands'] });
    for (const id of ids(plan)) expect(exerciseById(id)!.contraindications).not.toContain('knee');
    expect(plan.changes.some((change) => change.reason === 'injury')).toBe(true);
    expect(plan.warnings).toContain('injury-review');
  });

  it('recorta ejercicios para la duración declarada sin bajar de 3', () => {
    const plan = generatePlan({ ...base, minutes: 20 });
    expect(plan.days.every((day) => day.exercises.length === 3)).toBe(true);
    expect(plan.changes.some((change) => change.reason === 'time')).toBe(true);
  });
});

describe('sustitución por equipo (BR-25, CA-28)', () => {
  const ten = ['back-squat', 'romanian-deadlift', 'bench-press', 'db-row', 'db-shoulder-press', 'reverse-lunge', 'plank', 'db-curl', 'band-triceps', 'dead-bug'];
  const equipment = ['bodyweight', 'dumbbells', 'bands'] as const;

  it('con 10 ejercicios aplica 2 sustituciones en orden de lista', () => {
    expect(substitutionCeiling(10)).toBe(2);
    const twoMissing = ['back-squat', 'romanian-deadlift', ...ten.slice(3), 'db-hip-thrust'];
    const result = adaptDay(twoMissing, [...equipment], []);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.changes.map((change) => change.action)).toEqual(['substituted', 'substituted']);
    const first = result.changes[0]!;
    const expected = exerciseById('back-squat')!.substitutes.find((id) => uses([...equipment])(id) && !twoMissing.includes(id));
    expect(first.replacementId).toBe(expected);
  });

  it('con 3 faltantes no aplica ninguna', () => {
    expect(adaptDay(ten, [...equipment], [])).toEqual({ ok: false, missing: ['back-squat', 'romanian-deadlift', 'bench-press'] });
  });

  it('elimina e informa un ejercicio sin sustituto', () => {
    const result = adaptDay(['lat-pulldown', 'push-up', 'plank'], ['bodyweight'], []);
    expect(result.ok && result.changes).toEqual([{ exerciseId: 'lat-pulldown', action: 'removed', reason: 'equipment' }]);
  });
});

describe('edición de rutina (CA-12)', () => {
  it('valida rangos, equipo y lesiones', () => {
    const item = generatePlan(base).days[0]!.exercises[0]!;
    expect(validateExercise(item, base.equipment)).toBeNull();
    expect(validateExercise({ ...item, sets: 0 }, base.equipment)).toMatch(/series/);
    expect(validateExercise({ ...item, repsMin: 12, repsMax: 8 }, base.equipment)).toMatch(/repeticiones/);
    expect(validateExercise({ ...item, exerciseId: 'leg-press' }, base.equipment)).toMatch(/equipamiento/);
    expect(validateExercise({ ...item, exerciseId: 'goblet-squat' }, base.equipment, ['knee'])).toMatch(/lesión/);
  });

  it('ofrece sustitutos con equipo propio y sin zonas contraindicadas', () => {
    const options = swapOptions({ exerciseId: 'bench-press', sets: 3, repsMin: 6, repsMax: 10, restSeconds: 120 }, ['dumbbells'], ['wrist']);
    expect(options.length).toBeGreaterThan(0);
    for (const exercise of options) {
      expect(exercise.pattern).toBe('push-h');
      expect(uses(['dumbbells'])(exercise.id)).toBe(true);
      expect(exercise.contraindications).not.toContain('wrist');
    }
  });
});
