import { environmentEquipment, environmentLabels, equipmentLabels, zoneLabels, type Environment, type Equipment, type Zone } from '@strongerfit/training-engine';
import { shiftDate } from '../../../shared/calendar';
import type { MealPreferences } from '@strongerfit/nutrition-engine';
import { createMealPreferences, parseNutritionForm, parsePersonalForm, type FormErrors, type PersonalValues } from '../../profile/domain/profile';

export type Sex = 'female' | 'male' | 'unspecified';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'high' | 'very-high';
export type Level = 'beginner' | 'intermediate' | 'advanced';
export type Goal = 'strength' | 'muscle' | 'fat-loss' | 'health';
export type { Environment, Equipment, Zone };
export type HealthFlag = 'injury' | 'cardiovascular' | 'pregnancy' | 'eating-disorder';

export type WeightGoal = { startKg: number; targetKg: number; startDate: string; endDate: string };
export type OnboardingRecord = {
  // El perfil de deportista llega en la versión 1.1 (RF-28); en la v0 la plantilla define los parámetros.
  sex: Sex; activity: ActivityLevel; level: Level; goal: Goal; environment: Environment; equipment: Equipment[]; zones: Zone[];
  weightGoal: WeightGoal | null; healthFlags: HealthFlag[]; consent: { version: string; acceptedAt: string }; completedAt: string;
};

export const steps = ['basics', 'training', 'weight', 'nutrition', 'health'] as const;
export type Step = (typeof steps)[number];
export const CONSENT_VERSION = 'consentimiento-salud-v0.1';

export const labels = {
  sex: { female: 'Mujer', male: 'Hombre', unspecified: 'Prefiero no decirlo' },
  activity: { sedentary: 'Sedentaria', light: 'Ligera', moderate: 'Moderada', high: 'Alta', 'very-high': 'Muy alta' },
  level: { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' },
  goal: { strength: 'Ganar fuerza', muscle: 'Ganar masa muscular', 'fat-loss': 'Reducir grasa corporal', health: 'Salud y energía general' },
  environment: environmentLabels,
  equipment: equipmentLabels,
  zones: zoneLabels,
} as const;

// Las plantillas cubren 3 a 5 días; fuera de eso se usa la más cercana con aviso (SRS 8.11).
export const trainingDays = { min: 2, max: 6 } as const;

// Equipo del entorno que la persona puede desmarcar si no lo tiene; peso corporal siempre está.
export const optionalEquipment = (environment: Environment) => environmentEquipment[environment].filter((item) => item !== 'bodyweight');

export type Draft = {
  name: string; age: string; sex: Sex | null; height: string; weight: string; activity: ActivityLevel | null;
  goal: Goal | null; level: Level | null; environment: Environment | null; days: string; minutes: string; equipment: Equipment[]; zones: Zone[];
  setWeightGoal: boolean; targetWeight: string; weeks: string; paceConfirmed: boolean;
  exclusions: string; dietFocus: string; preferences: MealPreferences;
  healthFlags: HealthFlag[]; noHealthFlags: boolean; disclaimerRead: boolean; consent: boolean;
};

export const createDraft = (): Draft => ({
  name: '', age: '', sex: null, height: '', weight: '', activity: null,
  goal: null, level: null, environment: null, days: '', minutes: '', equipment: [], zones: [],
  setWeightGoal: true, targetWeight: '', weeks: '', paceConfirmed: false,
  exclusions: '', dietFocus: '', preferences: createMealPreferences(), healthFlags: [], noHealthFlags: false, disclaimerRead: false, consent: false,
});

// Al elegir un entorno se marca todo su equipo.
export const environmentDraft = (environment: Environment) => ({ environment, equipment: optionalEquipment(environment) });

export function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((value) => value !== item) : [...list, item];
}

function personal(draft: Draft) {
  return parsePersonalForm({
    name: draft.name, age: draft.age, height: draft.height, weight: draft.weight, days: draft.days, minutes: draft.minutes,
    goal: draft.goal ? labels.goal[draft.goal] : '', equipment: draft.environment ? labels.environment[draft.environment] : '',
  });
}

// Ritmo implícito del objetivo de peso (SRS 8.9, BR-20).
export function weightGoalPace(startKg: number, targetKg: number, weeks: number) {
  const kgPerWeek = (targetKg - startKg) / weeks;
  const percentPerWeek = Math.abs(kgPerWeek) / startKg * 100;
  return { kgPerWeek, percentPerWeek, exceeds: percentPerWeek > 1 };
}

function parseWeightGoal(draft: Draft): { pace: ReturnType<typeof weightGoalPace>; targetKg: number; weeks: number } | string | null {
  if (!draft.setWeightGoal) return null;
  const start = Number(draft.weight.trim().replace(',', '.'));
  const targetKg = Number(draft.targetWeight.trim().replace(',', '.'));
  const weeks = Number(draft.weeks.trim());
  if (!/^\d{2,3}(?:[.,]\d)?$/.test(draft.targetWeight.trim()) || targetKg < 30 || targetKg > 300) return 'targetWeight';
  if (!/^\d{1,3}$/.test(draft.weeks.trim()) || weeks < 4 || weeks > 104) return 'weeks';
  if (targetKg === start) return 'targetWeight';
  return { pace: weightGoalPace(start, targetKg, weeks), targetKg, weeks };
}

export type DraftField = keyof Draft;

export function validateStep(step: Step, draft: Draft): FormErrors<DraftField> {
  const errors: FormErrors<DraftField> = {};
  const base = personal(draft);
  const pick = (fields: ('name' | 'age' | 'height' | 'weight' | 'days' | 'minutes')[]) => {
    if (base.ok) return;
    for (const field of fields) if (base.errors[field]) errors[field] = base.errors[field];
  };
  if (step === 'basics') {
    pick(['name', 'age', 'height', 'weight']);
    // TMB y piso de seguridad necesitan edad, altura y peso (SRS 8.5).
    for (const field of ['age', 'height', 'weight'] as const) if (!draft[field].trim()) errors[field] = 'Necesitamos este dato para estimar tus metas.';
    if (!draft.sex) errors.sex = 'Elige una opción.';
    if (!draft.activity) errors.activity = 'Elige tu actividad diaria habitual.';
  }
  if (step === 'training') {
    pick(['days', 'minutes']);
    if (!draft.goal) errors.goal = 'Elige tu objetivo principal.';
    if (!draft.level) errors.level = 'Elige tu nivel.';
    const days = Number(draft.days);
    if (!draft.days.trim()) errors.days = 'Indica cuántos días puedes entrenar.';
    else if (!errors.days && (days < trainingDays.min || days > trainingDays.max)) {
      errors.days = `Las rutinas consideran entre ${trainingDays.min} y ${trainingDays.max} días por semana.`;
    }
    if (!draft.minutes.trim()) errors.minutes = 'Indica cuánto dura una sesión.';
    if (!draft.environment) errors.environment = 'Elige dónde entrenas.';
  }
  if (step === 'weight') {
    const goal = parseWeightGoal(draft);
    if (goal === 'targetWeight') errors.targetWeight = 'Ingresa un peso meta distinto del actual, entre 30 y 300 kg.';
    else if (goal === 'weeks') errors.weeks = 'Usa entre 4 y 104 semanas.';
    else if (typeof goal === 'object' && goal?.pace.exceeds && !draft.paceConfirmed) errors.paceConfirmed = 'Confirma que revisaste el ritmo o ajusta la meta.';
  }
  if (step === 'nutrition') {
    const nutrition = parseNutritionForm({ exclusions: draft.exclusions, dietFocus: draft.dietFocus });
    if (!nutrition.ok) Object.assign(errors, nutrition.errors);
  }
  if (step === 'health') {
    if (!draft.disclaimerRead) errors.disclaimerRead = 'Confirma que leíste el aviso de salud.';
    if (!draft.healthFlags.length && !draft.noHealthFlags) errors.healthFlags = 'Marca las condiciones que apliquen o indica que ninguna aplica.';
    if (draft.healthFlags.includes('injury') && !draft.zones.length) errors.zones = 'Indica al menos una zona con lesión o molestia.';
    if (!draft.consent) errors.consent = 'Sin tu consentimiento no podemos tratar datos de salud ni preparar tu plan.';
  }
  return errors;
}

export function paceSummary(draft: Draft) {
  const goal = parseWeightGoal(draft);
  return goal && typeof goal === 'object' ? goal : null;
}

export const hasHealthRisk = (flags: HealthFlag[]) => flags.length > 0;

export function completeOnboarding(draft: Draft, now: Date, today: string):
  { ok: true; values: PersonalValues; exclusions: string[]; dietFocus: string; preferences: MealPreferences; onboarding: OnboardingRecord } | { ok: false; step: Step } {
  for (const step of steps) if (Object.keys(validateStep(step, draft)).length) return { ok: false, step };
  const base = personal(draft);
  const nutrition = parseNutritionForm({ exclusions: draft.exclusions, dietFocus: draft.dietFocus });
  if (!base.ok || !nutrition.ok) return { ok: false, step: 'basics' };
  const goal = paceSummary(draft);
  const startKg = base.values.weightKg!;
  return {
    ok: true, values: base.values, exclusions: nutrition.exclusions, dietFocus: nutrition.dietFocus, preferences: draft.preferences,
    onboarding: {
      sex: draft.sex!, activity: draft.activity!, level: draft.level!, goal: draft.goal!, environment: draft.environment!,
      equipment: ['bodyweight', ...draft.equipment.filter((item) => item !== 'bodyweight')],
      zones: draft.healthFlags.includes('injury') ? draft.zones : [], healthFlags: draft.healthFlags,
      weightGoal: goal ? { startKg, targetKg: goal.targetKg, startDate: today, endDate: shiftDate(today, goal.weeks * 7) } : null,
      consent: { version: CONSENT_VERSION, acceptedAt: now.toISOString() }, completedAt: now.toISOString(),
    },
  };
}
