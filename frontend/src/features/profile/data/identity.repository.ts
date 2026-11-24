import type { Environment, Equipment, Goal, Zone } from '../../onboarding/domain/onboarding';
import { db, requireUserId } from '../../../lib/data/client';
import { DataError, unwrap } from '../../../lib/data/errors';
import type { PersonalValues } from '../domain/profile';
import { identityFromRows, personalWrites, trainingSetupWrites, type Identity } from './identity.mappers';
import type { NutritionValues } from '../components/ProfileEditors';

export async function fetchIdentity(): Promise<Identity> {
  const [profile, goal, preferences, injuries, screening, consent, weight, weightGoal] = await Promise.all([
    db().from('profiles').select('*').maybeSingle(),
    db().from('user_goals').select('*').order('id', { ascending: false }).limit(1).maybeSingle(),
    db().from('user_preferences').select('*').maybeSingle(),
    db().from('user_injuries').select('*').is('resolved_at', null).order('declared_at'),
    db().from('health_screenings').select('*').order('id', { ascending: false }).limit(1).maybeSingle(),
    db().from('consents').select('*').eq('kind', 'health-data').order('id', { ascending: false }).limit(1).maybeSingle(),
    db().from('body_measurements').select('weight_kg, measured_on').not('weight_kg', 'is', null).order('measured_on', { ascending: false }).limit(1).maybeSingle(),
    db().from('weight_goals').select('*').eq('status', 'active').maybeSingle(),
  ]);
  const rows = {
    profile: unwrap(profile), goal: unwrap(goal), preferences: unwrap(preferences), screening: unwrap(screening), consent: unwrap(consent),
  };
  // Las guardas solo abren estas pantallas con el onboarding completo: si falta algo es un error.
  if (!rows.profile || !rows.goal || !rows.preferences || !rows.screening || !rows.consent) throw new DataError('unknown');
  return identityFromRows({
    profile: rows.profile, goal: rows.goal, preferences: rows.preferences, screening: rows.screening, consent: rows.consent,
    injuries: unwrap(injuries) ?? [], latestWeight: unwrap(weight), weightGoal: unwrap(weightGoal),
  });
}

export async function savePersonal(current: Identity, values: PersonalValues, goal: Goal, today: string): Promise<void> {
  const userId = await requireUserId();
  const writes = personalWrites(current, values, goal, today);
  unwrap(await db().from('profiles').update(writes.profile).eq('user_id', userId));
  if (writes.goal) unwrap(await db().from('user_goals').insert(writes.goal));
  if (writes.weight) unwrap(await db().from('body_measurements').upsert(writes.weight, { onConflict: 'user_id,measured_on' }));
}

export async function saveNutritionPreferences(values: NutritionValues): Promise<void> {
  const userId = await requireUserId();
  unwrap(await db().from('user_preferences').update({
    exclusions: values.exclusions, diet_focus: values.dietFocus, meals_per_day: values.preferences.mealsPerDay,
    preferred_food_ids: values.preferences.preferred, disliked_food_ids: values.preferences.disliked, training_day_targets: values.trainingDayTargets,
  }).eq('user_id', userId));
}

export async function saveTrainingSetup(current: Identity, setup: { environment: Environment; equipment: Equipment[]; zones: Zone[] }): Promise<void> {
  const writes = trainingSetupWrites(current, setup);
  if (writes.goal) unwrap(await db().from('user_goals').insert(writes.goal));
  if (writes.resolveZones.length) {
    unwrap(await db().from('user_injuries').update({ resolved_at: new Date().toISOString() }).in('zone', writes.resolveZones).is('resolved_at', null));
  }
  if (writes.addZones.length) unwrap(await db().from('user_injuries').insert(writes.addZones.map((zone) => ({ zone }))));
}
