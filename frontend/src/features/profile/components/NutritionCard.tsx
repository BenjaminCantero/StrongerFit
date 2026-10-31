import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { AppPressable } from '../../../components/ui/AppPressable';
import { AppText } from '../../../components/ui/AppText';
import { colors, layout, radius, spacing } from '../../../theme';

export function NutritionCard({ exclusions, dietFocus, onAdjust }: { exclusions: string[]; dietFocus: string; onAdjust: () => void }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitle}>
          <Ionicons name="restaurant-outline" size={20} color={colors.brand} />
          <AppText variant="header" accessibilityRole="header" style={styles.titleText}>Nutrición y restricciones</AppText>
        </View>
        <AppPressable accessibilityRole="button" accessibilityLabel="Ajustar nutrición y restricciones" onPress={onAdjust} style={styles.editBtn}>
          <Ionicons name="options-outline" size={16} color={colors.brand} />
          <AppText variant="label" tone="brand">Ajustar</AppText>
        </AppPressable>
      </View>

      <View style={styles.card}>
        <View style={styles.group}>
          <AppText variant="label" tone="muted">Exclusiones obligatorias</AppText>
          {exclusions.length ? <View style={styles.chipRow}>
            {exclusions.map((item) => <View key={item} style={styles.chip}>
              <Ionicons name="alert-circle-outline" size={13} color={colors.error} />
              <AppText variant="label" style={styles.chipText}>Sin {item}</AppText>
            </View>)}
          </View> : <AppText tone="muted">Sin exclusiones declaradas.</AppText>}
          <AppText variant="caption" tone="muted">Se aplicarán como restricción a la minuta semanal cuando esté disponible.</AppText>
        </View>

        <View style={styles.group}>
          <AppText variant="label" tone="muted">Enfoque dietario</AppText>
          <View style={styles.dietRow}>
            <View style={styles.dietIcon}>
              <Ionicons name="leaf-outline" size={20} color={colors.brand} />
            </View>
            <AppText variant={dietFocus ? 'strong' : 'body'} tone={dietFocus ? 'default' : 'muted'} style={styles.dietText}>
              {dietFocus || 'Sin preferencia definida'}
            </AppText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  sectionTitle: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  titleText: { flexShrink: 1 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minHeight: layout.touchTarget, paddingHorizontal: spacing.xs },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.lg },
  group: { gap: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs, maxWidth: '100%',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: '#FFDAD8',
  },
  chipText: { color: colors.error, flexShrink: 1 },
  dietRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    backgroundColor: colors.canvas, borderRadius: radius.sm, padding: spacing.md,
  },
  dietIcon: {
    width: 34, height: 34, borderRadius: radius.sm,
    backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center',
  },
  dietText: { flex: 1 },
});
