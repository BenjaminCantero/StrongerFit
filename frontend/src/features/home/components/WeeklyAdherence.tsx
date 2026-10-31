import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { AppPressable } from '../../../components/ui/AppPressable';
import { AppText } from '../../../components/ui/AppText';
import { Card } from '../../../components/ui/Card';
import { colors, layout, radius, spacing } from '../../../theme';
import type { HomeOverview, WeekDay } from '../home.types';

const statusLabels = { completed: 'entrenaste', current: 'hoy', missed: 'sin sesión', upcoming: 'por venir' };
const number = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });

function ago(date: string, today: string) {
  const days = Math.round((Date.parse(`${today}T12:00:00Z`) - Date.parse(`${date}T12:00:00Z`)) / 86_400_000);
  return days === 0 ? 'hoy' : days === 1 ? 'ayer' : `hace ${days} días`;
}

function Day({ day }: { day: WeekDay }) {
  const completed = day.state === 'completed';
  const current = day.state === 'current';

  return (
    <View accessible accessibilityLabel={`${day.name}: ${statusLabels[day.state]}`}
      style={[styles.day, current && styles.currentDay]}>
      <AppText variant="label" tone={current ? 'brand' : 'muted'}>{day.label}</AppText>
      <View style={[styles.status, completed && styles.completed, current && styles.currentStatus, day.state === 'upcoming' && styles.upcoming]}>
        {completed ? <Ionicons name="checkmark" size={16} color={colors.white} />
          : current ? <View style={styles.currentDot} />
            : <View style={styles.plannedDot} />}
      </View>
    </View>
  );
}

export function WeeklyAdherence({ adherence, today, onHistory }: { adherence: HomeOverview['adherence']; today: string; onHistory: () => void }) {
  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <View style={styles.title}>
          <Ionicons name="calendar-outline" size={19} color={colors.brand} />
          <AppText variant="header" accessibilityRole="header">Esta semana</AppText>
        </View>
        {adherence && <AppText variant="label" tone="brand">
          {adherence.targetSessions ? `${adherence.completedSessions} de ${adherence.targetSessions} sesiones` : `${adherence.completedSessions} sesiones`}
        </AppText>}
      </View>
      {adherence
        ? <View style={styles.week}>{adherence.days.map((day) => <Day key={day.name} day={day} />)}</View>
        : <AppText tone="muted">Cuando registres entrenamientos podrás ver tu constancia semanal.</AppText>}
      {adherence?.last && <AppPressable accessibilityRole="button" onPress={onHistory}
        accessibilityLabel={`Última sesión: ${adherence.last.name}, ${ago(adherence.last.date, today)}. Ver historial`}
        style={({ pressed }) => [styles.last, pressed && styles.pressed]}>
        <Ionicons name="time-outline" size={18} color={colors.muted} />
        <View style={styles.lastText}>
          <AppText variant="label">Última: {adherence.last.name}</AppText>
          <AppText variant="caption" tone="muted">
            {ago(adherence.last.date, today)} · {adherence.last.durationMinutes} min · {number.format(adherence.last.volumeKg)} kg movilizados
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </AppPressable>}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg },
  top: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.sm },
  title: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1 },
  week: { flexDirection: 'row', gap: spacing.xs },
  day: { flex: 1, minWidth: 0, paddingVertical: spacing.sm, gap: spacing.sm, alignItems: 'center', borderRadius: radius.pill, backgroundColor: colors.canvas },
  currentDay: { backgroundColor: colors.brandSoft },
  status: { width: 25, height: 25, borderRadius: radius.pill, backgroundColor: colors.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  completed: { backgroundColor: colors.brand },
  currentStatus: { backgroundColor: colors.brandMedium },
  upcoming: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.surfaceHigh },
  last: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: layout.touchTarget, paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.surfaceHigh },
  lastText: { flex: 1 },
  pressed: { opacity: 0.6 },
  currentDot: { width: 7, height: 7, borderRadius: radius.pill, backgroundColor: colors.brand },
  plannedDot: { width: 4, height: 4, borderRadius: radius.pill, backgroundColor: colors.muted },
});
