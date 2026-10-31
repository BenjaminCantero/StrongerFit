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

export * from './foods';
export * from './meal-plan';
