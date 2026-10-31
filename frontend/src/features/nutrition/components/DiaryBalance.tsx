import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import { Card } from '../../../components/ui/Card';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { colors, radius, spacing } from '../../../theme';
import type { Nutrients } from '../domain/food-entry';
import { formatKcal } from '../presentation';

const macros = [
  { key: 'protein', name: 'Proteínas', color: colors.brand },
  { key: 'carbs', name: 'Carbos', color: colors.gold },
  { key: 'fat', name: 'Grasas', color: colors.muted },
] as const;

export function DiaryBalance({ consumed, targets }: { consumed: Nutrients; targets: Nutrients | null }) {
  const { width, fontScale } = useWindowDimensions();
  const stacked = width < 360 || fontScale > 1.2;
  const percent = targets && targets.kcal > 0 ? Math.round(consumed.kcal / targets.kcal * 100) : null;
  const remaining = targets ? Math.round(targets.kcal) - Math.round(consumed.kcal) : null;
  return (
    <Card tone="low" style={styles.card}>
      <View>
        <AppText variant="heading" accessibilityRole="header">Balance diario</AppText>
        <AppText variant="caption" tone="muted">Estimación calculada desde tus registros</AppText>
      </View>
      <View style={styles.energy}>
        <View style={styles.energyNumbers}>
          <AppText variant="metric">{formatKcal(consumed.kcal)}<AppText variant="caption" tone="muted">{targets ? ` / ${formatKcal(targets.kcal)} kcal` : ' kcal'}</AppText></AppText>
          <AppText variant="label" tone="brand">{percent !== null ? `${percent}% de la meta` : 'Meta sin definir'}</AppText>
        </View>
        {targets && <ProgressBar value={consumed.kcal} target={targets.kcal} label="Energía diaria en kcal" />}
        <View style={styles.legend}>
          <AppText variant="caption" tone="muted">Consumidas: {formatKcal(consumed.kcal)} kcal</AppText>
          {remaining !== null && <AppText variant="caption" tone="muted">{remaining >= 0 ? 'Restantes' : 'Sobre la meta'}: {formatKcal(Math.abs(remaining))} kcal</AppText>}
        </View>
      </View>
      <View style={[styles.macros, stacked && styles.stacked]}>
        {macros.map(({ key, name, color }) => (
          <View key={key} style={[styles.macro, stacked && styles.stackedMacro]}>
            <View style={styles.macroTop}>
              <AppText variant="label" style={styles.macroName}>{name}</AppText>
              <View style={[styles.dot, { backgroundColor: color }]} />
            </View>
            <AppText variant="strong">{formatKcal(consumed[key])}<AppText variant="caption" tone="muted">{targets ? ` /\u00A0${formatKcal(targets[key])}\u00A0g` : '\u00A0g'}</AppText></AppText>
            {targets && <ProgressBar value={consumed[key]} target={targets[key]} label={`${name} diarios en gramos`} color={color} />}
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg },
  energy: { gap: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.canvas },
  energyNumbers: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.sm },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.xs },
  macros: { flexDirection: 'row', gap: spacing.sm },
  stacked: { flexDirection: 'column' },
  stackedMacro: { flex: 0 },
  macro: { flex: 1, minWidth: 0, padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.canvas, gap: spacing.sm },
  macroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs },
  macroName: { flexShrink: 1, fontSize: 11 },
  dot: { width: 6, height: 6, borderRadius: radius.pill },
});
