import { exerciseById } from '@strongerfit/training-engine';
import { StyleSheet, View } from 'react-native';
import { AppButton } from '../../../components/ui/AppButton';
import { AppText } from '../../../components/ui/AppText';
import { colors, radius, spacing } from '../../../theme';
import type { SessionExercise } from '../domain/session';
import { formatWeight } from '../format';
import { MovementPictogram } from './MovementPictogram';

export function ExerciseDetails({ exercise, onClose }: { exercise: SessionExercise; onClose: () => void }) {
  const pattern = exercise.exerciseId ? exerciseById(exercise.exerciseId)?.pattern : undefined;
  return (
    <>
      {pattern && <MovementPictogram pattern={pattern} size={120} style={styles.image} />}
      <View style={styles.section}>
        <AppText variant="strong">Puntos clave de ejecución</AppText>
        {exercise.technique.length ? <>
          {exercise.technique.map((point) => <AppText key={point}>{point}</AppText>)}
          <AppText variant="caption" tone="muted">Indicaciones provisionales, pendientes de revisión profesional. Detente si sientes dolor.</AppText>
        </> : <AppText tone="muted">Aún no hay indicaciones de técnica revisadas para este ejercicio. Muévete con control y detente si aparece dolor.</AppText>}
      </View>
      <View style={styles.history}>
        <AppText variant="strong">Últimas veces</AppText>
        {exercise.history.length ? exercise.history.map((item) => (
          <View key={item.label} style={styles.historyRow}>
            <AppText variant="caption" tone="muted">{item.label} · {item.sets} series</AppText>
            <AppText variant="label">{formatWeight(item.weightKg)} kg × {item.reps} reps</AppText>
          </View>
        )) : <AppText tone="muted">Todavía no hay registros.</AppText>}
      </View>
      <AppButton label="Entendido" onPress={onClose} />
    </>
  );
}

const styles = StyleSheet.create({
  image: { alignSelf: 'center' },
  section: { gap: spacing.sm },
  history: { padding: spacing.lg, backgroundColor: colors.surfaceLow, borderRadius: radius.md, gap: spacing.md },
  historyRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.sm },
});
