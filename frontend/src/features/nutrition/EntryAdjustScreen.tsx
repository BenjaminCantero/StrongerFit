import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Screen } from '../../components/Screen';
import { AppButton } from '../../components/ui/AppButton';
import { AppPressable } from '../../components/ui/AppPressable';
import { AppText } from '../../components/ui/AppText';
import { Card } from '../../components/ui/Card';
import { colors, layout, radius, spacing } from '../../theme';
import { MealSelector } from './components/MealSelector';
import { clampItemGrams, MAX_ITEM_GRAMS, MIN_ITEM_GRAMS, rescaleEntry, sourceLabel } from './domain/entry-adjust';
import type { FoodEntry } from './domain/food-entry';
import { formatGrams, formatKcal, formatMacro, mealLabels } from './presentation';

type Props = { entry: FoodEntry; onSave: (entry: FoodEntry) => void; onExit: () => void };

// Edición de registros de código de barras o foto: gramos por ítem y comida.
export function EntryAdjustScreen({ entry, onSave, onExit }: Props) {
  const [grams, setGrams] = useState(() => entry.items.map((item) => item.grams));
  const [meal, setMeal] = useState(entry.meal);
  const next = rescaleEntry(entry, grams, meal);
  const changed = !!next && (meal !== entry.meal || grams.some((value, index) => value !== entry.items[index]!.grams));

  const adjust = (index: number, delta: number) =>
    setGrams((current) => current.map((value, position) => position === index ? clampItemGrams(value + delta) : value));

  return <View style={styles.screen}>
    <Screen>
      <View style={styles.heading}>
        <AppText variant="title" accessibilityRole="header">Ajustar registro</AppText>
        <AppText tone="muted">Cambia la cantidad o la comida. Las calorías se recalculan con los valores que tenía el registro.</AppText>
      </View>

      {entry.items.map((item, index) => {
        const scaled = next?.items[index]?.nutrients;
        return <Card key={`${item.foodId}-${index}`} tone="low" style={styles.item}>
          <View style={styles.itemTop}>
            <View style={styles.flex}>
              <AppText variant="caption" tone="brand">{sourceLabel(item.foodId)}</AppText>
              <AppText variant="strong">{item.name}</AppText>
              {scaled && <AppText variant="caption" tone="muted">
                {formatKcal(scaled.kcal)} kcal · P {formatMacro(scaled.protein)} g · C {formatMacro(scaled.carbs)} g · G {formatMacro(scaled.fat)} g
              </AppText>}
            </View>
          </View>
          <View style={styles.stepper}>
            <Step icon="remove" label={`Restar 10 g a ${item.name}`} disabled={grams[index]! <= MIN_ITEM_GRAMS} onPress={() => adjust(index, -10)} />
            <AppText variant="heading" style={styles.grams} accessibilityLiveRegion="polite">{formatGrams(grams[index]!)} g</AppText>
            <Step icon="add" label={`Sumar 10 g a ${item.name}`} disabled={grams[index]! >= MAX_ITEM_GRAMS} onPress={() => adjust(index, 10)} />
          </View>
        </Card>;
      })}

      <View style={styles.section}>
        <AppText variant="header">Comida</AppText>
        <MealSelector selected={meal} onSelect={setMeal} />
      </View>

      {next && <Card style={styles.total}>
        <AppText variant="label" tone="muted">Total del registro</AppText>
        <AppText variant="metric">{formatKcal(next.nutrients.kcal)} kcal</AppText>
      </Card>}
    </Screen>

    <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.footer}>
      <View style={styles.footerContent}>
        <AppButton label={`Guardar en ${mealLabels[meal]}`} icon="checkmark-circle-outline" disabled={!changed}
          onPress={() => { if (next) onSave(next); }} style={styles.confirm} />
        <AppButton label="Cancelar" variant="ghost" onPress={onExit} />
      </View>
    </SafeAreaView>
  </View>;
}

function Step({ icon, label, disabled, onPress }: { icon: 'add' | 'remove'; label: string; disabled: boolean; onPress: () => void }) {
  return <AppPressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.step, (pressed || disabled) && styles.pressed]}>
    <Ionicons name={icon} size={20} color={colors.brandStrong} />
  </AppPressable>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  heading: { gap: spacing.xs },
  item: { padding: spacing.lg, gap: spacing.md },
  itemTop: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1, gap: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  step: { width: layout.touchTarget, height: layout.touchTarget, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  grams: { flex: 1, textAlign: 'center', fontVariant: ['tabular-nums'] },
  section: { gap: spacing.sm },
  total: { gap: spacing.xs },
  footer: { backgroundColor: colors.canvas, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.surfaceHigh },
  footerContent: { width: '100%', maxWidth: layout.contentWidth, alignSelf: 'center', padding: spacing.lg, gap: spacing.xs },
  confirm: { backgroundColor: colors.brandStrong },
  pressed: { opacity: 0.5 },
});
