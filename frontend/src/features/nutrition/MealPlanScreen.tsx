import Ionicons from '@expo/vector-icons/Ionicons';
import { applySwap, swapOptions, withinTolerance, type MealSlot, type PlanItem } from '@strongerfit/nutrition-engine';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { AppButton } from '../../components/ui/AppButton';
import { AppDialog } from '../../components/ui/AppDialog';
import { AppPressable } from '../../components/ui/AppPressable';
import { AppText } from '../../components/ui/AppText';
import { Card } from '../../components/ui/Card';
import { colors, layout, radius, spacing } from '../../theme';
import type { ProfileData, SavedMealPlan } from '../profile/domain/profile';
import { PlannedMealCard } from './components/PlannedMealCard';
import type { Nutrients } from './domain/food-entry';
import { hasHealthRisk, proposeMealPlan, roleLabels, tagLabels, weekDays } from './domain/meal-plan';
import { formatKcal, mealLabels } from './presentation';

type Props = {
  profile: ProfileData; targets: Nutrients | null; todayIndex: number;
  onSave: (plan: SavedMealPlan) => void; onRegister: (day: number, meal: MealSlot) => void;
  onGoals: () => void; onProfile: () => void;
};
type Blocked = { meal: MealSlot; role: keyof typeof roleLabels }[];

const signed = (value: number, unit: string) => `${value > 0 ? '+' : value < 0 ? '−' : '±'}${formatKcal(Math.abs(value))} ${unit}`;

export function MealPlanScreen({ profile, targets, todayIndex, onSave, onRegister, onGoals, onProfile }: Props) {
  const [proposal, setProposal] = useState<SavedMealPlan | null>(null);
  const [blocked, setBlocked] = useState<Blocked | null>(null);
  const [day, setDay] = useState(todayIndex);
  const [swapping, setSwapping] = useState<{ meal: MealSlot; index: number } | null>(null);
  const [notice, setNotice] = useState('');
  const plan = proposal ?? profile.mealPlan;

  if (!targets) return <Screen>
    <Card tone="low">
      <AppText variant="heading" accessibilityRole="header">Primero, tu meta</AppText>
      <AppText tone="muted">La minuta se arma con tu meta de energía y macronutrientes. Calcúlala y vuelve aquí.</AppText>
      <AppButton label="Calcular mi meta" icon="calculator-outline" onPress={onGoals} />
    </Card>
  </Screen>;

  function generate() {
    const result = proposeMealPlan(profile, targets!, new Date());
    setNotice('');
    if (result.ok) { setProposal(result.plan); setBlocked(null); } else { setBlocked(result.blocked); setProposal(null); }
  }

  function choose(replacement: PlanItem) {
    if (!plan || !swapping) return;
    const next = applySwap(plan, day, swapping.meal, swapping.index, replacement) as SavedMealPlan;
    // En la minuta guardada, elegir una opción es la confirmación del intercambio.
    if (proposal) setProposal(next); else onSave(next);
    setNotice(`Cambiado por ${replacement.name}.`);
    setSwapping(null);
  }

  const restrictions = plan?.restrictions;
  const current = plan?.days[day];
  const swap = plan && swapping ? swapOptions(plan, day, swapping.meal, swapping.index) : [];
  const swapped = current && swapping ? current.meals.find((meal) => meal.meal === swapping.meal)?.items[swapping.index] : undefined;

  return <Screen>
    <Card tone="low">
      <View style={styles.headerTop}>
        <View style={styles.headerText}>
          <AppText variant="heading" accessibilityRole="header">Minuta semanal</AppText>
          <AppText variant="caption" tone="muted">Meta: {formatKcal(targets.kcal)} kcal · {formatKcal(targets.protein)} g proteína · tolerancia ±10 %</AppText>
        </View>
        <Ionicons name="calendar-outline" size={26} color={colors.brand} />
      </View>
      {restrictions && (restrictions.tags.length > 0 || restrictions.names.length > 0) && <View style={styles.tags}>
        {restrictions.tags.map((tag) => <View key={tag} style={styles.tag}><AppText variant="caption">{tagLabels[tag]}</AppText></View>)}
        {restrictions.names.map((name) => <View key={name} style={styles.tag}><AppText variant="caption">Sin {name}</AppText></View>)}
      </View>}
      {!!restrictions?.unmatched.length && <AppText variant="caption" style={styles.warning}>
        No reconocimos «{restrictions.unmatched.join('», «')}» en el catálogo. Revisa la minuta antes de seguirla.
      </AppText>}
      {hasHealthRisk(profile) && <AppText variant="caption" tone="muted">Según tu cuestionario, la meta no aplica déficit. Para un plan alimentario, consulta a un profesional de nutrición.</AppText>}
      {!plan && !blocked && <AppText tone="muted">Combinamos alimentos y porciones del catálogo según tu meta, tus exclusiones y tu enfoque alimentario. Podrás cambiar cada alimento.</AppText>}
      {proposal ? <View style={styles.actions}>
        <AppText variant="label" tone="brand">Propuesta sin guardar</AppText>
        <AppButton label="Guardar minuta" icon="checkmark-outline" onPress={() => { onSave(proposal); setProposal(null); setNotice('Minuta guardada.'); }} />
        <AppButton label="Descartar" variant="secondary" onPress={() => { setProposal(null); setNotice(''); }} />
      </View> : <AppButton label={profile.mealPlan ? 'Generar nueva propuesta' : 'Generar minuta'} icon="sparkles-outline"
        variant={profile.mealPlan ? 'secondary' : 'primary'} onPress={generate} />}
      {!!notice && <AppText accessibilityLiveRegion="polite" variant="label" tone="brand">{notice}</AppText>}
    </Card>

    {blocked && <Card style={styles.blocked}>
      <AppText variant="header">No pudimos armar la minuta</AppText>
      <AppText tone="muted">Tus restricciones dejan sin opciones: {blocked.map((item) => `${roleLabels[item.role].toLowerCase()} en ${mealLabels[item.meal].toLowerCase()}`).join(', ')}. No ignoramos alergias ni exclusiones.</AppText>
      <AppButton label="Revisar exclusiones" variant="secondary" onPress={onProfile} />
    </Card>}

    {plan && current && <>
      <View role="tablist" style={styles.days}>
        {weekDays.map((name, index) => <AppPressable key={name} role="tab" accessibilityLabel={`${name}${index === todayIndex ? ', hoy' : ''}`}
          accessibilityState={{ selected: index === day }} aria-selected={index === day} onPress={() => setDay(index)}
          style={({ pressed }) => [styles.day, index === day && styles.daySelected, pressed && styles.pressed]}>
          <AppText variant="label" tone={index === day ? 'white' : 'muted'}>{name.slice(0, 2)}</AppText>
          {index === todayIndex && <View style={[styles.todayDot, index === day && styles.todayDotSelected]} />}
        </AppPressable>)}
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryTop}>
          <AppText variant="header">{weekDays[day]}</AppText>
          <View style={[styles.badge, !withinTolerance(plan, current) && styles.badgeOut]}>
            <Ionicons name={withinTolerance(plan, current) ? 'checkmark-circle-outline' : 'alert-circle-outline'} size={14}
              color={withinTolerance(plan, current) ? colors.brandText : colors.gold} />
            <AppText variant="label">{signed(Math.round(current.deviation * 100), '%')} de la meta</AppText>
          </View>
        </View>
        <View style={styles.macros}>
          {([['kcal', 'Energía', 'kcal'], ['protein', 'Proteínas', 'g'], ['carbs', 'Carbos', 'g'], ['fat', 'Grasas', 'g']] as const).map(([key, label, unit]) =>
            <View key={key} style={styles.macro}>
              <AppText variant="caption" tone="muted">{label}</AppText>
              <AppText variant="strong">{formatKcal(current.totals[key])}</AppText>
              <AppText variant="caption" tone="muted">/ {formatKcal(plan.targets[key])} {unit}</AppText>
            </View>)}
        </View>
      </View>

      {current.meals.map((meal) => <PlannedMealCard key={meal.meal} meal={meal} onSwap={(index) => setSwapping({ meal: meal.meal, index })}
        onRegister={proposal ? undefined : () => { onRegister(day, meal.meal); setNotice(`${mealLabels[meal.meal]} agregado al diario de hoy.`); }} />)}
      <AppText variant="caption" tone="muted">Propuesta orientativa con valores de referencia aproximados. No reemplaza la indicación de un profesional de nutrición.</AppText>
    </>}

    <AppDialog title={swapped ? `Cambiar ${swapped.name}` : 'Cambiar alimento'} visible={!!swapping} onClose={() => setSwapping(null)}>
      {swapped && <AppText variant="caption" tone="muted">Actual: {swapped.grams} g · {formatKcal(swapped.nutrients.kcal)} kcal. Opciones con energía similar que respetan tus restricciones.</AppText>}
      {swap.length ? swap.map(({ item, diff }) => <AppPressable key={item.foodId} accessibilityRole="button" onPress={() => choose(item)}
        accessibilityLabel={`${item.name}, ${item.grams} gramos, ${signed(diff.kcal, 'kilocalorías')}, ${signed(diff.protein, 'gramos de proteína')}`}
        style={({ pressed }) => [styles.option, pressed && styles.pressed]}>
        <View style={styles.optionText}>
          <AppText variant="label">{item.name}</AppText>
          <AppText variant="caption" tone="muted">{item.grams} g · {formatKcal(item.nutrients.kcal)} kcal</AppText>
        </View>
        <View style={styles.diff}>
          <AppText variant="caption">{signed(diff.kcal, 'kcal')}</AppText>
          <AppText variant="caption" tone="muted">{signed(diff.protein, 'g prot.')}</AppText>
        </View>
      </AppPressable>) : <AppText tone="muted">No hay alternativas compatibles para este alimento.</AppText>}
      <AppButton label="Cancelar" variant="secondary" onPress={() => setSwapping(null)} />
    </AppDialog>
  </Screen>;
}

const styles = StyleSheet.create({
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerText: { flex: 1, gap: spacing.xs },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tag: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: colors.brandSoft },
  warning: { color: colors.gold },
  actions: { gap: spacing.sm },
  blocked: { borderWidth: 1, borderColor: colors.goldBar },
  days: { flexDirection: 'row', gap: spacing.xs },
  day: { flex: 1, minHeight: layout.touchTarget, alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: radius.md, backgroundColor: colors.surfaceHigh },
  daySelected: { backgroundColor: colors.brand },
  todayDot: { width: 5, height: 5, borderRadius: radius.pill, backgroundColor: colors.brand },
  todayDotSelected: { backgroundColor: colors.white },
  summary: { gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.white },
  summaryTop: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  badge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.brandSoft },
  badgeOut: { backgroundColor: colors.goldSoft },
  macros: { flexDirection: 'row', gap: spacing.sm },
  macro: { flex: 1, minWidth: 0 },
  option: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: layout.touchTarget, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceLow },
  optionText: { flex: 1, gap: 2 },
  diff: { alignItems: 'flex-end' },
  pressed: { opacity: 0.6 },
});
