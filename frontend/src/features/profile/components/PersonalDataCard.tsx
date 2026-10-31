import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppPressable } from '../../../components/ui/AppPressable';
import { AppText } from '../../../components/ui/AppText';
import { colors, layout, radius, spacing } from '../../../theme';
import type { ProfileData } from '../domain/profile';

const format = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 1 }).format;
const missing = 'Sin definir';

function availability(profile: ProfileData): string {
  const days = profile.daysPerWeek === null ? null : `${profile.daysPerWeek} ${profile.daysPerWeek === 1 ? 'día' : 'días'} por semana`;
  const minutes = profile.sessionMinutes === null ? null : `${profile.sessionMinutes} min por sesión`;
  return [days, minutes].filter(Boolean).join(' · ') || missing;
}

export function PersonalDataCard({ profile, onEdit }: { profile: ProfileData; onEdit: () => void }) {
  const stats = [
    { label: 'Edad', value: profile.ageYears, unit: 'años' },
    { label: 'Altura', value: profile.heightCm, unit: 'cm' },
    { label: 'Peso ref.', value: profile.weightKg, unit: 'kg', highlight: true },
  ];
  const details: { icon: ComponentProps<typeof Ionicons>['name']; label: string; value: string }[] = [
    { icon: 'flag-outline', label: 'Objetivo principal', value: profile.goal || missing },
    { icon: 'calendar-outline', label: 'Disponibilidad semanal', value: availability(profile) },
    { icon: 'fitness-outline', label: 'Equipamiento disponible', value: profile.equipment || missing },
  ];

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitle}>
          <Ionicons name="id-card-outline" size={20} color={colors.brand} />
          <AppText variant="header" accessibilityRole="header" style={styles.titleText}>Ficha personal y rutina</AppText>
        </View>
        <AppPressable accessibilityRole="button" accessibilityLabel="Editar ficha personal" onPress={onEdit} style={styles.editBtn}>
          <Ionicons name="create-outline" size={16} color={colors.brand} />
          <AppText variant="label" tone="brand">Editar</AppText>
        </AppPressable>
      </View>

      <View style={styles.card}>
        <View style={styles.statGrid}>
          {stats.map((s) => (
            <View key={s.label} style={styles.statCell}
              accessible accessibilityLabel={`${s.label}: ${s.value === null ? missing : `${format(s.value)} ${s.unit}`}`}>
              <AppText variant="caption" tone="muted" style={styles.statLabel}>{s.label}</AppText>
              <AppText variant="metric" style={[styles.statValue, s.highlight && s.value !== null && styles.statHighlight]}>
                {s.value === null ? '—' : format(s.value)}
              </AppText>
              <AppText variant="caption" tone="muted">{s.unit}</AppText>
            </View>
          ))}
        </View>

        <View style={styles.detailList}>
          {details.map((d) => (
            <View key={d.label} style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name={d.icon} size={18} color={colors.brand} />
              </View>
              <View style={styles.detailText}>
                <AppText variant="caption" tone="muted">{d.label}</AppText>
                <AppText variant={d.value === missing ? 'body' : 'strong'} tone={d.value === missing ? 'muted' : 'default'}>{d.value}</AppText>
              </View>
            </View>
          ))}
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
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statCell: {
    flex: 1, minWidth: 76, backgroundColor: colors.canvas, borderRadius: radius.sm,
    padding: spacing.md, alignItems: 'center', gap: 2,
  },
  statLabel: { textAlign: 'center' },
  statValue: { fontSize: 22, lineHeight: 28 },
  statHighlight: { color: colors.brand },
  detailList: { gap: spacing.lg },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  detailIcon: {
    width: 34, height: 34, borderRadius: radius.sm,
    backgroundColor: colors.surfaceHigh, alignItems: 'center', justifyContent: 'center',
  },
  detailText: { flex: 1, gap: spacing.xs },
});
