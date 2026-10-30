import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { colors, radius, spacing } from '../../../theme';
import type { MealId, Nutrients } from '../domain/food-entry';
import { formatKcal, formatMacro, mealLabels } from '../presentation';

const macros: { key: 'protein' | 'carbs' | 'fat'; label: string; factor: number; icon: ComponentProps<typeof Ionicons>['name']; color: string; background: string }[] = [
  { key: 'protein', label: 'Proteínas', factor: 4, icon: 'barbell-outline', color: colors.brand, background: colors.brandSoft },
  { key: 'carbs', label: 'Carbohidratos', factor: 4, icon: 'leaf-outline', color: colors.gold, background: colors.goldSoft },
  { key: 'fat', label: 'Grasas', factor: 9, icon: 'water-outline', color: colors.muted, background: colors.sand },
];

export function NutrientBreakdown({ nutrients, meal }: { nutrients: Nutrients; meal: MealId }) {
  const { width, fontScale } = useWindowDimensions();
  const stacked = width < 360 || fontScale > 1.2;
  const macroEnergy = nutrients.protein * 4 + nutrients.carbs * 4 + nutrients.fat * 9;
  return (
    <View style={styles.section}>
      <AppText variant="header" accessibilityRole="header">Desglose nutricional estimado</AppText>
      <View style={styles.energy}>
        <View style={styles.energyIcon}><Ionicons name="flame-outline" size={23} color={colors.white} /></View>
        <View style={styles.energyDescription}>
          <AppText variant="label" tone="muted">Aporte energético</AppText>
          <AppText variant="caption">Total para {mealLabels[meal]}</AppText>
        </View>
        <View style={styles.energyValue}>
          <AppText variant="metric">{formatKcal(nutrients.kcal)}</AppText>
          <AppText variant="label" tone="brand">kcal estimadas</AppText>
        </View>
      </View>
      <View style={[styles.macros, stacked && styles.stacked]}>
        {macros.map((macro) => (
          <View key={macro.key} style={[styles.macro, stacked && styles.stackedMacro]}>
            <AppText variant="label" style={[styles.macroTitle, { color: macro.color }]}>{macro.label}</AppText>
            <View style={[styles.macroIcon, { backgroundColor: macro.background }]}><Ionicons name={macro.icon} size={18} color={macro.color} /></View>
            <AppText variant="heading">{formatMacro(nutrients[macro.key])}</AppText>
            <AppText variant="caption" tone="muted">gramos</AppText>
            <View style={styles.bar}><ProgressBar value={Math.round(nutrients[macro.key] * macro.factor)} target={Math.round(macroEnergy)} color={macro.color} label={`Aporte de ${macro.label.toLowerCase()} a la energía de los macros`} /></View>
          </View>
        ))}
      </View>
      <AppText variant="caption" tone="muted">Las barras comparan la energía de los macros con la convención 4/4/9 kcal por gramo.</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  energy: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.md, padding: spacing.lg, backgroundColor: colors.brandSoft, borderRadius: radius.md },
  energyIcon: { width: 40, height: 40, backgroundColor: colors.brand, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  energyDescription: { flex: 1, minWidth: 100 },
  energyValue: { alignItems: 'flex-end' },
  macros: { flexDirection: 'row', gap: spacing.sm },
  stacked: { flexDirection: 'column' },
  stackedMacro: { flex: 0 },
  macro: { flex: 1, minWidth: 0, alignItems: 'center', backgroundColor: colors.surfaceLow, padding: spacing.sm, borderRadius: radius.md, gap: spacing.xs },
  macroTitle: { minHeight: 36, textAlign: 'center', fontSize: 11 },
  macroIcon: { width: 32, height: 32, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  bar: { width: '100%', marginTop: spacing.xs },
});
