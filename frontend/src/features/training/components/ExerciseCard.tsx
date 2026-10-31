import { AppPressable } from '../../../components/ui/AppPressable';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { AppButton } from '../../../components/ui/AppButton';
import { AppText } from '../../../components/ui/AppText';
import { Card } from '../../../components/ui/Card';
import { colors, layout, radius, spacing } from '../../../theme';
import { activeSet, type SessionExercise } from '../domain/session';
import { formatWeight } from '../format';
import { SetEditor } from './SetEditor';

export function ExerciseCard({ exercise, paused, onDetails, onComplete, onAddSet }: {
  exercise: SessionExercise; paused: boolean; onDetails: () => void;
  onComplete: (setId: number, weight: number, reps: number) => void; onAddSet: () => void;
}) {
  const current = activeSet(exercise);
  const last = exercise.history[0];

  return (
    <Card tone="low" style={styles.card}>
      <View style={styles.top}>
        <View style={styles.heading}>
          <View style={styles.muscle}>
            <Ionicons name="barbell-outline" size={14} color={colors.muted} />
            <AppText variant="label" tone="muted">{exercise.muscleGroup}</AppText>
          </View>
          <AppText variant="heading" accessibilityRole="header">{exercise.name}</AppText>
        </View>
        <AppPressable accessibilityRole="button" accessibilityLabel="Ver técnica e historial" onPress={onDetails}
          style={({ pressed }) => [styles.info, pressed && styles.pressed]}>
          <Ionicons name="information-circle-outline" size={25} color={colors.muted} />
        </AppPressable>
      </View>
      <AppPressable accessibilityRole="button" onPress={onDetails} style={styles.history}>
        <Ionicons name="time-outline" size={16} color={colors.gold} />
        <AppText variant="caption" tone="muted" style={styles.historyText}>
          {last ? `La vez anterior: ${formatWeight(last.weightKg)} kg × ${last.reps} reps (${last.label.toLowerCase()})` : 'Primera vez con este ejercicio'}
        </AppText>
        <AppText variant="label" tone="brand">Técnica</AppText>
      </AppPressable>
      <View style={styles.sets}>
        <View style={styles.row}>
          <AppText variant="label" tone="muted" style={styles.setColumn}>Serie</AppText>
          <AppText variant="label" tone="muted" style={styles.valueColumn}>Carga (kg)</AppText>
          <AppText variant="label" tone="muted" style={styles.valueColumn}>Reps</AppText>
          <AppText variant="label" tone="muted" style={styles.statusColumn}>Estado</AppText>
        </View>
        {exercise.sets.map((set) => set.id === current?.id
          ? <SetEditor key={set.id} set={set} disabled={paused} onComplete={(weight, reps) => onComplete(set.id, weight, reps)} />
          : <View key={set.id} style={[styles.row, styles.set, !set.completed && styles.pending]}>
            <AppText variant="header" tone="muted" style={styles.setColumn}>{set.id}</AppText>
            <AppText variant="strong" style={styles.valueColumn}>{formatWeight(set.weightKg)}</AppText>
            <AppText variant="strong" style={styles.valueColumn}>{set.reps}</AppText>
            <View style={styles.statusColumn} accessible accessibilityLabel={`Serie ${set.id}: ${set.completed ? 'completada' : 'pendiente'}`}>
              <View style={[styles.status, set.completed && styles.completed]}>
                <Ionicons name={set.completed ? 'checkmark' : 'hourglass-outline'} size={19} color={set.completed ? colors.white : colors.muted} />
              </View>
            </View>
          </View>)}
      </View>
      {!current && <AppText variant="label" tone="brand" accessibilityLiveRegion="polite">Todas las series de este ejercicio están completas.</AppText>}
      <AppButton label="Añadir serie" icon="add-circle-outline" variant="secondary" disabled={paused}
        onPress={onAddSet} style={styles.addButton} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  heading: { flex: 1, gap: spacing.sm },
  muscle: { flexDirection: 'row', flexWrap: 'wrap', alignSelf: 'flex-start', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.surfaceHigh, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.pill },
  info: { width: layout.touchTarget, height: layout.touchTarget, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas },
  history: { minHeight: layout.touchTarget, flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.canvas, padding: spacing.sm, borderRadius: radius.sm },
  historyText: { flex: 1 },
  sets: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  set: { minHeight: 58, paddingVertical: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.sm },
  pending: { backgroundColor: colors.surfaceLow },
  setColumn: { width: 40, textAlign: 'center' },
  valueColumn: { flex: 1, textAlign: 'center' },
  statusColumn: { width: 55, alignItems: 'center', textAlign: 'center' },
  status: { width: 36, height: 36, borderRadius: radius.pill, backgroundColor: colors.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  completed: { backgroundColor: colors.brand },
  addButton: { backgroundColor: colors.surface, borderRadius: radius.sm },
  pressed: { opacity: 0.6 },
});
