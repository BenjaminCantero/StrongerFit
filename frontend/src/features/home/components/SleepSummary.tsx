import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { AppButton } from '../../../components/ui/AppButton';
import { AppText } from '../../../components/ui/AppText';
import { Card } from '../../../components/ui/Card';
import { colors, spacing } from '../../../theme';
import { formatSleep } from '../../sleep/domain/sleep';

export type SleepOverview = { pendingSince: string | null; lastMinutes: number | null; lastCycles: number | null; averageMinutes: number | null; logged: number };

export function SleepSummary({ sleep, onPress }: { sleep: SleepOverview; onPress: () => void }) {
  return <Card tone="low">
    <View style={styles.top}>
      <View style={styles.title}>
        <Ionicons name="moon-outline" size={19} color={colors.brand} />
        <AppText variant="header" accessibilityRole="header">Sueño reciente</AppText>
      </View>
      {sleep.averageMinutes !== null && <AppText variant="label" tone="brand">Prom. {formatSleep(sleep.averageMinutes)}</AppText>}
    </View>
    {sleep.pendingSince ? <AppText>Te acostaste a las {sleep.pendingSince}. Al levantarte, marca la hora de despertar.</AppText>
      : sleep.lastMinutes !== null ? <View style={styles.values}>
        <AppText variant="metric">{formatSleep(sleep.lastMinutes)}</AppText>
        <AppText variant="caption" tone="muted">Última noche · {sleep.lastCycles} ciclos estimados · {sleep.logged} de 7 días con registro</AppText>
      </View>
      : <AppText tone="muted">Registra cuándo te acuestas y despiertas para ver una estimación de tu descanso.</AppText>}
    <AppButton label={sleep.pendingSince ? 'Registrar al despertar' : 'Registrar sueño'} icon={sleep.pendingSince ? 'sunny-outline' : 'moon-outline'} variant="secondary" onPress={onPress} />
  </Card>;
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  title: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1 },
  values: { gap: 2 },
});
