import { z } from 'zod';
import { HEALTH_QUESTIONNAIRE_VERSION, weightGoalPace, type completeOnboarding } from '../../onboarding/domain/onboarding';

type CompletedOnboarding = Extract<ReturnType<typeof completeOnboarding>, { ok: true }>;

// Payload de la RPC complete_onboarding. Se valida antes de enviarlo (RNF-13).
export const OnboardingPayloadSchema = z.object({
  consent_version: z.string().min(1),
  questionnaire_version: z.string().min(1),
  health_flags: z.array(z.enum(['injury', 'cardiovascular', 'pregnancy', 'eating-disorder'])),
  disclaimer_accepted_at: z.iso.datetime(),
  profile: z.object({
    display_name: z.string().min(1).max(80),
    sex: z.enum(['female', 'male', 'unspecified']),
    age_years: z.number().int().min(18).max(100),
    height_cm: z.number().min(120).max(230),
    activity: z.enum(['sedentary', 'light', 'moderate', 'high', 'very-high']),
  }),
  goal: z.object({
    goal: z.enum(['strength', 'muscle', 'fat-loss', 'health']),
    level: z.enum(['beginner', 'intermediate', 'advanced']),
    environment: z.enum(['none', 'calisthenics', 'small-gym', 'commercial-gym']),
    equipment: z.array(z.enum(['bodyweight', 'dumbbells', 'barbell', 'machines', 'bands'])),
    days_per_week: z.number().int().min(1).max(7),
    session_minutes: z.number().int().min(15).max(180),
  }),
  preferences: z.object({
    meals_per_day: z.number().int().min(3).max(6),
    preferred_food_ids: z.array(z.string()),
    disliked_food_ids: z.array(z.string()),
    exclusions: z.array(z.string()),
    diet_focus: z.string().max(200),
    training_day_targets: z.boolean(),
  }),
  injuries: z.array(z.enum(['back', 'knee', 'elbow', 'shoulder', 'wrist', 'hip'])),
  weight: z.object({ measured_on: z.iso.date(), weight_kg: z.number().min(30).max(300) }),
  weight_goal: z.object({
    start_kg: z.number(), target_kg: z.number(), start_date: z.iso.date(), end_date: z.iso.date(), pace_confirmed: z.boolean(),
  }).nullable(),
});
export type OnboardingPayload = z.infer<typeof OnboardingPayloadSchema>;

const daysBetween = (from: string, to: string) => (Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000;

export function onboardingPayload(result: CompletedOnboarding, today: string): OnboardingPayload {
  const { values, onboarding, preferences } = result;
  const goal = onboarding.weightGoal;
  // validateStep ya exigió confirmar un ritmo sobre 1 % semanal; aquí solo se registra (BR-20).
  const paceConfirmed = goal ? weightGoalPace(goal.startKg, goal.targetKg, daysBetween(goal.startDate, goal.endDate) / 7).exceeds : false;
  return OnboardingPayloadSchema.parse({
    consent_version: onboarding.consent.version,
    questionnaire_version: HEALTH_QUESTIONNAIRE_VERSION,
    health_flags: onboarding.healthFlags,
    disclaimer_accepted_at: onboarding.consent.acceptedAt,
    profile: {
      display_name: values.name, sex: onboarding.sex, age_years: values.ageYears, height_cm: values.heightCm, activity: onboarding.activity,
    },
    goal: {
      goal: onboarding.goal, level: onboarding.level, environment: onboarding.environment, equipment: onboarding.equipment,
      days_per_week: values.daysPerWeek, session_minutes: values.sessionMinutes,
    },
    preferences: {
      meals_per_day: preferences.mealsPerDay, preferred_food_ids: preferences.preferred, disliked_food_ids: preferences.disliked,
      exclusions: result.exclusions, diet_focus: result.dietFocus, training_day_targets: false,
    },
    injuries: onboarding.zones,
    weight: { measured_on: today, weight_kg: values.weightKg },
    weight_goal: goal ? { start_kg: goal.startKg, target_kg: goal.targetKg, start_date: goal.startDate, end_date: goal.endDate, pace_confirmed: paceConfirmed } : null,
  });
}

export type AccountStatus = 'needs-onboarding' | 'needs-consent' | 'ready';

export function accountStatus({ hasProfile, consent }: { hasProfile: boolean; consent: 'granted' | 'withdrawn' | null }): AccountStatus {
  if (!hasProfile) return 'needs-onboarding';
  return consent === 'granted' ? 'ready' : 'needs-consent';
}
