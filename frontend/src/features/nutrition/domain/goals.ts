import { limits, nutritionTargets, type Direction, type TargetInput } from '@strongerfit/nutrition-engine';
import type { ProfileData } from '../../profile/domain/profile';

export type GoalSettings = { direction: Direction; adjustment: number; proteinPerKg: number; fatShare: number };
export type MissingField = 'edad' | 'altura' | 'peso' | 'sexo' | 'actividad';

// Datos del perfil que necesita el cálculo; lo que falte se pide, no se inventa.
export function goalPerson(profile: ProfileData): { ok: true; person: Omit<TargetInput, keyof GoalSettings> } | { ok: false; missing: MissingField[] } {
  const record = profile.onboarding;
  const missing: MissingField[] = [];
  if (profile.ageYears === null) missing.push('edad');
  if (profile.heightCm === null) missing.push('altura');
  if (profile.weightKg === null) missing.push('peso');
  if (!record?.sex) missing.push('sexo');
  if (!record?.activity) missing.push('actividad');
  if (missing.length || !record) return { ok: false, missing };
  return { ok: true, person: { sex: record.sex, activity: record.activity, ageYears: profile.ageYears!, heightCm: profile.heightCm!,
    weightKg: profile.weightKg!, healthRisk: record.healthFlags.length > 0 } };
}

export function defaultSettings(profile: ProfileData): GoalSettings {
  const saved = profile.nutritionPlan;
  if (saved) return { direction: saved.result.direction, adjustment: saved.result.adjustment, proteinPerKg: saved.proteinPerKg, fatShare: saved.fatShare };
  const goal = profile.onboarding?.goal;
  const risk = !!profile.onboarding?.healthFlags.length;
  const direction: Direction = goal === 'fat-loss' && !risk ? 'deficit' : goal === 'muscle' ? 'surplus' : 'maintenance';
  return { direction, adjustment: direction === 'deficit' ? limits.deficit.default : direction === 'surplus' ? limits.surplus.default : 0,
    proteinPerKg: limits.proteinPerKg.default, fatShare: limits.fatShare.default };
}

export function calculateGoals(person: Omit<TargetInput, keyof GoalSettings>, settings: GoalSettings) {
  return nutritionTargets({ ...person, ...settings });
}
