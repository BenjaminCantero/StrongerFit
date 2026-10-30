import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import { Card } from '../../../components/ui/Card';
import { colors, radius, spacing } from '../../../theme';
import type { WorkoutRecord } from '../domain/progress';
import { formatKg, formatProgressDate } from '../presentation';

export function WorkoutHistory({ records }: { records: WorkoutRecord[] }) {
  return <View style={styles.section}>
    <View style={styles.heading}>
      <AppText variant="header" accessibilityRole="header" style={styles.title}>Historial de entrenamientos</AppText>
      <AppText variant="caption" tone="muted">{records.length} más recientes</AppText>
    </View>
    {!records.length && <Card tone="low"><AppText tone="muted">No hay entrenamientos completados en este período.</AppText></Card>}
    {records.map((record) => <Card key={record.id} tone="low" style={styles.record}>
      <View style={styles.description}>
        <View style={styles.icon}><Ionicons name={record.name.includes('Movilidad') ? 'leaf-outline' : 'barbell-outline'} size={22} color={colors.brand} /></View>
        <View style={styles.title}>
          <AppText variant="header">{record.name}</AppText>
          <AppText variant="caption" tone="muted">{formatProgressDate(record.date)}, {record.time} h · {record.durationMinutes} min</AppText>
        </View>
      </View>
      <View style={styles.result}>
        <AppText variant="strong">{formatKg(record.volumeKg)} kg</AppText>
        <AppText variant="caption" tone="brand">Completada</AppText>
      </View>
    </Card>)}
  </View>;
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  heading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1, minWidth: 100 },
  record: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', padding: spacing.lg, gap: spacing.md },
  description: { flex: 1, minWidth: 180, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  result: { alignItems: 'flex-end' },
});
