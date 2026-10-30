import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { AppButton } from '../../../components/ui/AppButton';
import { AppText } from '../../../components/ui/AppText';
import { Card } from '../../../components/ui/Card';
import { colors, radius, spacing } from '../../../theme';
import { formatDuration } from '../format';

export function SessionControls({ title, elapsedSeconds, paused, onPause, onFinish }: {
  title: string; elapsedSeconds: number; paused: boolean; onPause: () => void; onFinish: () => void;
}) {
  return (
    <Card tone="low" style={styles.card}>
      <View style={styles.top}>
        <View style={styles.heading}>
          <AppText variant="label" tone="muted">Sesión de hoy</AppText>
          <AppText variant="heading" accessibilityRole="header">{title}</AppText>
        </View>
        <View style={styles.clock} accessible accessibilityLabel={`Tiempo de sesión: ${formatDuration(elapsedSeconds)}${paused ? ', en pausa' : ''}`}>
          <Ionicons name="timer-outline" size={20} color={colors.brand} />
          <AppText variant="header" style={styles.digits}>{formatDuration(elapsedSeconds)}</AppText>
        </View>
      </View>
      <View style={styles.actions}>
        <AppButton label={paused ? 'Reanudar' : 'Pausar'} icon={paused ? 'play-outline' : 'pause-outline'}
          variant="secondary" onPress={onPause} style={styles.button} />
        <AppButton label="Finalizar" icon="stop-circle-outline" variant="danger" onPress={onFinish} style={styles.button} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg, gap: spacing.md },
  top: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  heading: { flexShrink: 1 },
  clock: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.sm, backgroundColor: colors.canvas },
  digits: { fontVariant: ['tabular-nums'] },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  button: { flex: 1, minWidth: 125, borderRadius: radius.md, backgroundColor: colors.surfaceHigh },
});
