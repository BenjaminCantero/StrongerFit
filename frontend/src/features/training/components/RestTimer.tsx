import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { AppButton } from '../../../components/ui/AppButton';
import { AppText } from '../../../components/ui/AppText';
import { Card } from '../../../components/ui/Card';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { colors, radius, spacing } from '../../../theme';
import { formatDuration } from '../format';

export function RestTimer({ seconds, durationSeconds, paused, onAdd, onSkip }: {
  seconds: number; durationSeconds: number; paused: boolean; onAdd: () => void; onSkip: () => void;
}) {
  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <View style={styles.icon}><Ionicons name="alarm-outline" size={21} color={colors.brandStrong} /></View>
        <View style={styles.heading}>
          <AppText variant="label" tone="muted">Descanso entre series</AppText>
          <AppText variant="heading">{seconds > 0 ? `${formatDuration(seconds)} restantes` : 'Descanso completado'}</AppText>
          {paused && <AppText variant="caption" tone="muted">En pausa</AppText>}
        </View>
      </View>
      <ProgressBar value={seconds} target={durationSeconds} label="Descanso restante en segundos" />
      <View style={styles.actions}>
        <AppButton label="+30 s" icon="time-outline" variant="secondary" onPress={onAdd} style={styles.button} />
        <AppButton label="Omitir descanso" icon="play-skip-forward-outline" variant="secondary" onPress={onSkip} style={styles.button} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg, gap: spacing.md, backgroundColor: colors.surfaceHigh },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 40, height: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brandSoft },
  heading: { flex: 1 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  button: { flexGrow: 1, backgroundColor: colors.canvas, borderRadius: radius.sm },
});
