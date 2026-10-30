import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { AppButton } from '../../../components/ui/AppButton';
import { AppText } from '../../../components/ui/AppText';
import { Card } from '../../../components/ui/Card';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { colors, radius, spacing } from '../../../theme';
import type { HomeOverview, MacroSummary } from '../home.types';

const number = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });
const macroColors = { protein: colors.brand, carbs: colors.goldBar, fat: colors.muted };

function Macro({ macro }: { macro: MacroSummary }) {
  return (
    <View style={styles.macro}>
      <View style={styles.macroLabel}>
        <AppText variant="label" tone="muted" style={styles.macroName}>{macro.name}</AppText>
        <View style={[styles.dot, { backgroundColor: macroColors[macro.kind] }]} />
      </View>
      <AppText variant="strong">
        {number.format(macro.consumed)}<AppText variant="caption" tone="muted"> / {number.format(macro.target)} g</AppText>
      </AppText>
      <ProgressBar value={macro.consumed} target={macro.target} label={`${macro.name} en gramos`} color={macroColors[macro.kind]} />
    </View>
  );
}

export function NutritionSummary({ nutrition, onPress }: { nutrition: HomeOverview['nutrition']; onPress: () => void }) {
  if (!nutrition) {
    return (
      <Card tone="low">
        <AppText variant="heading" accessibilityRole="header">Energía diaria</AppText>
        <AppText tone="muted">Aquí verás tus comidas registradas y tu meta nutricional estimada.</AppText>
        <AppButton label="Explorar alimentación" icon="add-outline" variant="secondary" onPress={onPress} />
      </Card>
    );
  }

  const { consumedKcal, targetKcal } = nutrition;
  const percent = targetKcal > 0 ? Math.round(consumedKcal / targetKcal * 100) : null;
  const remaining = targetKcal - consumedKcal;

  return (
    <Card tone="low">
      <View style={styles.top}>
        <View style={styles.heading}>
          <AppText variant="heading" accessibilityRole="header">Energía diaria</AppText>
          <AppText variant="caption" tone="muted">Cálculo estimado referencial</AppText>
        </View>
        {percent !== null && <View style={styles.badge}>
          <Ionicons name="leaf-outline" size={12} color={colors.brand} />
          <AppText variant="label" tone="brand">{percent}% meta</AppText>
        </View>}
      </View>
      <View style={styles.energy}>
        <View style={styles.energyNumbers}>
          <AppText variant="metric">{number.format(consumedKcal)}<AppText variant="caption" tone="muted"> / {number.format(targetKcal)} kcal</AppText></AppText>
          <AppText variant="label" tone="brand">
            {remaining >= 0 ? `Quedan ${number.format(remaining)} kcal` : `${number.format(Math.abs(remaining))} kcal sobre la meta`}
          </AppText>
        </View>
        <ProgressBar value={consumedKcal} target={targetKcal} label="Energía consumida en kcal" />
        <View style={styles.legend}>
          <AppText variant="caption" tone="muted">Consumido hoy</AppText>
          <AppText variant="caption" tone="muted">Meta estimada</AppText>
        </View>
      </View>
      <View style={styles.macros}>{nutrition.macros.map((macro) => <Macro key={macro.kind} macro={macro} />)}</View>
      <AppButton label="Registrar comida" icon="add-outline" variant="secondary" onPress={onPress} />
    </Card>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm, justifyContent: 'space-between' },
  heading: { flexShrink: 1 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.brandSoft, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  energy: { padding: spacing.lg, backgroundColor: colors.white, borderRadius: radius.lg, gap: spacing.md },
  energyNumbers: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.xs },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.xs },
  macros: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  macro: { flex: 1, minWidth: 80, padding: spacing.md, gap: spacing.xs, backgroundColor: colors.white, borderRadius: radius.lg },
  macroLabel: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 2 },
  macroName: { flexShrink: 1, fontSize: 11 },
  dot: { width: 6, height: 6, borderRadius: radius.pill },
});
