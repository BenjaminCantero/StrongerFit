import { Image, StyleSheet, View } from 'react-native';
import { AppButton } from '../../../components/ui/AppButton';
import { AppText } from '../../../components/ui/AppText';
import { colors, radius, spacing } from '../../../theme';
import type { SessionExercise } from '../domain/session';
import { formatWeight } from '../format';

export function ExerciseDetails({ exercise, onClose }: { exercise: SessionExercise; onClose: () => void }) {
  return (
    <>
      {exercise.id === 'dumbbell-press' && <Image source={require('../../../../assets/images/preview-exercise.jpg')}
        accessibilityLabel="Imagen ilustrativa del ejercicio de la referencia de diseño" style={styles.image} />}
      <View style={styles.section}>
        <AppText variant="strong">Puntos clave de ejecución</AppText>
        {exercise.technique.map((point) => <AppText key={point}>{point}</AppText>)}
        <AppText variant="caption" tone="muted">Contenido de ejemplo pendiente de revisión profesional.</AppText>
      </View>
      <View style={styles.history}>
        <AppText variant="strong">Historial de ejemplo</AppText>
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
  image: { width: '100%', height: 180, borderRadius: radius.md },
  section: { gap: spacing.sm },
  history: { padding: spacing.lg, backgroundColor: colors.surfaceLow, borderRadius: radius.md, gap: spacing.md },
  historyRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.sm },
});
