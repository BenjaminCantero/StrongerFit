import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { AppButton } from '../../../components/ui/AppButton';
import { AppText } from '../../../components/ui/AppText';
import { Card } from '../../../components/ui/Card';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { colors, radius, spacing } from '../../../theme';

export type PendingSession = { title: string; completedSets: number; totalSets: number };

export function ResumeSession({ session, onPress }: { session: PendingSession; onPress: () => void }) {
  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <View style={styles.icon}><Ionicons name="play" size={18} color={colors.white} /></View>
        <View style={styles.text}>
          <AppText variant="header" accessibilityRole="header">Sesión en curso</AppText>
          <AppText variant="caption" tone="muted">{session.title} · {session.completedSets} de {session.totalSets} series</AppText>
        </View>
      </View>
      <ProgressBar value={session.completedSets} target={session.totalSets} label="Series completadas de la sesión en curso" />
      <AppButton label="Continuar sesión" icon="play-outline" onPress={onPress} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: colors.brandMedium },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 38, height: 38, borderRadius: radius.pill, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1 },
});
