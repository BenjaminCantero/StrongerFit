import type { Tables, TablesInsert } from '@strongerfit/contracts/database';
import { z } from 'zod';
import { labels, type Environment, type Equipment, type Goal, type OnboardingRecord, type Zone } from '../../onboarding/domain/onboarding';
import type { PersonalValues, ProfileData } from '../domain/profile';

// Filas de identidad de una persona (SY-02). Las tablas append-only entregan solo su fila vigente.
export type IdentityRows = {
  profile: Tables<'profiles'>;
  goal: Tables<'user_goals'>;
  preferences: Tables<'user_preferences'>;
  injuries: Tables<'user_injuries'>[];
  screening: Tables<'health_screenings'>;
  consent: Tables<'consents'>;
  latestWeight: Pick<Tables<'body_measurements'>, 'weight_kg' | 'measured_on'> | null;
  weightGoal: Tables<'weight_goals'> | null;
};

export type Identity = Pick<ProfileData, 'name' | 'ageYears' | 'heightCm' | 'weightKg' | 'goal' | 'daysPerWeek' | 'sessionMinutes'
  | 'equipment' | 'exclusions' | 'dietFocus' | 'mealPreferences' | 'trainingDayTargets'> & { onboarding: OnboardingRecord };

const Sex = z.enum(['female', 'male', 'unspecified']);
const Activity = z.enum(['sedentary', 'light', 'moderate', 'high', 'very-high']);
const Level = z.enum(['beginner', 'intermediate', 'advanced']);
const GoalId = z.enum(['strength', 'muscle', 'fat-loss', 'health']);
const EnvironmentId = z.enum(['none', 'calisthenics', 'small-gym', 'commercial-gym']);
const EquipmentId = z.enum(['bodyweight', 'dumbbells', 'barbell', 'machines', 'bands']);
const ZoneId = z.enum(['back', 'knee', 'elbow', 'shoulder', 'wrist', 'hip']);
const Flag = z.enum(['injury', 'cardiovascular', 'pregnancy', 'eating-disorder']);
const MealsPerDay = z.union([z.literal(3), z.literal(4), z.literal(5), z.literal(6)]);

// Lo que llega de la base se valida antes de entrar a la app (RNF-13).
export function identityFromRows(rows: IdentityRows): Identity {
  const { profile, goal, preferences, screening, consent, latestWeight, weightGoal } = rows;
  const goalId = GoalId.parse(goal.goal);
  const environment = EnvironmentId.parse(goal.environment);
  return {
    name: profile.display_name,
    ageYears: profile.age_years,
    heightCm: Number(profile.height_cm),
    weightKg: latestWeight?.weight_kg == null ? null : Number(latestWeight.weight_kg),
    goal: labels.goal[goalId],
    daysPerWeek: goal.days_per_week,
    sessionMinutes: goal.session_minutes,
    equipment: labels.environment[environment],
    exclusions: preferences.exclusions,
    dietFocus: preferences.diet_focus,
    mealPreferences: { mealsPerDay: MealsPerDay.parse(preferences.meals_per_day), preferred: preferences.preferred_food_ids, disliked: preferences.disliked_food_ids },
    trainingDayTargets: preferences.training_day_targets,
    onboarding: {
      sex: Sex.parse(profile.sex), activity: Activity.parse(profile.activity), level: Level.parse(goal.level), goal: goalId, environment,
      equipment: z.array(EquipmentId).parse(goal.equipment),
      zones: rows.injuries.map((injury) => ZoneId.parse(injury.zone)),
      healthFlags: z.array(Flag).parse(screening.flags),
      weightGoal: weightGoal ? { startKg: Number(weightGoal.start_kg), targetKg: Number(weightGoal.target_kg), startDate: weightGoal.start_date, endDate: weightGoal.end_date } : null,
      consent: { version: consent.policy_version, acceptedAt: consent.at },
      completedAt: profile.created_at,
    },
  };
}

type GoalInsert = Omit<TablesInsert<'user_goals'>, 'id' | 'user_id' | 'created_at'>;

const goalRow = (current: Identity, change: Partial<{ goal: Goal; environment: Environment; equipment: Equipment[]; days: number; minutes: number }>): GoalInsert => ({
  goal: change.goal ?? current.onboarding.goal,
  level: current.onboarding.level,
  environment: change.environment ?? current.onboarding.environment,
  equipment: change.equipment ?? current.onboarding.equipment,
  days_per_week: change.days ?? current.daysPerWeek!,
  session_minutes: change.minutes ?? current.sessionMinutes!,
});

// Editar la ficha personal: el perfil se actualiza; la meta y el peso se agregan como
// registros nuevos solo si cambian, para conservar el historial (RF-03).
export function personalWrites(current: Identity, values: PersonalValues, goal: Goal, today: string) {
  const goalChanged = goal !== current.onboarding.goal || values.daysPerWeek !== current.daysPerWeek || values.sessionMinutes !== current.sessionMinutes;
  const weightChanged = values.weightKg !== null && values.weightKg !== current.weightKg;
  return {
    profile: { display_name: values.name, age_years: values.ageYears!, height_cm: values.heightCm! },
    goal: goalChanged ? goalRow(current, { goal, days: values.daysPerWeek!, minutes: values.sessionMinutes! }) : null,
    weight: weightChanged ? { measured_on: today, weight_kg: values.weightKg! } : null,
  };
}

const sameSet = <T>(a: T[], b: T[]) => a.length === b.length && a.every((item) => b.includes(item));

// Cambiar entorno, equipo o lesiones (RF-30, RF-31).
export function trainingSetupWrites(current: Identity, setup: { environment: Environment; equipment: Equipment[]; zones: Zone[] }) {
  const changed = setup.environment !== current.onboarding.environment || !sameSet(setup.equipment, current.onboarding.equipment);
  return {
    goal: changed ? goalRow(current, { environment: setup.environment, equipment: setup.equipment }) : null,
    addZones: setup.zones.filter((zone) => !current.onboarding.zones.includes(zone)),
    resolveZones: current.onboarding.zones.filter((zone) => !setup.zones.includes(zone)),
  };
}
