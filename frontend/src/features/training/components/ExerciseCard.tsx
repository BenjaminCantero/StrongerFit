import { AppPressable } from '../../../components/ui/AppPressable';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Fragment, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppButton } from '../../../components/ui/AppButton';
import { AppText } from '../../../components/ui/AppText';
import { Card } from '../../../components/ui/Card';
import { colors, layout, radius, spacing } from '../../../theme';
import { activeSet, type SessionExercise } from '../domain/session';
import { formatWeight } from '../format';
import { SetEditor } from './SetEditor';
import { exerciseById } from '@strongerfit/training-engine';
import { MovementPictogram } from './MovementPictogram';

export function ExerciseCard({ exercise, paused, rest, onDetails, onComplete, onAddSet }: {
  exercise: SessionExercise; paused: boolean; rest?: ReactNode; onDetails: () => void;
  onComplete: (setId: number, weight: number, reps: number, reserve?: number) => void; onAddSet: () => void;
}) {
  const current = activeSet(exercise);
  // Ejercicios de borradores antiguos sin medición se tratan como con carga.
  const weighted = (exercise.measure ?? 'weighted-reps') === 'weighted-reps';
  const last = exercise.history[0];
  const pattern = exercise.exerciseId ? exerciseById(exercise.exerciseId)?.pattern : undefined;

  return (
    <Card tone="low" style={styles.card}>
      <View style={styles.top}>
        {pattern && <MovementPictogram pattern={pattern} size={56} />}
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
          {last ? weighted ? `La vez anterior: ${formatWeight(last.weightKg)} kg × ${last.reps} reps (${last.label.toLowerCase()})`
            : `La vez anterior: ${last.reps} reps (${last.label.toLowerCase()})` : 'Primera vez con este ejercicio'}
        </AppText>
        <AppText variant="label" tone="brand">Técnica</AppText>
      </AppPressable>
      <View style={styles.sets}>
        <View style={styles.row}>
          <AppText variant="label" tone="muted" style={styles.setColumn}>Serie</AppText>
          <AppText variant="label" tone="muted" style={styles.valueColumn}>{weighted ? 'Carga (kg)' : 'Carga'}</AppText>
          <AppText variant="label" tone="muted" style={styles.valueColumn}>Reps</AppText>
          <AppText variant="label" tone="muted" style={styles.statusColumn}>Estado</AppText>
        </View>
        {exercise.sets.map((set) => (
          <Fragment key={set.id}>
            {set.id === current?.id && rest}
            {set.id === current?.id
              ? <SetEditor key={`${set.id}-${set.weightKg}`} set={set} weighted={weighted} step={exercise.loadStep ?? 2.5} disabled={paused}
                onComplete={(weight, reps, reserve) => onComplete(set.id, weight, reps, reserve)} />
              : <View style={[styles.row, styles.set, !set.completed && styles.pending]}>
                <AppText variant="header" tone="muted" style={styles.setColumn}>{set.id}</AppText>
                <View style={styles.valueColumn}>
                  <AppText variant="strong" style={styles.center}>{weighted ? formatWeight(set.weightKg) : 'Sin carga'}</AppText>
                  {weighted && (set.estimated || set.calibration) && <AppText variant="caption" tone="muted" style={styles.center}>
                    {set.calibration ? 'calibración' : 'estimada'}
                  </AppText>}
                </View>
                <AppText variant="strong" style={styles.valueColumn}>{set.reps}</AppText>
                <View style={styles.statusColumn} accessible accessibilityLabel={`Serie ${set.id}: ${set.completed ? 'completada' : 'pendiente'}`}>
                  <View style={[styles.status, set.completed && styles.completed]}>
                    <Ionicons name={set.completed ? 'checkmark' : 'hourglass-outline'} size={19} color={set.completed ? colors.white : colors.muted} />
                  </View>
                </View>
              </View>}
          </Fragment>
        ))}
        {!current && rest}
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
  center: { textAlign: 'center' },
  statusColumn: { width: 55, alignItems: 'center', textAlign: 'center' },
  status: { width: 36, height: 36, borderRadius: radius.pill, backgroundColor: colors.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  completed: { backgroundColor: colors.brand },
  addButton: { backgroundColor: colors.surface, borderRadius: radius.sm },
  pressed: { opacity: 0.6 },
});
