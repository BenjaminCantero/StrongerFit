import Ionicons from '@expo/vector-icons/Ionicons';
import type { PlannedMeal } from '@strongerfit/nutrition-engine';
import { StyleSheet, View } from 'react-native';
import { AppButton } from '../../../components/ui/AppButton';
import { AppPressable } from '../../../components/ui/AppPressable';
import { AppText } from '../../../components/ui/AppText';
import { Card } from '../../../components/ui/Card';
import { colors, layout, radius, spacing } from '../../../theme';
import { formatKcal, mealLabels } from '../presentation';

export function PlannedMealCard({ meal, onSwap, onRegister }: {
  meal: PlannedMeal; onSwap: (index: number) => void; onRegister?: () => void;
}) {
  return <Card tone="low" style={styles.card}>
    <View style={styles.top}>
      <AppText variant="header" accessibilityRole="header" style={styles.title}>{mealLabels[meal.meal]}</AppText>
      <AppText variant="label" tone="brand">{formatKcal(meal.nutrients.kcal)} kcal</AppText>
    </View>
    <View style={styles.items}>
      {meal.items.map((item, index) => <View key={`${item.foodId}-${index}`} style={[styles.item, index > 0 && styles.separated]}>
        <View style={styles.itemText}>
          <AppText variant="label">{item.name}</AppText>
          <AppText variant="caption" tone="muted">{item.grams} g · {formatKcal(item.nutrients.kcal)} kcal · {formatKcal(item.nutrients.protein)} g prot.</AppText>
        </View>
        <AppPressable accessibilityRole="button" accessibilityLabel={`Cambiar ${item.name}`} onPress={() => onSwap(index)}
          style={({ pressed }) => [styles.swap, pressed && styles.pressed]}>
          <Ionicons name="swap-horizontal" size={18} color={colors.brandText} />
          <AppText variant="label" tone="brand">Cambiar</AppText>
        </AppPressable>
      </View>)}
    </View>
    {onRegister && <AppButton label="Registrar en el diario de hoy" icon="add-outline" variant="secondary" onPress={onRegister} />}
  </Card>;
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  top: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  title: { flex: 1 },
  items: { backgroundColor: colors.white, borderRadius: radius.md, paddingHorizontal: spacing.md },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  separated: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  itemText: { flex: 1, gap: 2 },
  swap: { minHeight: layout.touchTarget, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.xs },
  pressed: { opacity: 0.6 },
});
