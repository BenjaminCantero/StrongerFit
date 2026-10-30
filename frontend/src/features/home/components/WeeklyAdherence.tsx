import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import { Card } from '../../../components/ui/Card';
import { colors, radius, spacing } from '../../../theme';
import type { HomeOverview, WeekDay } from '../home.types';

const statusLabels = { completed: 'completado', current: 'hoy', planned: 'pendiente', rest: 'descanso' };

function Day({ day }: { day: WeekDay }) {
  const completed = day.state === 'completed';
  const current = day.state === 'current';

  return (
    <View accessible accessibilityLabel={`${day.name}: ${statusLabels[day.state]}`}
      style={[styles.day, current && styles.currentDay]}>
      <AppText variant="label" tone={current ? 'brand' : 'muted'}>{day.label}</AppText>
      <View style={[styles.status, completed && styles.completed, current && styles.currentStatus,
        day.state === 'rest' && styles.rest]}>
        {completed ? <Ionicons name="checkmark" size={16} color={colors.white} />
          : day.state === 'rest' ? <Ionicons name="bed-outline" size={13} color={colors.gold} />
            : current ? <View style={styles.currentDot} />
              : <View style={styles.plannedDot} />}
      </View>
    </View>
  );
}

export function WeeklyAdherence({ adherence }: { adherence: HomeOverview['adherence'] }) {
  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <View style={styles.title}>
          <Ionicons name="calendar-outline" size={19} color={colors.brand} />
          <AppText variant="header" accessibilityRole="header">Adherencia semanal</AppText>
        </View>
        {adherence && <AppText variant="label" tone="brand">{adherence.completedSessions} / {adherence.targetSessions} días</AppText>}
      </View>
      {adherence
        ? <View style={styles.week}>{adherence.days.map((day) => <Day key={day.name} day={day} />)}</View>
        : <AppText tone="muted">Cuando registres entrenamientos podrás ver tu constancia semanal.</AppText>}
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
  rest: { backgroundColor: colors.goldSoft },
  currentDot: { width: 7, height: 7, borderRadius: radius.pill, backgroundColor: colors.brand },
  plannedDot: { width: 4, height: 4, borderRadius: radius.pill, backgroundColor: colors.muted },
});
