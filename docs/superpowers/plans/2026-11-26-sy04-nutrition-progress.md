# SY-04 · Nutrición y progreso persistidos — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** El diario de comidas, las metas nutricionales, la minuta con sus intercambios y los pesajes se guardan en Supabase; Inicio y Progreso leen datos reales y los de ejemplo solo aparecen con un modo de vista previa explícito en desarrollo.

**Architecture:** Igual que SY-02 y SY-03: mappers puros + repositorio + hooks de TanStack Query, y composición sobre los stores existentes para que las pantallas casi no cambien. La minuta se guarda por RPC atómica (`save_meal_plan`); un intercambio es un UPDATE de `items` de una comida. El diario conserva su id numérico en pantalla y guarda el `entry_id` (UUID) del registro en la base. Los errores de escritura del diario se muestran en Alimentación con Reintentar.

**Tech Stack:** Expo Router, TanStack Query 5, Zustand, supabase-js 2.118, Vitest, pgTAP (Supabase CLI).

**Spec:** `docs/superpowers/specs/2026-11-24-account-persistence-design.md` (sección SY-04 y criterio de terminado H-2).

## Global Constraints

- Lo de `2026-11-24-account-foundation.md`: errores con `DataError`/`unwrap`, claves con `userKey(userId, ...)`, nunca `service_role` en la app.
- "Escrituras multi-tabla por RPC", `security invoker`, `set search_path = ''`, `EXECUTE` solo para `authenticated`.
- "Sin conexión en la v0: lectura desde caché, escritura con conexión. Las escrituras fallan con un error claro y 'Reintentar'."
- "`ProfileData` deja de ser un blob: cada pantalla usa los hooks de su dominio. La lógica pura ya probada de los reducers se conserva como funciones de dominio."
- "Inicio y Progreso leen las queries reales; datos de vista previa solo con `__DEV__` y modo vista previa explícito en `dev-status`."
- Toda migración: prueba pgTAP y `npm run db:test` en verde; luego se aplica a la nube (`xwzpdaiaxmkcnepqxcky`) con el MCP y se alinea su versión con el nombre del archivo.
- `food_logs` guarda snapshot de nutrientes y procedencia por alimento (BR-07).
- El objetivo de peso ya se guarda en `weight_goals` desde el onboarding y se lee en la identidad (SY-02); este plan no lo cambia.
- Fuera de alcance: exportación de datos desde la nube (RF-16 con `data_requests`) y sueño (V1-01).
- Verificación final: `npm run check`, `npm run db:test`, `npm run test:integration`.

## File Structure

| Archivo | Responsabilidad |
|---|---|
| `backend/supabase/migrations/20261126000007_nutrition_writes.sql` (nuevo) | `food_logs.position` y RPC `save_meal_plan` |
| `backend/supabase/tests/database/60_meal_plan.test.sql` (nuevo) | pgTAP de la RPC y de `position` |
| `packages/nutrition-engine/src/meal-plan.ts` | Exportar `buildDay` |
| `frontend/src/features/nutrition/data/nutrition.mappers.ts` (+ test) | Filas ↔ dominio: diario, metas, minuta, intercambios, pesajes |
| `frontend/src/features/nutrition/data/nutrition.repository.ts` (+ integración) | Lecturas y escrituras |
| `frontend/src/features/nutrition/useNutrition.ts` | Hooks de consulta y mutación |
| `frontend/src/features/nutrition/useNutritionDiary.ts` | Composición del diario con el servidor |
| `frontend/src/features/nutrition/components/DiaryWriteError.tsx` (nuevo) | Aviso de escritura fallida con Reintentar |
| `frontend/src/features/dev/previewMode.ts` (nuevo) | Modo vista previa explícito |
| Rutas: `food-entry.tsx`, `barcode.tsx`, `food-photo.tsx`, `meal-plan.tsx`, `nutrition-goals.tsx`, `(tabs)/nutrition.tsx`, `(tabs)/progress.tsx`, `(tabs)/index.tsx`, `(tabs)/profile.tsx`, `dev-status.tsx` | Usar mutaciones y el modo vista previa |

---

### Task 1: Posición en el diario y RPC `save_meal_plan`

**Files:**
- Create: `backend/supabase/migrations/20261126000007_nutrition_writes.sql`
- Create: `backend/supabase/tests/database/60_meal_plan.test.sql`
- Modify: `backend/supabase/migrations/README.md`, `packages/contracts/src/database.types.ts` (regenerado)

**Interfaces:**
- Produces: columna `public.food_logs.position smallint not null default 0` (0..20).
- Produces: `public.save_meal_plan(payload jsonb) returns uuid`. Payload:
  `{ rule_version, catalog_version, nutrition_target_id, week_start: 'YYYY-MM-DD', meals_per_day, params: object, meals: [{ day, slot, day_type: 'training'|'rest'|null, target_kcal: int, target_protein_g: int, items: array }] }`

- [ ] **Step 1: Prueba pgTAP**

```sql
-- save_meal_plan: guarda la minuta con sus comidas en una transacción y archiva la anterior
-- (RF-12, RNF-08). food_logs.position conserva el orden de los alimentos de un registro.
begin;
select * from no_plan();

select set_config('t.a', tests.create_user('a@test.dev')::text, true);
select set_config('t.b', tests.create_user('b@test.dev')::text, true);

select tests.as_user(current_setting('t.a')::uuid);
insert into public.consents (kind, policy_version, action) values ('health-data', 'v0.1', 'granted');
insert into public.nutrition_targets (sex, age_years, height_cm, weight_kg, activity, direction, adjustment, protein_per_kg, fat_share,
  bmr_kcal, tdee_kcal, target_kcal, protein_g, carbs_g, fat_g, formula, rule_version)
values ('female', 30, 165, 70, 'moderate', 'maintenance', 0, 1.6, 0.25, 1400, 2170, 2170, 112, 270, 60, 'mifflin-st-jeor', 'nutricion-0.1');

select set_config('t.payload', jsonb_build_object(
  'rule_version', 'minuta-0.2', 'catalog_version', 'usda-sr-2018-04-cl-1',
  'nutrition_target_id', (select id from public.nutrition_targets), 'week_start', '2026-11-23', 'meals_per_day', 3,
  'params', '{"tolerance": 0.1}'::jsonb,
  'meals', '[
    {"day": 0, "slot": "breakfast", "day_type": null, "target_kcal": 500, "target_protein_g": 30, "items": [{"foodId": "oats"}]},
    {"day": 0, "slot": "lunch", "day_type": null, "target_kcal": 800, "target_protein_g": 45, "items": [{"foodId": "chicken"}]},
    {"day": 0, "slot": "dinner", "day_type": null, "target_kcal": 700, "target_protein_g": 37, "items": [{"foodId": "eggs"}]}
  ]'::jsonb)::text, true);

select set_config('t.first', public.save_meal_plan(current_setting('t.payload')::jsonb)::text, true);
select is((select count(*)::int from public.meal_plans where status = 'active'), 1, 'Queda una minuta activa');
select is((select count(*)::int from public.planned_meals), 3, 'Se guardan sus comidas');
select is((select result_id from public.recommendation_runs where kind = 'meal-plan'), current_setting('t.first')::uuid, 'Deja la traza (RNF-08)');

select lives_ok(format('select public.save_meal_plan(%L::jsonb)', current_setting('t.payload')), 'Una minuta nueva reemplaza a la activa');
select is((select status from public.meal_plans where id = current_setting('t.first')::uuid), 'archived', 'La anterior queda archivada');

select lives_ok($$ update public.planned_meals set items = '[{"foodId": "tofu"}]' where slot = 'lunch' $$, 'Un intercambio actualiza items');
select throws_ok($$ update public.planned_meals set target_kcal = 1 $$, '42501', null, 'Solo items es editable');

select throws_ok(
  format('select public.save_meal_plan(%L::jsonb)', jsonb_set(current_setting('t.payload')::jsonb, '{meals,0,slot}', '"brunch"')),
  '23514', null, 'Una comida inválida aborta todo'
);
select is((select count(*)::int from public.meal_plans), 2, 'El intento fallido no deja minuta suelta');

select lives_ok($$ insert into public.food_logs (entry_id, logged_on, meal, food_id, food_name, grams, kcal, protein_g, carbs_g, fat_g,
  source, source_version, license, catalog_version, position)
  values (gen_random_uuid(), '2026-11-26', 'lunch', 'rice', 'Arroz', 150, 195, 4, 42, 0.4, 'USDA FoodData Central', 'SR Legacy', 'CC0-1.0', 'usda-sr-2018-04-cl-1', 1) $$,
  'food_logs guarda la posición del alimento');
select throws_ok($$ insert into public.food_logs (entry_id, logged_on, meal, food_id, food_name, grams, kcal, protein_g, carbs_g, fat_g,
  source, source_version, license, catalog_version, position)
  values (gen_random_uuid(), '2026-11-26', 'lunch', 'rice', 'Arroz', 150, 195, 4, 42, 0.4, 'x', 'x', 'x', 'x', 99) $$,
  '23514', null, 'La posición tiene un límite');

select tests.as_user(current_setting('t.b')::uuid);
select is((select count(*)::int from public.meal_plans), 0, 'B no ve las minutas de A');

select tests.as_anon();
select throws_ok(format('select public.save_meal_plan(%L::jsonb)', current_setting('t.payload')), '42501', null, 'anon no puede guardar minutas');

select * from finish();
rollback;
```

- [ ] **Step 2: Correr y verificar que falla**

Run: `npm run db:test`
Expected: FAIL en `60_meal_plan.test.sql` (`function public.save_meal_plan(jsonb) does not exist`).

- [ ] **Step 3: Migración**

```sql
-- SY-04 · Escrituras de nutrición.
-- 1. Orden de los alimentos de un registro del diario: el primero es el principal y los
--    demás sus acompañamientos. Se insertan juntos, así que created_at no los ordena.
alter table public.food_logs add column position smallint not null default 0 check (position between 0 and 20);

-- 2. Minuta atómica (RF-12, RNF-08): archiva la activa e inserta la nueva con sus comidas y
--    la traza de la recomendación. security invoker: corre con la RLS de quien llama.
create function public.save_meal_plan(payload jsonb) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  new_plan_id uuid;
begin
  update public.meal_plans set status = 'archived'
  where user_id = (select auth.uid()) and status = 'active';

  insert into public.meal_plans (rule_version, catalog_version, nutrition_target_id, week_start, meals_per_day, params)
  values (
    payload ->> 'rule_version', payload ->> 'catalog_version', (payload ->> 'nutrition_target_id')::uuid,
    (payload ->> 'week_start')::date, (payload ->> 'meals_per_day')::smallint, coalesce(payload -> 'params', '{}')
  )
  returning id into new_plan_id;

  insert into public.planned_meals (plan_id, day, slot, day_type, target_kcal, target_protein_g, items)
  select new_plan_id, m.day, m.slot, m.day_type, m.target_kcal, m.target_protein_g, m.items
  from jsonb_to_recordset(coalesce(payload -> 'meals', '[]')) as m (
    day smallint, slot text, day_type text, target_kcal integer, target_protein_g integer, items jsonb
  );

  insert into public.recommendation_runs (kind, rule_version, params, result_id)
  values ('meal-plan', payload ->> 'rule_version', payload - 'meals' - 'params', new_plan_id);

  return new_plan_id;
end $$;

revoke execute on function public.save_meal_plan(jsonb) from public, anon;
grant execute on function public.save_meal_plan(jsonb) to authenticated;
```

`backend/supabase/migrations/README.md`, debajo de la fila de `20261126000006`:

```markdown
| `20261126000007_nutrition_writes.sql` | SY-04 | `food_logs.position` y RPC `save_meal_plan()` atómica |
```

- [ ] **Step 4: Verificar y regenerar tipos**

Run: `npm run db:test && npm run db:types`
Expected: PASS; `database.types.ts` incluye `position` en `food_logs` y `save_meal_plan`.

- [ ] **Step 5: Commit**

```bash
git add backend/supabase/migrations/20261126000007_nutrition_writes.sql backend/supabase/migrations/README.md \
  backend/supabase/tests/database/60_meal_plan.test.sql packages/contracts/src/database.types.ts
git commit -m "feat(db): add food log position and save_meal_plan RPC (SY-04)"
```

- [ ] **Step 6 (controlador): aplicar a la nube**

MCP: `apply_migration` (`name = "nutrition_writes"`, contenido exacto del archivo); `execute_sql`:
`update supabase_migrations.schema_migrations set version = '20261126000007' where name = 'nutrition_writes';`; `get_advisors` (security): sin avisos nuevos.

---

### Task 2: Mappers de nutrición y progreso

**Files:**
- Modify: `packages/nutrition-engine/src/meal-plan.ts:201` (exportar `buildDay`)
- Modify: `frontend/src/features/profile/domain/profile.ts` (`NutritionPlan` y `SavedMealPlan` con `id?`)
- Modify: `frontend/src/features/nutrition/domain/diary.ts:5` (`DiaryEntry` con `entryId?`)
- Create: `frontend/src/features/nutrition/data/nutrition.mappers.ts`, `nutrition.mappers.test.ts`, `nutrition.fixtures.ts`

**Interfaces:**
- Produces:
  - `NutritionPlan = { id?: string; proteinPerKg; fatShare; result; savedAt }`; `SavedMealPlan = StoredMealPlan & { createdAt: string; id?: string }`; `DiaryEntry = FoodEntry & { date: string; entryId?: string }`
  - `foodSource(foodId: string): { source: string; source_version: string; license: string }`
  - `foodLogRows(entry: FoodEntry, date: string, entryId: string)` → filas de `food_logs` (sin `user_id`)
  - `diaryFromRows(rows: FoodLogRow[], idFor: (entryId: string) => number): DiaryEntry[]`
  - `targetsRow(person: Person, settings: GoalSettings, result: NutritionTargets)` → fila de `nutrition_targets`
  - `nutritionPlanFromRow(row: TargetsRow): NutritionPlan`
  - `mealPlanPayload(plan: MealPlan, nutritionTargetId: string, weekStart: string)`
  - `mealPlanFromRows(plan: MealPlanRow, meals: PlannedMealRow[]): SavedMealPlan`
  - `swapChanges(before: MealPlan, after: MealPlan): { day: number; slot: PlanSlot; items: PlanItem[] }[]`
  - `weightsFromRows(rows: { measured_on: string; weight_kg: number | null }[]): WeightRecord[]`

- [ ] **Step 1: Exportar `buildDay` y ampliar tipos**

`packages/nutrition-engine/src/meal-plan.ts:201`: `function buildDay(` → `export function buildDay(`.

`features/profile/domain/profile.ts`:

```ts
export type NutritionPlan = { id?: string; proteinPerKg: number; fatShare: number; result: NutritionTargets; savedAt: string };
// …
export type SavedMealPlan = StoredMealPlan & { createdAt: string; id?: string };
```

`features/nutrition/domain/diary.ts:5`:

```ts
// entryId: id del registro en la base (SY-04); los de vista previa no lo tienen.
export type DiaryEntry = FoodEntry & { date: string; entryId?: string };
```

- [ ] **Step 2: Fixture y pruebas de los mappers**

`frontend/src/features/nutrition/data/nutrition.fixtures.ts` (solo para pruebas):

```ts
import type { MealPlan, NutritionTargets } from '@strongerfit/nutrition-engine';
import { createEmptyProfile } from '../../profile/domain/profile';
import { proposeMealPlan } from '../domain/meal-plan';

// Minuta real para pruebas: misma función que usa la pantalla de minuta.
export function proposeMealPlanForTest(result: Pick<NutritionTargets, 'kcal' | 'protein' | 'carbs' | 'fat'>): MealPlan {
  const proposal = proposeMealPlan(createEmptyProfile(), { kcal: result.kcal, protein: result.protein, carbs: result.carbs, fat: result.fat },
    new Date('2026-11-26T12:00:00Z'));
  if (!proposal.ok) throw new Error('no se pudo generar la minuta de prueba');
  const { createdAt: _createdAt, ...plan } = proposal.plan;
  return plan;
}
```

`nutrition.mappers.test.ts`:

```ts
import { buildDay, foodCatalog, nutritionTargets, type MealPlan } from '@strongerfit/nutrition-engine';
import type { Database } from '@strongerfit/contracts/database';
import { describe, expect, it } from 'vitest';
import type { FoodEntry } from '../domain/food-entry';
import { proposeMealPlanForTest } from './nutrition.fixtures';
import { diaryFromRows, foodLogRows, foodSource, mealPlanFromRows, mealPlanPayload, nutritionPlanFromRow, swapChanges, targetsRow,
  weightsFromRows } from './nutrition.mappers';

type Tables = Database['public']['Tables'];
const catalogFood = foodCatalog[0]!;

describe('procedencia (BR-07)', () => {
  it('distingue catálogo, código de barras, foto y propios', () => {
    expect(foodSource(catalogFood.id)).toEqual({ source: catalogFood.provenance.source, source_version: catalogFood.provenance.version,
      license: catalogFood.provenance.license });
    expect(foodSource('off:7801234')).toEqual({ source: 'Open Food Facts', source_version: 'api-v2', license: 'ODbL-1.0' });
    expect(foodSource('photo:rice')).toMatchObject({ source: 'Estimación por foto', license: 'Propia' });
    expect(foodSource('desconocido')).toMatchObject({ source: 'StrongerFit', license: 'Propia' });
  });
});

const entry: FoodEntry = {
  id: 7, meal: 'lunch', nutrients: { kcal: 400, protein: 35, carbs: 40, fat: 10 },
  items: [
    { foodId: catalogFood.id, name: 'Principal', grams: 150, nutrients: { kcal: 300, protein: 30, carbs: 20, fat: 8 } },
    { foodId: 'off:7801234', name: 'Acompañamiento', grams: 50.5, nutrients: { kcal: 100, protein: 5, carbs: 20, fat: 2 } },
  ],
};

describe('diario', () => {
  it('un registro se guarda como una fila por alimento, en orden', () => {
    const rows = foodLogRows(entry, '2026-11-26', 'e1');
    expect(rows.map((row) => [row.position, row.food_id, row.grams, row.kcal])).toEqual([[0, catalogFood.id, 150, 300], [1, 'off:7801234', 50.5, 100]]);
    expect(rows[0]).toMatchObject({ entry_id: 'e1', logged_on: '2026-11-26', meal: 'lunch', food_name: 'Principal', protein_g: 30 });
  });

  it('las filas reconstruyen los registros con id local estable', () => {
    const rows = [...foodLogRows(entry, '2026-11-26', 'e1').reverse(), ...foodLogRows({ ...entry, meal: 'dinner' }, '2026-11-26', 'e2')]
      .map((row, index): Tables['food_logs']['Row'] => ({ ...row, id: `r${index}`, user_id: 'u', created_at: `2026-11-26T1${index}:00:00Z`, updated_at: '' }));
    const ids = new Map([['e1', 1], ['e2', 2]]);
    const diary = diaryFromRows(rows, (id) => ids.get(id)!);
    expect(diary).toHaveLength(2);
    expect(diary[0]).toEqual({ ...entry, id: 1, date: '2026-11-26', entryId: 'e1' });
    expect(diary[1]).toMatchObject({ id: 2, meal: 'dinner', entryId: 'e2' });
  });
});

const person = { sex: 'female' as const, ageYears: 30, heightCm: 165, weightKg: 70, activity: 'moderate' as const };
const settings = { direction: 'deficit' as const, adjustment: 0.15, proteinPerKg: 1.6, fatShare: 0.25 };

describe('metas nutricionales', () => {
  it('guardar y leer devuelve la misma meta', () => {
    const result = nutritionTargets({ ...person, ...settings, healthRisk: false });
    const row = targetsRow(person, settings, result);
    expect(row).toMatchObject({ direction: 'deficit', adjustment: 0.15, target_kcal: result.kcal, bmr_kcal: result.bmr, rule_version: result.ruleVersion });
    const plan = nutritionPlanFromRow({ ...row, id: 't1', user_id: 'u', created_at: '2026-11-26T12:00:00Z', training_day_kcal: null, rest_day_kcal: null });
    expect(plan).toEqual({ id: 't1', proteinPerKg: 1.6, fatShare: 0.25, result, savedAt: '2026-11-26T12:00:00Z' });
  });
});

describe('minuta', () => {
  const plan = proposeMealPlanForTest({ kcal: 2100, protein: 120, carbs: 230, fat: 70 });

  function rowsFrom(payload: ReturnType<typeof mealPlanPayload>) {
    const planRow: Tables['meal_plans']['Row'] = {
      id: 'm1', user_id: 'u', status: 'active', created_at: '2026-11-26T12:00:00Z', rule_version: payload.rule_version,
      catalog_version: payload.catalog_version, nutrition_target_id: payload.nutrition_target_id, week_start: payload.week_start,
      meals_per_day: payload.meals_per_day, params: payload.params as never,
    };
    const meals = payload.meals.map((meal, index): Tables['planned_meals']['Row'] => ({
      ...meal, id: `p${index}`, plan_id: 'm1', user_id: 'u', updated_at: '', items: meal.items as never,
    })).reverse();
    return { planRow, meals };
  }

  it('el payload y las filas reconstruyen la misma minuta', () => {
    const { planRow, meals } = rowsFrom(mealPlanPayload(plan, 't1', '2026-11-23'));
    const stored = mealPlanFromRows(planRow, meals);
    expect(stored).toMatchObject({ id: 'm1', createdAt: '2026-11-26T12:00:00Z' });
    const { id: _id, createdAt: _createdAt, ...rest } = stored;
    expect(rest).toEqual(plan);
  });

  it('un intercambio cambia solo los items de esa comida', () => {
    const day = plan.days[0]!;
    const meal = day.meals[0]!;
    const replaced = { ...meal.items[0]!, foodId: 'otro', name: 'Otro' };
    const items = [replaced, ...meal.items.slice(1)];
    const after: MealPlan = { ...plan, days: plan.days.map((current) => current.index !== 0 ? current
      : buildDay(0, current.type, current.meals.map((entry) => entry.meal === meal.meal ? { ...entry, items } : entry), current.targets)) };
    expect(swapChanges(plan, after)).toEqual([{ day: 0, slot: meal.meal, items }]);
  });
});

describe('pesajes', () => {
  it('omite mediciones sin peso', () => {
    expect(weightsFromRows([{ measured_on: '2026-11-25', weight_kg: 70.4 }, { measured_on: '2026-11-26', weight_kg: null }]))
      .toEqual([{ date: '2026-11-25', kg: 70.4 }]);
  });
});
```

- [ ] **Step 3: Correr y verificar que fallan**

Run: `npx vitest run frontend/src/features/nutrition/data/nutrition.mappers.test.ts`
Expected: FAIL (módulo no existe).

- [ ] **Step 4: Implementar los mappers**

```ts
import type { Database } from '@strongerfit/contracts/database';
import { buildDay, foodCatalog, FOOD_CATALOG_VERSION, nutritionTargets, type ActivityLevel, type Direction, type MealPlan,
  type NutritionTargets, type Person, type PlanItem, type PlanSlot, type Sex, type Warning } from '@strongerfit/nutrition-engine';
import type { NutritionPlan, SavedMealPlan } from '../../profile/domain/profile';
import type { WeightRecord } from '../../progress/domain/progress';
import type { DiaryEntry } from '../domain/diary';
import { sumNutrients, type FoodEntry, type MealId } from '../domain/food-entry';
import type { GoalSettings } from '../domain/goals';

type Tables = Database['public']['Tables'];
type FoodLogRow = Tables['food_logs']['Row'];
type TargetsRow = Tables['nutrition_targets']['Row'];
type MealPlanRow = Tables['meal_plans']['Row'];
type PlannedMealRow = Tables['planned_meals']['Row'];

const catalog = new Map(foodCatalog.map((food) => [food.id, food]));

// Procedencia de cada alimento registrado (BR-07): catálogo, Open Food Facts, foto o propio.
export function foodSource(foodId: string) {
  const food = catalog.get(foodId);
  if (food) return { source: food.provenance.source, source_version: food.provenance.version, license: food.provenance.license };
  if (foodId.startsWith('off:')) return { source: 'Open Food Facts', source_version: 'api-v2', license: 'ODbL-1.0' };
  if (foodId.startsWith('photo:')) return { source: 'Estimación por foto', source_version: 'demo-0.1', license: 'Propia' };
  return { source: 'StrongerFit', source_version: '1', license: 'Propia' };
}

const round1 = (value: number) => Math.round(value * 10) / 10;

export function foodLogRows(entry: FoodEntry, date: string, entryId: string) {
  return entry.items.map((item, position) => ({
    entry_id: entryId, logged_on: date, meal: entry.meal, position, food_id: item.foodId, food_name: item.name.slice(0, 120),
    grams: round1(item.grams), kcal: round1(item.nutrients.kcal), protein_g: round1(item.nutrients.protein),
    carbs_g: round1(item.nutrients.carbs), fat_g: round1(item.nutrients.fat), catalog_version: FOOD_CATALOG_VERSION,
    ...foodSource(item.foodId),
  }));
}

export function diaryFromRows(rows: FoodLogRow[], idFor: (entryId: string) => number): DiaryEntry[] {
  const groups = new Map<string, FoodLogRow[]>();
  const sorted = [...rows].sort((a, b) => a.logged_on.localeCompare(b.logged_on) || a.created_at.localeCompare(b.created_at) || a.position - b.position);
  for (const row of sorted) groups.set(row.entry_id, [...(groups.get(row.entry_id) ?? []), row]);
  return [...groups.entries()].map(([entryId, group]) => {
    const items = [...group].sort((a, b) => a.position - b.position).map((row) => ({
      foodId: row.food_id, name: row.food_name, grams: Number(row.grams),
      nutrients: { kcal: Number(row.kcal), protein: Number(row.protein_g), carbs: Number(row.carbs_g), fat: Number(row.fat_g) },
    }));
    return { id: idFor(entryId), entryId, date: group[0]!.logged_on, meal: group[0]!.meal as MealId, items,
      nutrients: sumNutrients(items.map((item) => item.nutrients)) };
  });
}

export const targetsRow = (person: Person, settings: GoalSettings, result: NutritionTargets) => ({
  sex: person.sex, age_years: person.ageYears, height_cm: person.heightCm, weight_kg: person.weightKg, activity: person.activity,
  direction: result.direction, adjustment: result.adjustment, protein_per_kg: settings.proteinPerKg, fat_share: settings.fatShare,
  bmr_kcal: result.bmr, tdee_kcal: result.tdee, target_kcal: result.kcal, protein_g: result.protein, carbs_g: result.carbs, fat_g: result.fat,
  warnings: result.warnings, formula: 'mifflin-st-jeor', rule_version: result.ruleVersion,
});

// La meta se recalcula desde sus entradas guardadas (RNF-07): el cálculo es determinista. La
// dirección guardada ya trae aplicado el riesgo (BR-19), por eso aquí va healthRisk: false.
export function nutritionPlanFromRow(row: TargetsRow): NutritionPlan {
  const proteinPerKg = Number(row.protein_per_kg);
  const fatShare = Number(row.fat_share);
  const result = nutritionTargets({
    sex: row.sex as Sex, ageYears: row.age_years, heightCm: Number(row.height_cm), weightKg: Number(row.weight_kg),
    activity: row.activity as ActivityLevel, direction: row.direction as Direction, adjustment: Number(row.adjustment),
    proteinPerKg, fatShare, healthRisk: false,
  });
  return { id: row.id, proteinPerKg, fatShare, savedAt: row.created_at,
    result: { ...result, ruleVersion: row.rule_version, warnings: row.warnings as Warning[] } };
}

// params guarda todo lo que no son comidas, con las metas exactas por comida; las columnas
// target_kcal y target_protein_g llevan valores redondeados para consultas.
export function mealPlanPayload(plan: MealPlan, nutritionTargetId: string, weekStart: string) {
  const { days, ruleVersion, catalogVersion, ...rest } = plan;
  return {
    rule_version: ruleVersion, catalog_version: catalogVersion, nutrition_target_id: nutritionTargetId, week_start: weekStart,
    meals_per_day: days[0]?.meals.length ?? 0,
    params: { ...rest, days: days.map((day) => ({ index: day.index, type: day.type, targets: day.targets,
      meals: day.meals.map((meal) => ({ meal: meal.meal, targetKcal: meal.targetKcal, targetProtein: meal.targetProtein })) })) },
    meals: days.flatMap((day) => day.meals.map((meal) => ({
      day: day.index, slot: meal.meal, day_type: day.type, target_kcal: Math.round(meal.targetKcal),
      target_protein_g: Math.round(meal.targetProtein), items: meal.items,
    }))),
  };
}

type PlanParams = Omit<MealPlan, 'days' | 'ruleVersion' | 'catalogVersion'> & {
  days: { index: number; type: MealPlan['days'][number]['type']; targets: MealPlan['days'][number]['targets'];
    meals: { meal: PlanSlot; targetKcal: number; targetProtein: number }[] }[];
};

export function mealPlanFromRows(plan: MealPlanRow, meals: PlannedMealRow[]): SavedMealPlan {
  const { days, ...rest } = plan.params as unknown as PlanParams;
  return {
    id: plan.id, createdAt: plan.created_at, ruleVersion: plan.rule_version, catalogVersion: plan.catalog_version, ...rest,
    days: days.map((day) => buildDay(day.index, day.type, day.meals.map((slot) => {
      const row = meals.find((meal) => meal.day === day.index && meal.slot === slot.meal);
      const items = (row?.items ?? []) as unknown as PlanItem[];
      return { ...slot, items, nutrients: sumNutrients(items.map((item) => item.nutrients)) };
    }), day.targets)),
  };
}

export function swapChanges(before: MealPlan, after: MealPlan) {
  return after.days.flatMap((day) => day.meals.flatMap((meal) => {
    const previous = before.days.find((value) => value.index === day.index)?.meals.find((value) => value.meal === meal.meal);
    return previous && JSON.stringify(previous.items) !== JSON.stringify(meal.items) ? [{ day: day.index, slot: meal.meal, items: meal.items }] : [];
  }));
}

export const weightsFromRows = (rows: { measured_on: string; weight_kg: number | null }[]): WeightRecord[] =>
  rows.flatMap((row) => row.weight_kg === null ? [] : [{ date: row.measured_on, kg: Number(row.weight_kg) }]);
```

Si `buildDay` reconstruye `nutrients` de una comida con otro redondeo que el engine (`addNutrients`), usar `addNutrients` exportado por el engine en vez de `sumNutrients` del frontend para el `nutrients` de cada comida.

- [ ] **Step 5: Correr y verificar que pasan**

Run: `npx vitest run frontend/src/features/nutrition/data/nutrition.mappers.test.ts && npm run check`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/nutrition-engine/src/meal-plan.ts frontend/src/features/profile/domain/profile.ts frontend/src/features/nutrition/domain/diary.ts \
  frontend/src/features/nutrition/data/nutrition.mappers.ts frontend/src/features/nutrition/data/nutrition.mappers.test.ts \
  frontend/src/features/nutrition/data/nutrition.fixtures.ts
git commit -m "feat(app): map nutrition and weight rows to domain (SY-04)"
```

---

### Task 3: Repositorio de nutrición y pesajes

**Files:**
- Create: `frontend/src/features/nutrition/data/nutrition.repository.ts`, `nutrition.repository.integration.test.ts`

**Interfaces:**
- Consumes: mappers de la Task 2, `newClientId` (`lib/data/ids.ts`).
- Produces:
  - `fetchFoodLogs(date: string, idFor: (entryId: string) => number): Promise<DiaryEntry[]>`
  - `type DiaryWrite = { kind: 'add'; date: string; entry: FoodEntry } | { kind: 'update'; before: DiaryEntry; entry: FoodEntry } | { kind: 'delete-meal'; date: string; meal: MealId }`
  - `writeDiary(write: DiaryWrite): Promise<void>`
  - `fetchNutritionPlan(): Promise<NutritionPlan | null>`, `saveNutritionTargets(person: Person, settings: GoalSettings, result: NutritionTargets): Promise<string>`
  - `fetchMealPlan(): Promise<SavedMealPlan | null>`, `saveMealPlan(plan: MealPlan, nutritionTargetId: string, weekStart: string): Promise<string>`, `swapMeals(planId: string, changes: ReturnType<typeof swapChanges>): Promise<void>`
  - `fetchWeights(): Promise<WeightRecord[]>`, `recordWeight(date: string, kg: number): Promise<void>`

- [ ] **Step 1: Prueba de integración**

```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@strongerfit/contracts/database';
import { foodCatalog, nutritionTargets } from '@strongerfit/nutrition-engine';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { signedInUser } from '../../../../test/integration/users';
import { onboardingPayload } from '../../account/data/account.mappers';
import { completeOnboarding, createDraft, type Draft } from '../../onboarding/domain/onboarding';
import type { FoodEntry } from '../domain/food-entry';

let current: SupabaseClient<Database>;
vi.mock('../../../lib/supabase', () => ({ getSupabase: () => current }));
const { saveOnboarding } = await import('../../account/data/account.repository');
const repo = await import('./nutrition.repository');

const draft = (): Draft => ({
  ...createDraft(), name: 'Ana', age: '30', sex: 'female', height: '165', weight: '80', activity: 'moderate',
  goal: 'strength', level: 'beginner', days: '3', minutes: '45', environment: 'small-gym', equipment: ['dumbbells'],
  targetWeight: '76', weeks: '8', exclusions: '', noHealthFlags: true, healthFlags: [], zones: [], disclaimerRead: true, consent: true,
});

async function onboard(client: SupabaseClient<Database>) {
  current = client;
  const result = completeOnboarding(draft(), new Date(), '2026-11-24');
  if (!result.ok) throw new Error('borrador inválido');
  await saveOnboarding(onboardingPayload(result, '2026-11-24'));
}

const food = foodCatalog[0]!;
const entry = (grams: number): FoodEntry => ({
  id: 0, meal: 'lunch', nutrients: { kcal: grams, protein: 10, carbs: 10, fat: 1 },
  items: [{ foodId: food.id, name: food.name, grams, nutrients: { kcal: grams, protein: 10, carbs: 10, fat: 1 } },
    { foodId: 'off:7801234', name: 'Pan', grams: 30, nutrients: { kcal: 80, protein: 3, carbs: 15, fat: 1 } }],
});
let next = 1;
const ids = new Map<string, number>();
const idFor = (entryId: string) => ids.get(entryId) ?? (ids.set(entryId, next++), ids.get(entryId)!);
const person = { sex: 'female' as const, ageYears: 30, heightCm: 165, weightKg: 80, activity: 'moderate' as const };
const settings = { direction: 'maintenance' as const, adjustment: 0, proteinPerKg: 1.6, fatShare: 0.25 };

describe('repositorio de nutrición contra Supabase local', () => {
  beforeEach(async () => { await onboard((await signedInUser()).client); });

  it('agrega, edita y borra registros del diario conservando el orden (RF-11)', async () => {
    await repo.writeDiary({ kind: 'add', date: '2026-11-26', entry: entry(150) });
    const [saved] = await repo.fetchFoodLogs('2026-11-26', idFor);
    expect(saved!.items.map((item) => item.foodId)).toEqual([food.id, 'off:7801234']);

    await repo.writeDiary({ kind: 'update', before: saved!, entry: entry(200) });
    const updated = await repo.fetchFoodLogs('2026-11-26', idFor);
    expect(updated).toHaveLength(1);
    expect(updated[0]!.items[0]!.grams).toBe(200);

    await repo.writeDiary({ kind: 'delete-meal', date: '2026-11-26', meal: 'lunch' });
    expect(await repo.fetchFoodLogs('2026-11-26', idFor)).toEqual([]);
  });

  it('guarda la meta y la lee igual (RNF-07)', async () => {
    const result = nutritionTargets({ ...person, ...settings, healthRisk: false });
    const id = await repo.saveNutritionTargets(person, settings, result);
    expect(await repo.fetchNutritionPlan()).toMatchObject({ id, proteinPerKg: 1.6, result: { kcal: result.kcal } });
  });

  it('guarda la minuta, aplica un intercambio y la lee', async () => {
    const result = nutritionTargets({ ...person, ...settings, healthRisk: false });
    const targetId = await repo.saveNutritionTargets(person, settings, result);
    const { proposeMealPlanForTest } = await import('./nutrition.fixtures');
    const plan = proposeMealPlanForTest(result);
    const planId = await repo.saveMealPlan(plan, targetId, '2026-11-23');
    const stored = (await repo.fetchMealPlan())!;
    expect(stored.id).toBe(planId);
    const meal = stored.days[0]!.meals[0]!;
    const items = [{ ...meal.items[0]!, name: 'Cambiado' }, ...meal.items.slice(1)];
    await repo.swapMeals(planId, [{ day: 0, slot: meal.meal, items }]);
    expect((await repo.fetchMealPlan())!.days[0]!.meals[0]!.items[0]!.name).toBe('Cambiado');
  });

  it('un pesaje por día; repetirlo lo reemplaza (RF-15)', async () => {
    await repo.recordWeight('2026-11-26', 79.6);
    await repo.recordWeight('2026-11-26', 79.4);
    expect(await repo.fetchWeights()).toEqual(expect.arrayContaining([{ date: '2026-11-26', kg: 79.4 }]));
    expect((await repo.fetchWeights()).filter((item) => item.date === '2026-11-26')).toHaveLength(1);
  });

  it('otra persona no ve el diario ni la meta de la primera (CA-01)', async () => {
    await repo.writeDiary({ kind: 'add', date: '2026-11-26', entry: entry(150) });
    await onboard((await signedInUser()).client);
    expect(await repo.fetchFoodLogs('2026-11-26', idFor)).toEqual([]);
    expect(await repo.fetchNutritionPlan()).toBeNull();
  });
});
```

(`nutrition.fixtures.ts` se crea en la Task 2.)

- [ ] **Step 2: Verificar que falla**

Run: `npm run test:integration -- frontend/src/features/nutrition`
Expected: FAIL (`./nutrition.repository` no existe).

- [ ] **Step 3: Implementar**

```ts
import type { Json } from '@strongerfit/contracts/database';
import type { MealPlan, NutritionTargets, Person } from '@strongerfit/nutrition-engine';
import { db } from '../../../lib/data/client';
import { DataError, unwrap } from '../../../lib/data/errors';
import { newClientId } from '../../../lib/data/ids';
import type { NutritionPlan, SavedMealPlan } from '../../profile/domain/profile';
import type { WeightRecord } from '../../progress/domain/progress';
import type { DiaryEntry } from '../domain/diary';
import type { FoodEntry, MealId } from '../domain/food-entry';
import type { GoalSettings } from '../domain/goals';
import { diaryFromRows, foodLogRows, mealPlanFromRows, mealPlanPayload, nutritionPlanFromRow, targetsRow, weightsFromRows,
  type swapChanges } from './nutrition.mappers';

function requireId(id: string | null | undefined): string {
  if (!id) throw new DataError('unknown');
  return id;
}

export async function fetchFoodLogs(date: string, idFor: (entryId: string) => number): Promise<DiaryEntry[]> {
  const rows = unwrap(await db().from('food_logs').select('*').eq('logged_on', date).order('created_at')) ?? [];
  return diaryFromRows(rows, idFor);
}

export type DiaryWrite =
  | { kind: 'add'; date: string; entry: FoodEntry }
  | { kind: 'update'; before: DiaryEntry; entry: FoodEntry }
  | { kind: 'delete-meal'; date: string; meal: MealId };

// Editar inserta primero el registro nuevo y después borra el anterior: si el borrado falla
// queda un duplicado visible, nunca se pierde el registro.
export async function writeDiary(write: DiaryWrite): Promise<void> {
  if (write.kind === 'delete-meal') {
    unwrap(await db().from('food_logs').delete().eq('logged_on', write.date).eq('meal', write.meal));
    return;
  }
  const date = write.kind === 'add' ? write.date : write.before.date;
  unwrap(await db().from('food_logs').insert(foodLogRows(write.entry, date, newClientId())));
  if (write.kind === 'update' && write.before.entryId) {
    unwrap(await db().from('food_logs').delete().eq('entry_id', write.before.entryId));
  }
}

export async function fetchNutritionPlan(): Promise<NutritionPlan | null> {
  const row = unwrap(await db().from('nutrition_targets').select('*').order('created_at', { ascending: false }).limit(1).maybeSingle());
  return row ? nutritionPlanFromRow(row) : null;
}

export async function saveNutritionTargets(person: Person, settings: GoalSettings, result: NutritionTargets): Promise<string> {
  const row = unwrap(await db().from('nutrition_targets').insert(targetsRow(person, settings, result)).select('id').single());
  const id = requireId(row?.id);
  unwrap(await db().from('recommendation_runs').insert({ kind: 'nutrition-targets', rule_version: result.ruleVersion, result_id: id,
    params: { direction: result.direction, adjustment: result.adjustment, protein_per_kg: settings.proteinPerKg, fat_share: settings.fatShare } }));
  return id;
}

export async function fetchMealPlan(): Promise<SavedMealPlan | null> {
  const plan = unwrap(await db().from('meal_plans').select('*').eq('status', 'active').maybeSingle());
  if (!plan) return null;
  const meals = unwrap(await db().from('planned_meals').select('*').eq('plan_id', plan.id)) ?? [];
  return mealPlanFromRows(plan, meals);
}

export async function saveMealPlan(plan: MealPlan, nutritionTargetId: string, weekStart: string): Promise<string> {
  return requireId(unwrap(await db().rpc('save_meal_plan', { payload: mealPlanPayload(plan, nutritionTargetId, weekStart) as unknown as Json })));
}

export async function swapMeals(planId: string, changes: ReturnType<typeof swapChanges>): Promise<void> {
  for (const change of changes) {
    unwrap(await db().from('planned_meals').update({ items: change.items as unknown as Json })
      .eq('plan_id', planId).eq('day', change.day).eq('slot', change.slot));
  }
}

export async function fetchWeights(): Promise<WeightRecord[]> {
  const rows = unwrap(await db().from('body_measurements').select('measured_on, weight_kg').order('measured_on')) ?? [];
  return weightsFromRows(rows);
}

export async function recordWeight(date: string, kg: number): Promise<void> {
  unwrap(await db().from('body_measurements').upsert({ measured_on: date, weight_kg: kg }, { onConflict: 'user_id,measured_on' }));
}
```

- [ ] **Step 4: Verificar**

Run: `npm run test:integration -- frontend/src/features/nutrition && (cd frontend && npx tsc --noEmit -p .)`
Expected: 5 pruebas PASS, sin errores de tipos.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/nutrition/data/nutrition.repository.ts frontend/src/features/nutrition/data/nutrition.repository.integration.test.ts
git commit -m "feat(app): read and write nutrition and weights in Supabase (SY-04)"
```

---

### Task 4: Hooks y diario con el servidor

**Files:**
- Create: `frontend/src/features/nutrition/useNutrition.ts`
- Create: `frontend/src/features/nutrition/components/DiaryWriteError.tsx`
- Modify: `frontend/src/features/nutrition/useNutritionDiary.ts`
- Modify: `frontend/src/app/food-entry.tsx`, `frontend/src/app/barcode.tsx`, `frontend/src/app/food-photo.tsx`, `frontend/src/app/(tabs)/nutrition.tsx`

**Interfaces:**
- Produces (`useNutrition.ts`):
  - `nutritionKey(userId)` → `userKey(userId, 'nutrition')`; `diaryWriteKey = ['diary-write']`
  - `useFoodLogs(date: string)`, `useNutritionPlan()`, `useMealPlan()`, `useWeights()`
  - `useDiaryWrite()` → `mutate(write: DiaryWrite)` (con `mutationKey: diaryWriteKey`)
  - `useSaveNutritionTargets()` → `mutate({ person, settings, result })`
  - `useSaveMealPlan()` → `mutate({ plan, nutritionTargetId, weekStart })`; `useSwapMeals()` → `mutate({ planId, before, after })`
  - `useRecordWeight()` → `mutate({ date, kg })`
- `useNutritionDiary()` devuelve la misma forma que hoy (`selectedDate`, `entries`, `targets`, `nextId`, `dispatch`), con `entries` y `targets` del servidor.

- [ ] **Step 1: Hooks**

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MealPlan, NutritionTargets, Person } from '@strongerfit/nutrition-engine';
import { useContext } from 'react';
import { userKey } from '../../lib/data/keys';
import { SessionContext } from '../account/SessionContext';
import { swapChanges } from './data/nutrition.mappers';
import { fetchFoodLogs, fetchMealPlan, fetchNutritionPlan, fetchWeights, recordWeight, saveMealPlan, saveNutritionTargets, swapMeals,
  writeDiary, type DiaryWrite } from './data/nutrition.repository';
import type { GoalSettings } from './domain/goals';

export const nutritionKey = (userId: string) => userKey(userId, 'nutrition');
export const diaryWriteKey = ['diary-write'] as const;

// Id numérico estable por registro mientras la app está abierta: las pantallas lo usan en rutas.
const localIds = new Map<string, number>();
const localIdFor = (entryId: string) => {
  if (!localIds.has(entryId)) localIds.set(entryId, localIds.size + 1);
  return localIds.get(entryId)!;
};

function useUserQuery<T>(key: readonly unknown[], queryFn: () => Promise<T>) {
  const { userId } = useContext(SessionContext);
  return useQuery({ queryKey: [...userKey(userId ?? 'anon'), ...key], queryFn, enabled: userId !== null });
}

export const useFoodLogs = (date: string) => useUserQuery(['nutrition', 'diary', date], () => fetchFoodLogs(date, localIdFor));
export const useNutritionPlan = () => useUserQuery(['nutrition', 'targets'], fetchNutritionPlan);
export const useMealPlan = () => useUserQuery(['nutrition', 'meal-plan'], fetchMealPlan);
export const useWeights = () => useUserQuery(['progress', 'weights'], fetchWeights);

// Las escrituras refrescan todo lo de la persona: metas, minuta, Inicio e identidad (último peso).
function useUserMutation<T, R>(write: (input: T) => Promise<R>, mutationKey?: readonly unknown[]) {
  const { userId } = useContext(SessionContext);
  const client = useQueryClient();
  return useMutation({ mutationKey, mutationFn: write, onSuccess: () => client.invalidateQueries({ queryKey: userKey(userId ?? 'anon') }) });
}

export const useDiaryWrite = () => useUserMutation((write: DiaryWrite) => writeDiary(write), diaryWriteKey);
export const useSaveNutritionTargets = () => useUserMutation(({ person, settings, result }: { person: Person; settings: GoalSettings; result: NutritionTargets }) =>
  saveNutritionTargets(person, settings, result));
export const useSaveMealPlan = () => useUserMutation(({ plan, nutritionTargetId, weekStart }: { plan: MealPlan; nutritionTargetId: string; weekStart: string }) =>
  saveMealPlan(plan, nutritionTargetId, weekStart));
export const useSwapMeals = () => useUserMutation(({ planId, before, after }: { planId: string; before: MealPlan; after: MealPlan }) =>
  swapMeals(planId, swapChanges(before, after)));
export const useRecordWeight = () => useUserMutation(({ date, kg }: { date: string; kg: number }) => recordWeight(date, kg));
```

- [ ] **Step 2: Composición del diario**

Reemplazar `features/nutrition/useNutritionDiary.ts` por:

```ts
import { useMemo } from 'react';
import { useStore } from 'zustand';
import { createPreviewDiary } from './data/diary.preview';
import { createEmptyDiary, todayDateKey } from './domain/diary';
import { createDiaryStore } from './state/diary-store';
import { useFoodLogs, useNutritionPlan } from './useNutrition';

// Fecha elegida en memoria; registros y meta vienen de Supabase (SY-04). En desarrollo, sin
// sesión de datos todavía, se ven los de ejemplo hasta que el servidor responde.
const diaryStore = createDiaryStore(__DEV__ ? createPreviewDiary() : createEmptyDiary());

export function useNutritionDiary() {
  const local = useStore(diaryStore);
  const today = todayDateKey();
  const selected = useFoodLogs(local.selectedDate);
  const todays = useFoodLogs(today);
  const plan = useNutritionPlan();
  return useMemo(() => {
    if (!selected.isSuccess || !todays.isSuccess || !plan.isSuccess) return local;
    const entries = new Map([...todays.data, ...selected.data].map((entry) => [entry.id, entry]));
    const result = plan.data?.result;
    return { ...local, entries: [...entries.values()],
      targets: result ? { kcal: result.kcal, protein: result.protein, carbs: result.carbs, fat: result.fat } : null };
  }, [local, selected.isSuccess, selected.data, todays.isSuccess, todays.data, plan.isSuccess, plan.data]);
}

export function resetNutritionDiary() {
  diaryStore.setState(createEmptyDiary());
}

export function nutritionDiarySnapshot() {
  const { dispatch: _dispatch, ...diary } = diaryStore.getState();
  return diary;
}
```

(La Task 6 cambia el valor inicial de `diaryStore` por el modo vista previa.)

- [ ] **Step 3: Aviso de escritura fallida**

`features/nutrition/components/DiaryWriteError.tsx`:

```tsx
import { useMutationState, useQueryClient, type Mutation } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';
import { AppButton } from '../../../components/ui/AppButton';
import { AppText } from '../../../components/ui/AppText';
import { Card } from '../../../components/ui/Card';
import { dataErrorMessage, toDataError } from '../../../lib/data/errors';
import { spacing } from '../../../theme';
import type { DiaryWrite } from '../data/nutrition.repository';
import { diaryWriteKey, useDiaryWrite } from '../useNutrition';

// Las pantallas de registro vuelven al diario sin esperar al servidor; si la escritura falla,
// el diario lo avisa aquí con Reintentar.
export function DiaryWriteError() {
  const client = useQueryClient();
  const retry = useDiaryWrite();
  const failed = useMutationState({ filters: { mutationKey: diaryWriteKey, status: 'error' }, select: (mutation) => mutation as Mutation<void, Error, DiaryWrite> });
  const latest = failed.at(-1);
  if (!latest) return null;
  const dismiss = () => { for (const mutation of failed) client.getMutationCache().remove(mutation); };
  return <Card tone="low" style={styles.card}>
    <AppText accessibilityRole="alert">No pudimos guardar el último cambio del diario. {dataErrorMessage(toDataError(latest.state.error))}</AppText>
    <View style={styles.actions}>
      <AppButton label="Reintentar" icon="refresh-outline" disabled={retry.isPending}
        onPress={() => { const write = latest.state.variables; dismiss(); if (write) retry.mutate(write); }} />
      <AppButton label="Descartar" variant="secondary" onPress={dismiss} />
    </View>
  </Card>;
}

const styles = StyleSheet.create({ card: { gap: spacing.sm }, actions: { gap: spacing.sm } });
```

- [ ] **Step 4: Rutas del diario**

`app/food-entry.tsx`: agregar `const write = useDiaryWrite();` (import de `../features/nutrition/useNutrition`) y reemplazar el cuerpo de `save` por:

```ts
  function save(entry: FoodEntry) {
    write.mutate(existing ? { kind: 'update', before: existing, entry } : { kind: 'add', date, entry });
    diary.dispatch({ type: 'select-date', date });
    exit();
  }
```

`app/barcode.tsx` y `app/food-photo.tsx`: agregar `const write = useDiaryWrite();` y reemplazar `diary.dispatch({ type: 'add', date, entry });` por `write.mutate({ kind: 'add', date, entry });` (la línea de `select-date` queda).

`app/(tabs)/nutrition.tsx`: agregar `const write = useDiaryWrite();`, cambiar `onDelete` por

```tsx
    onDelete={(meal) => write.mutate({ kind: 'delete-meal', date: diary.selectedDate, meal })}
```

y renderizar el aviso sobre la pantalla:

```tsx
  return <>
    <DiaryWriteError />
    <NutritionScreen … />
  </>;
```

Si `NutritionScreen` ocupa toda la altura con `Screen` y el aviso queda tapado, pasar en su lugar `<DiaryWriteError />` como prop `notice?: ReactNode` de `NutritionScreen` y renderizarlo arriba del selector de fecha (línea donde se renderiza `DiaryDateSelector`).

- [ ] **Step 5: Verificar**

Run: `npm run check`
Expected: PASS. Si `diaryReducer` sigue probando `add`/`update`/`delete-meal`, esas pruebas quedan: el reducer se conserva para la vista previa.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/features/nutrition "frontend/src/app/food-entry.tsx" frontend/src/app/barcode.tsx frontend/src/app/food-photo.tsx "frontend/src/app/(tabs)/nutrition.tsx"
git commit -m "feat(app): food diary saves to Supabase with retry (SY-04)"
```

---

### Task 5: Metas, minuta y pesajes en pantalla

**Files:**
- Modify: `frontend/src/features/profile/useProfile.ts` (componer `nutritionPlan` y `mealPlan`)
- Modify: `frontend/src/features/profile/domain/profile.ts` (quitar `set-nutrition-plan`, `set-meal-plan`)
- Modify: `frontend/src/features/progress/useProgress.ts` (componer `weights`)
- Modify: `frontend/src/features/nutrition/MealPlanScreen.tsx:20-21,35,57-63` (`onSwap`)
- Modify: `frontend/src/app/nutrition-goals.tsx`, `frontend/src/app/meal-plan.tsx`, `frontend/src/app/(tabs)/progress.tsx`

**Interfaces:**
- Consumes: hooks de la Task 4; `goalPerson` (`features/nutrition/domain/goals.ts`); `weekStart` (`shared/calendar.ts`); `parseWeight` (`features/progress/domain/progress.ts`).

- [ ] **Step 1: Composición**

`features/profile/useProfile.ts`, dentro del `useMemo` de `useProfile`, sumar a lo que ya sobrepone SY-03:

```ts
      ...(nutrition.isSuccess ? { nutritionPlan: nutrition.data } : {}),
      ...(meals.isSuccess ? { mealPlan: meals.data } : {}),
```

con `const nutrition = useNutritionPlan(); const meals = useMealPlan();` (import de `../nutrition/useNutrition`) y sus dependencias en el arreglo del `useMemo` (`nutrition.isSuccess, nutrition.data, meals.isSuccess, meals.data`). Actualizar el comentario del store: "Metas nutricionales y minuta vienen de Supabase (SY-04)".

`features/progress/useProgress.ts`, `useProgressStore`:

```ts
  const history = useTrainingHistory();
  const weights = useWeights();
  return useMemo(() => {
    if (empty) return local;
    return { ...local,
      ...(history.isSuccess ? { workouts: history.data.workouts } : {}),
      ...(weights.isSuccess ? { weights: weights.data } : {}) };
  }, [empty, local, history.isSuccess, history.data, weights.isSuccess, weights.data]);
```

con `import { useWeights } from '../nutrition/useNutrition';`.

`features/profile/domain/profile.ts`: borrar `set-nutrition-plan` y `set-meal-plan` de `ProfileAction` y del reducer. Run `grep -rn "set-nutrition-plan\|set-meal-plan" frontend/src` y borrar las pruebas que los usen (el comportamiento lo cubre la integración de la Task 3).

- [ ] **Step 2: Metas nutricionales**

`app/nutrition-goals.tsx`:

```tsx
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { NutritionGoalsScreen } from '../features/nutrition/NutritionGoalsScreen';
import { goalPerson } from '../features/nutrition/domain/goals';
import { useSaveNutritionTargets } from '../features/nutrition/useNutrition';
import { useProfile } from '../features/profile/useProfile';
import { dataErrorMessage, toDataError } from '../lib/data/errors';

export default function NutritionGoalsRoute() {
  const router = useRouter();
  const { profile } = useProfile();
  const save = useSaveNutritionTargets();
  const [error, setError] = useState<string | null>(null);
  return <NutritionGoalsScreen profile={profile} error={error} saving={save.isPending} onEditProfile={() => router.navigate('/profile')}
    onSave={(settings, result) => {
      const person = goalPerson(profile);
      if (!person.ok) return;
      const { healthRisk: _risk, ...data } = person.person;
      setError(null);
      save.mutate({ person: data, settings, result }, {
        onSuccess: () => router.back(),
        onError: (failure) => setError(dataErrorMessage(toDataError(failure))),
      });
    }} />;
}
```

`features/nutrition/NutritionGoalsScreen.tsx`: `Props` agrega `error?: string | null; saving?: boolean`; el botón de la línea 101 queda

```tsx
    {!!error && <AppText accessibilityRole="alert" variant="caption">{error}</AppText>}
    <AppButton label={saving ? 'Guardando…' : 'Guardar meta'} icon="checkmark-outline" disabled={saving} onPress={() => onSave(settings, result)} />
```

- [ ] **Step 3: Minuta**

`features/nutrition/MealPlanScreen.tsx`:
- `Props` (línea 21) agrega `onSwap: (plan: SavedMealPlan) => void;` y la función lo recibe.
- En `choose` (línea 61): `if (proposal) setProposal(next); else onSwap(next);`

`app/meal-plan.tsx`:

```tsx
import { useRouter } from 'expo-router';
import { MealPlanScreen } from '../features/nutrition/MealPlanScreen';
import { todayDateKey } from '../features/nutrition/domain/diary';
import { mealEntry, weekdayIndex } from '../features/nutrition/domain/meal-plan';
import { useDiaryWrite, useSaveMealPlan, useSwapMeals } from '../features/nutrition/useNutrition';
import { useNutritionDiary } from '../features/nutrition/useNutritionDiary';
import { useProfile } from '../features/profile/useProfile';
import { readMealPlan } from '@strongerfit/nutrition-engine';
import { weekStart } from '../shared/calendar';

export default function MealPlanRoute() {
  const router = useRouter();
  const { profile } = useProfile();
  const diary = useNutritionDiary();
  const save = useSaveMealPlan();
  const swap = useSwapMeals();
  const write = useDiaryWrite();
  const today = todayDateKey();
  const targetId = profile.nutritionPlan?.id;
  const current = profile.mealPlan;
  return <MealPlanScreen profile={profile} targets={diary.targets} todayIndex={weekdayIndex(today)}
    onSave={(plan) => { if (targetId) save.mutate({ plan: readMealPlan(plan), nutritionTargetId: targetId, weekStart: weekStart(today) }); }}
    onSwap={(plan) => { if (current?.id) swap.mutate({ planId: current.id, before: readMealPlan(current), after: readMealPlan(plan) }); }}
    onRegister={(day, slot) => {
      const meal = profile.mealPlan?.days[day]?.meals.find((item) => item.meal === slot);
      if (meal) write.mutate({ kind: 'add', date: today, entry: mealEntry(meal) });
    }}
    onGoals={() => router.push('/nutrition-goals')} onProfile={() => router.navigate('/profile')} />;
}
```

(Sin meta guardada `targetId` es `undefined` y `MealPlanScreen` ya muestra "Primero, tu meta" porque `diary.targets` es `null`.)

- [ ] **Step 4: Pesajes**

`app/(tabs)/progress.tsx`: con `const record = useRecordWeight();` (import de `../../features/nutrition/useNutrition`) y `parseWeight` de `../../features/progress/domain/progress`, pasar a `ProgressScreen`:

```tsx
    dispatch={(action) => {
      if (action.type !== 'record-weight') return progress.dispatch(action);
      const kg = parseWeight(action.value);
      if (kg !== null) record.mutate({ date: action.date, kg });
    }}
```

- [ ] **Step 5: Verificar**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/features "frontend/src/app/nutrition-goals.tsx" "frontend/src/app/meal-plan.tsx" "frontend/src/app/(tabs)/progress.tsx"
git commit -m "feat(app): nutrition goals, meal plan and weights save to Supabase (SY-04)"
```

---

### Task 6: Modo vista previa explícito

**Files:**
- Create: `frontend/src/features/dev/previewMode.ts`
- Modify: `frontend/src/features/profile/useProfile.ts`, `frontend/src/features/progress/useProgress.ts`, `frontend/src/features/nutrition/useNutritionDiary.ts`
- Modify: `frontend/src/app/dev-status.tsx`, `frontend/src/app/(tabs)/index.tsx`, `(tabs)/progress.tsx`, `(tabs)/nutrition.tsx`, `(tabs)/profile.tsx`

**Interfaces:**
- Produces: `usePreviewMode(): boolean`, `setPreviewMode(enabled: boolean): void`.

- [ ] **Step 1: Store del modo**

```ts
import { createStore, useStore } from 'zustand';

// Datos de ejemplo solo en desarrollo y solo si se activan en Conexión de desarrollo (SY-04).
// No se guarda: al reiniciar la app vuelve a datos reales.
const previewStore = createStore<{ enabled: boolean }>()(() => ({ enabled: false }));

export const usePreviewMode = () => useStore(previewStore, (state) => __DEV__ && state.enabled);
export const setPreviewMode = (enabled: boolean) => previewStore.setState({ enabled });
```

(Si `createStore` de `zustand` no exporta `useStore` desde el mismo módulo, importar `createStore` de `zustand/vanilla` y `useStore` de `zustand`, como en `features/profile/useProfile.ts`.)

- [ ] **Step 2: Stores parten vacíos; la vista previa es explícita**

- `features/profile/useProfile.ts`: `createProfileStore(createEmptyProfile())`; en `useProfile`, `const preview = usePreviewMode();` y al inicio del `useMemo`: `if (preview) return previewProfile;` con `const previewProfile = createProfilePreview();` a nivel de módulo; sumar `preview` a las dependencias.
- `features/progress/useProgress.ts`: `createProgressStore(createEmptyProgress())`; en `useProgressStore`, `const preview = usePreviewMode();` y en el `useMemo`: `if (preview) return { ...local, ...previewProgress };` con `const previewProgress = createProgressPreview();` a nivel de módulo.
- `features/nutrition/useNutritionDiary.ts`: `createDiaryStore(createEmptyDiary())`; en el `useMemo`: `if (preview) return { ...local, entries: previewDiary.entries, targets: previewDiary.targets };` con `const previewDiary = createPreviewDiary();`.
- Quitar las líneas `__DEV__ ? create…Preview() : …` y su comentario de "en desarrollo parten con datos de ejemplo".

- [ ] **Step 3: Banderas `isPreview`**

En `app/(tabs)/index.tsx`, `(tabs)/progress.tsx`, `(tabs)/nutrition.tsx` y `(tabs)/profile.tsx`: `const preview = usePreviewMode();` y reemplazar `isPreview={__DEV__ && !empty}` / `isPreview={__DEV__}` / la variable `isPreview` de perfil por `preview && !empty` (en perfil, `preview`).

- [ ] **Step 4: Interruptor en Conexión de desarrollo**

`app/dev-status.tsx`, antes del texto final:

```tsx
      <Pressable accessibilityRole="switch" accessibilityState={{ checked: preview }} onPress={() => setPreviewMode(!preview)}
        className="mt-8 min-h-12 items-center justify-center rounded-xl border border-brand px-6 py-4 active:opacity-80">
        <Text className="text-base font-semibold text-brand">{preview ? 'Ocultar datos de ejemplo' : 'Mostrar datos de ejemplo'}</Text>
      </Pressable>
```

con `const preview = usePreviewMode();` (import de `../features/dev/previewMode`).

- [ ] **Step 5: Verificar**

Run: `npm run check`
Expected: PASS. Si alguna prueba de pantalla asumía datos de ejemplo por `__DEV__`, pasarle `isPreview` explícito.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/features "frontend/src/app"
git commit -m "feat(app): sample data only in explicit preview mode (SY-04)"
```

---

### Task 7: Verificación final y prueba manual (H-2)

- [ ] **Step 1:** `npm run check && npm run db:test && npm run test:integration` → todo PASS.
- [ ] **Step 2: Prueba manual en el teléfono (Expo Go contra la nube):**
  1. Calcular y guardar la meta → reabrir la app: la meta sigue en Alimentación.
  2. Registrar un alimento con acompañamiento, editarlo y borrar la comida → reabrir: el diario coincide.
  3. Generar y guardar la minuta, intercambiar un alimento → reabrir: el intercambio sigue.
  4. Registrar el peso de hoy dos veces → Progreso muestra un solo pesaje con el último valor.
  5. Con modo avión, registrar un alimento → Alimentación muestra "No pudimos guardar…"; sin modo avión, Reintentar lo guarda.
  6. Inicio y Progreso no muestran datos de ejemplo; en Conexión de desarrollo, "Mostrar datos de ejemplo" los muestra y "Ocultar" vuelve a los reales.
  7. Criterio H-2: cerrar sesión e iniciarla otra vez conserva todo; otra cuenta en el mismo teléfono no ve nada de la anterior.
- [ ] **Step 3:** `git status --short` limpio.
