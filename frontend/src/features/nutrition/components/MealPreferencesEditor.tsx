import Ionicons from '@expo/vector-icons/Ionicons';
import { foodCatalog, mealLayouts, MEALS_PER_DAY, type MealPreferences, type MealsPerDay } from '@strongerfit/nutrition-engine';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppPressable } from '../../../components/ui/AppPressable';
import { AppText } from '../../../components/ui/AppText';
import { ChoiceChips } from '../../../components/ui/ChoiceChips';
import { FormField } from '../../../components/ui/FormField';
import { colors, layout, radius, spacing } from '../../../theme';
import { MAX_FOOD_PREFERENCES, toggleFoodPreference } from '../../profile/domain/profile';
import { preferenceOptions, roleLabels } from '../domain/meal-plan';
import { planMealLabels } from '../presentation';

const countLabels = Object.fromEntries(MEALS_PER_DAY.map((count) => [String(count), String(count)])) as Record<`${MealsPerDay}`, string>;
const foodName = (id: string) => foodCatalog.find((food) => food.id === id)?.name ?? id;
const mealsSummary = (count: MealsPerDay) => mealLayouts[count].map(({ meal }) => planMealLabels[meal]).join(', ');

type Props = { value: MealPreferences; onChange: (value: MealPreferences) => void; exclusions: string[]; dietFocus: string };

// Comidas al día y alimentos preferidos o no deseados, elegidos del catálogo (no texto libre).
export function MealPreferencesEditor({ value, onChange, exclusions, dietFocus }: Props) {
  const [query, setQuery] = useState('');
  const options = preferenceOptions(query, exclusions, dietFocus);
  const toggle = (list: 'preferred' | 'disliked', id: string) => onChange(toggleFoodPreference(value, list, id));

  return <View style={styles.editor}>
    <ChoiceChips<`${MealsPerDay}`> label="¿Cuántas veces comes al día?" options={countLabels} value={`${value.mealsPerDay}`}
      onChange={(count) => onChange({ ...value, mealsPerDay: Number(count) as MealsPerDay })} />
    <AppText variant="caption" tone="muted">{mealsSummary(value.mealsPerDay)}.</AppText>

    <View style={styles.group}>
      <FormField label="Alimentos que prefieres o no te gustan" value={query} onChange={setQuery} placeholder="Busca en el catálogo, ej: pollo"
        hint="Escribe para buscar y marca cada alimento." autoCorrect={false} maxLength={40} />
      <AppText variant="caption" tone="muted">
        Usamos primero tus preferidos, sin repetirlos todos los días. Evitamos lo que no te gusta salvo que tus exclusiones no dejen otra opción, y te avisamos.
      </AppText>
      {!!query.trim() && !options.length && <AppText variant="caption" tone="muted">No encontramos alimentos con ese nombre.</AppText>}
      {options.map(({ food, excluded }) => <View key={food.id} style={styles.result}>
        <View style={styles.resultText}>
          <AppText variant="label">{food.name}</AppText>
          <AppText variant="caption" tone="muted">{excluded ? 'Bloqueado por tus exclusiones' : roleLabels[food.role]}</AppText>
        </View>
        <View style={styles.resultActions}>
          {/* Un alimento excluido nunca entra en la minuta: marcarlo no cambiaría nada. */}
          {!excluded && <>
            <Toggle icon="heart-outline" label="Me gusta" name={food.name} checked={value.preferred.includes(food.id)}
              disabled={!value.preferred.includes(food.id) && value.preferred.length >= MAX_FOOD_PREFERENCES} onPress={() => toggle('preferred', food.id)} />
            <Toggle icon="close-circle-outline" label="No me gusta" name={food.name} checked={value.disliked.includes(food.id)}
              disabled={!value.disliked.includes(food.id) && value.disliked.length >= MAX_FOOD_PREFERENCES} onPress={() => toggle('disliked', food.id)} />
          </>}
        </View>
      </View>)}
    </View>

    <Selected title="Preferidos" empty="Aún no marcas preferidos." ids={value.preferred} onRemove={(id) => toggle('preferred', id)} />
    <Selected title="No te gustan" empty="Sin alimentos marcados." ids={value.disliked} onRemove={(id) => toggle('disliked', id)} />
  </View>;
}

function Toggle({ icon, label, name, checked, disabled, onPress }: {
  icon: 'heart-outline' | 'close-circle-outline'; label: string; name: string; checked: boolean; disabled: boolean; onPress: () => void;
}) {
  return <AppPressable accessibilityRole="checkbox" accessibilityState={{ checked, disabled }} aria-checked={checked} disabled={disabled}
    accessibilityLabel={`${label}: ${name}`} onPress={onPress}
    style={({ pressed }) => [styles.toggle, checked && styles.toggleOn, disabled && styles.disabled, pressed && styles.pressed]}>
    <Ionicons name={checked ? (icon === 'heart-outline' ? 'heart' : 'close-circle') : icon} size={16} color={checked ? colors.white : colors.brandText} />
    <AppText variant="caption" tone={checked ? 'white' : 'brand'}>{label}</AppText>
  </AppPressable>;
}

function Selected({ title, empty, ids, onRemove }: { title: string; empty: string; ids: string[]; onRemove: (id: string) => void }) {
  return <View style={styles.group}>
    <AppText variant="label" tone="muted">{title} ({ids.length}/{MAX_FOOD_PREFERENCES})</AppText>
    {ids.length ? <View style={styles.chips}>
      {ids.map((id) => <AppPressable key={id} accessibilityRole="button" accessibilityLabel={`Quitar ${foodName(id)} de ${title.toLowerCase()}`}
        onPress={() => onRemove(id)} style={({ pressed }) => [styles.chip, pressed && styles.pressed]}>
        <AppText variant="caption" style={styles.chipText}>{foodName(id)}</AppText>
        <Ionicons name="close" size={14} color={colors.muted} />
      </AppPressable>)}
    </View> : <AppText variant="caption" tone="muted">{empty}</AppText>}
  </View>;
}

const styles = StyleSheet.create({
  editor: { gap: spacing.md },
  group: { gap: spacing.sm },
  result: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.sm, backgroundColor: colors.surfaceLow },
  resultText: { flexGrow: 1, flexBasis: 160, gap: 2 },
  resultActions: { flexDirection: 'row', gap: spacing.xs },
  toggle: { minHeight: layout.touchTarget, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md,
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.brandMedium, backgroundColor: colors.white },
  toggleOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  disabled: { opacity: 0.4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: { minHeight: layout.touchTarget, maxWidth: '100%', flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md,
    borderRadius: radius.pill, backgroundColor: colors.brandSoft },
  chipText: { flexShrink: 1 },
  pressed: { opacity: 0.6 },
});
