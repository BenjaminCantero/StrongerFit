import type { Nutrients } from './foods';

// Motor determinista de metas nutricionales (SRS 8.5). Valores de referencia
// inicial, sujetos a revisión profesional antes del lanzamiento público.
export const RULE_VERSION = 'nutricion-0.1';

export type Sex = 'female' | 'male' | 'unspecified';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'high' | 'very-high';
export type Direction = 'deficit' | 'maintenance' | 'surplus';

export const activityFactors: Record<ActivityLevel, number> = {
  sedentary: 1.2, light: 1.375, moderate: 1.55, high: 1.725, 'very-high': 1.9,
};

export const limits = {
  deficit: { options: [0.1, 0.15, 0.2], default: 0.15, max: 0.2 },
  surplus: { options: [0.05, 0.1, 0.15], default: 0.1, max: 0.15 },
  proteinPerKg: { options: [1.4, 1.6, 1.8, 2.0], default: 1.6 },
  fatShare: { options: [0.2, 0.25, 0.3, 0.35], default: 0.25 },
  floor: { female: 1200, male: 1500 },
} as const;

export type Person = { sex: Sex; ageYears: number; heightCm: number; weightKg: number; activity: ActivityLevel };
export type TargetInput = Person & {
  direction: Direction; adjustment: number; proteinPerKg: number; fatShare: number; healthRisk: boolean;
};
export type Warning = 'floor-applied' | 'risk-no-deficit' | 'adjustment-capped' | 'unspecified-sex';

// Mifflin-St Jeor. Sin sexo declarado se usa el promedio de ambas constantes
// (+5 y −161 → −78); decisión provisional mientras se define SRS 11.1.
export function bmr({ sex, ageYears, heightCm, weightKg }: Omit<Person, 'activity'>): number {
  const constant = sex === 'male' ? 5 : sex === 'female' ? -161 : -78;
  return 10 * weightKg + 6.25 * heightCm - 5 * ageYears + constant;
}

export function tdee(person: Person): number {
  return bmr(person) * activityFactors[person.activity];
}

// Piso de seguridad (BR-16): sin sexo declarado se aplica el mayor.
export const energyFloor = (sex: Sex) => sex === 'female' ? limits.floor.female : limits.floor.male;

export function nutritionTargets(input: TargetInput) {
  const warnings: Warning[] = [];
  if (input.sex === 'unspecified') warnings.push('unspecified-sex');
  const base = tdee(input);
  let direction = input.direction;
  // BR-19: con riesgo declarado no se proponen planes de déficit.
  if (input.healthRisk && direction === 'deficit') { direction = 'maintenance'; warnings.push('risk-no-deficit'); }
  // BR-17: el ajuste nunca supera los límites, aunque se pida más.
  const max = direction === 'deficit' ? limits.deficit.max : direction === 'surplus' ? limits.surplus.max : 0;
  const adjustment = Math.min(Math.max(input.adjustment, 0), max);
  if (direction !== 'maintenance' && input.adjustment > max) warnings.push('adjustment-capped');
  const calculated = direction === 'deficit' ? base * (1 - adjustment) : direction === 'surplus' ? base * (1 + adjustment) : base;
  const floor = energyFloor(input.sex);
  const kcal = Math.round(Math.max(calculated, floor));
  if (calculated < floor) warnings.push('floor-applied');

  // Proteína por kg, grasa como fracción de la energía y carbohidratos con el resto (BR-06: 4/4/9).
  const protein = Math.round(input.proteinPerKg * input.weightKg);
  const fat = Math.round(kcal * input.fatShare / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return {
    ruleVersion: RULE_VERSION,
    bmr: Math.round(bmr(input)), tdee: Math.round(base), calculatedKcal: Math.round(calculated),
    direction, adjustment, floor, kcal, protein, fat, carbs, warnings,
  };
}

export type NutritionTargets = ReturnType<typeof nutritionTargets>;

// Meta distinta en días de entrenamiento y de descanso (RF-21, Deseable). Opción explícita,
// desactivada por defecto. Los días de entrenamiento reciben más energía y los de descanso
// menos, con un promedio semanal exactamente igual a la meta. La proteína y la grasa no
// cambian; la diferencia va en carbohidratos. La diferencia es un porcentaje fijo de la meta,
// no una estimación del gasto de la sesión (el SRS prohíbe usar gasto de ejercicio estimado).
// Valor provisional, a la espera de revisión profesional.
export const TRAINING_REST_GAP = 0.1;

export type DayType = 'training' | 'rest';
export type DayTarget = { type: DayType; targets: Nutrients };
export type DayTargets = { requestedGap: number; gap: number; reduced: boolean; days: DayTarget[] };
export type DayTargetsInput = {
  targets: Nutrients; trainingDays: number[]; tdee: number; floor: number; noDeficit: boolean; requestedGap?: number;
};

// trainingDays: 0 = lunes. Cada día por separado respeta el piso de energía (BR-16), el
// déficit máximo (BR-17) y, con riesgo declarado, la ausencia de déficit (BR-19); si la
// diferencia pedida lo rompería, se reduce hasta que no ocurra.
export function dayTargets({ targets, trainingDays, tdee, floor, noDeficit, requestedGap = TRAINING_REST_GAP }: DayTargetsInput): DayTargets {
  const training = new Set(trainingDays.filter((day) => Number.isInteger(day) && day >= 0 && day < 7));
  const count = training.size;
  const rest = 7 - count;
  const base = targets.kcal;
  // Mismo redondeo que nutritionTargets, para que la meta máxima permitida siga siéndolo.
  const lower = Math.max(floor, Math.round(noDeficit ? tdee : tdee * (1 - limits.deficit.max)));
  const upper = Math.round(tdee * (1 + limits.surplus.max));
  const limitsGap = count === 0 || rest === 0 || base <= 0 ? 0 : Math.min(
    (1 - lower / base) * 7 / count, (upper / base - 1) * 7 / rest, targets.carbs * 4 * 7 / (base * count));
  // Se trunca a milésimas para que el resultado sea estable y nunca supere los límites.
  const gap = Math.max(0, Math.floor(Math.min(requestedGap, limitsGap) * 1000) / 1000);
  let trainingKcal = Math.round(base * (1 + gap * rest / 7));
  const split = () => {
    const total = base * 7 - trainingKcal * count;
    return { each: Math.floor(total / rest), extra: total - Math.floor(total / rest) * rest };
  };
  // El redondeo al entero no puede dejar un día de descanso bajo el mínimo.
  while (rest > 0 && count > 0 && trainingKcal > base && split().each < Math.min(lower, base)) trainingKcal--;
  const { each, extra } = rest > 0 ? split() : { each: base, extra: 0 };
  let restSeen = 0;
  const days = Array.from({ length: 7 }, (_, index): DayTarget => {
    const type: DayType = training.has(index) ? 'training' : 'rest';
    const kcal = count === 0 || rest === 0 ? base : type === 'training' ? trainingKcal : each + (restSeen++ < extra ? 1 : 0);
    return { type, targets: { ...targets, kcal, carbs: Math.max(0, Math.round(targets.carbs + (kcal - base) / 4)) } };
  });
  return { requestedGap, gap, reduced: count > 0 && rest > 0 && gap < requestedGap, days };
}

export * from './foods';
export * from './meal-plan';
