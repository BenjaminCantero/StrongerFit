import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import { Card } from '../../../components/ui/Card';
import { colors, radius, spacing } from '../../../theme';
import type { WorkoutRecord } from '../domain/progress';
import { formatKg } from '../presentation';

const day = new Intl.DateTimeFormat('es-CL', { day: 'numeric', timeZone: 'UTC' });
const month = new Intl.DateTimeFormat('es-CL', { month: 'short', timeZone: 'UTC' });

export function WorkoutHistory({ records }: { records: WorkoutRecord[] }) {
  return <Card tone="low" style={styles.card}>
    <View style={styles.heading}>
      <AppText variant="header" accessibilityRole="header" style={styles.title}>Últimas sesiones</AppText>
      {records.length > 0 && <AppText variant="caption" tone="muted">{records.length} más recientes</AppText>}
    </View>
    {!records.length && <AppText tone="muted">No hay entrenamientos completados en este período.</AppText>}
    {records.map((record, index) => {
      const date = new Date(`${record.date}T12:00:00Z`);
      return <View key={record.id} accessible style={[styles.row, index > 0 && styles.separated]}
        accessibilityLabel={`${record.name}, ${day.format(date)} de ${month.format(date)}, ${record.durationMinutes} minutos, ${formatKg(record.volumeKg)} kilogramos`}>
        <View style={styles.date}>
          <AppText variant="strong" tone="brand">{day.format(date)}</AppText>
          <AppText variant="caption" tone="brand">{month.format(date).replace('.', '')}</AppText>
        </View>
        <View style={styles.title}>
          <AppText variant="label">{record.name}</AppText>
          <View style={styles.meta}>
            <Ionicons name="time-outline" size={13} color={colors.muted} />
            <AppText variant="caption" tone="muted">{record.time} h · {record.durationMinutes} min</AppText>
          </View>
        </View>
        <AppText variant="strong">{formatKg(record.volumeKg)}<AppText variant="caption" tone="muted"> kg</AppText></AppText>
      </View>;
    })}
  </Card>;
}

const styles = StyleSheet.create({
  card: { gap: 0 },
  heading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm, paddingBottom: spacing.sm },
  title: { flex: 1, minWidth: 100, gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  separated: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  date: { width: 46, paddingVertical: spacing.xs, alignItems: 'center', borderRadius: radius.sm, backgroundColor: colors.brandSoft },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
