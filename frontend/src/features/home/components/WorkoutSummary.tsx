import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { AppButton } from '../../../components/ui/AppButton';
import { AppText } from '../../../components/ui/AppText';
import { Card } from '../../../components/ui/Card';
import { colors, radius, spacing } from '../../../theme';
import type { HomeOverview } from '../home.types';

export function WorkoutSummary({ workout, onPress }: { workout: HomeOverview['workout']; onPress: () => void }) {
  if (!workout) {
    return (
      <Card>
        <AppText variant="heading" accessibilityRole="header">Tu próximo entrenamiento</AppText>
        <AppText tone="muted">Genera tu rutina semanal con tus días, minutos y equipamiento. Podrás editarla antes de entrenar.</AppText>
        <AppButton label="Generar mi rutina" icon="sparkles-outline" onPress={onPress} />
      </Card>
    );
  }

  return (
    <Card>
      <View style={styles.top}>
        <View style={styles.titleGroup}>
          <View style={styles.badge}>
            <Ionicons name={workout.doneToday ? 'checkmark-circle-outline' : 'repeat-outline'} size={12} color={colors.brand} />
            <AppText variant="label" tone="brand">{workout.doneToday ? 'Hoy ya entrenaste · Siguiente' : `Día ${workout.day + 1} de tu rutina`}</AppText>
          </View>
          <AppText variant="heading" accessibilityRole="header">{workout.title}</AppText>
        </View>
        <View style={styles.workoutIcon}><Ionicons name="barbell" size={22} color={colors.brand} /></View>
      </View>
      <View style={styles.metadata}>
        <View style={styles.metadataItem}>
          <Ionicons name="time-outline" size={16} color={colors.muted} />
          <AppText variant="caption">{workout.durationMinutes} min estimados</AppText>
        </View>
        <View style={styles.metadataItem}>
          <Ionicons name="list-outline" size={16} color={colors.muted} />
          <AppText variant="caption">{workout.exercises.length} ejercicios</AppText>
        </View>
      </View>
      <AppText variant="caption" tone="muted">{workout.exercises.join(' · ')}</AppText>
      <AppButton label="Iniciar entrenamiento" icon="play-outline" variant={workout.doneToday ? 'secondary' : 'primary'} onPress={onPress} />
    </Card>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  titleGroup: { flex: 1, gap: spacing.sm },
  badge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: colors.brandSoft },
  workoutIcon: { width: 38, height: 38, borderRadius: radius.pill, backgroundColor: colors.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  metadata: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  metadataItem: { flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.white, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md },
});
