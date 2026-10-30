import { StyleSheet, View } from 'react-native';
import { AppPressable } from '../../../components/ui/AppPressable';
import { AppText } from '../../../components/ui/AppText';
import { colors, layout, radius, spacing } from '../../../theme';
import type { Period } from '../domain/progress';
import { periods } from '../presentation';

export function PeriodSelector({ selected, onSelect }: { selected: Period; onSelect: (period: Period) => void }) {
  return <View accessibilityLabel="Período de análisis" role="radiogroup" style={styles.group}>
    {periods.map(({ id, label }) => <AppPressable key={id} accessibilityRole="radio" accessibilityLabel={label}
      accessibilityState={{ checked: selected === id }} aria-checked={selected === id} onPress={() => onSelect(id)}
      style={({ pressed }) => [styles.tab, id === '4w' && styles.longTab, selected === id && styles.selected, pressed && styles.pressed]}>
      <AppText variant="label" tone={selected === id ? 'white' : 'default'} style={styles.label}>{label}</AppText>
    </AppPressable>)}
  </View>;
}

const styles = StyleSheet.create({
  group: { flexDirection: 'row', padding: spacing.xs, gap: spacing.xs, borderRadius: radius.lg, backgroundColor: colors.surfaceHigh },
  tab: { flex: 1, minHeight: layout.touchTarget, padding: spacing.sm, alignItems: 'center', justifyContent: 'center', borderRadius: radius.lg },
  longTab: { flex: 1.7 },
  selected: { backgroundColor: colors.brand },
  label: { textAlign: 'center' },
  pressed: { opacity: 0.7 },
});
