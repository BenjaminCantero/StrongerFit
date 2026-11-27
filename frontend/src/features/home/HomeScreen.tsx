import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { AppText } from '../../components/ui/AppText';
import { PreviewNotice } from '../../components/ui/PreviewNotice';
import { colors, radius, spacing } from '../../theme';
import { NutritionSummary } from './components/NutritionSummary';
import { ResumeSession, type PendingSession } from './components/ResumeSession';
import { UnsentSession, type UnsentSessionInfo } from './components/UnsentSession';
import { SleepSummary, type SleepOverview } from './components/SleepSummary';
import { features } from '../../shared/features';
import { WeeklyAdherence } from './components/WeeklyAdherence';
import { WeightGoal } from './components/WeightGoal';
import { WorkoutSummary } from './components/WorkoutSummary';
import type { HomeOverview } from './home.types';

type Props = {
  overview: HomeOverview;
  today: string;
  pending: PendingSession | null;
  // Sesión terminada que el servidor aún no confirmó (RNF-06).
  unsent: UnsentSessionInfo | null;
  onRetryUnsent: () => void;
  isPreview?: boolean;
  onTrainingPress: () => void;
  onResume: () => void;
  onNutritionPress: () => void;
  onWeightPress: () => void;
  onHistory: () => void;
  sleep: SleepOverview;
  onSleep: () => void;
};

export function HomeScreen({ overview, today, pending, unsent, onRetryUnsent, isPreview, onTrainingPress, onResume, onNutritionPress, onWeightPress, onHistory, sleep, onSleep }: Props) {
  const formattedDate = new Intl.DateTimeFormat('es-CL', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Santiago',
  }).format(overview.date);
  const date = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <Screen>
      <View style={styles.greetingCard}>
        <View style={styles.greeting}>
          <View style={styles.greetingText}>
            <AppText variant="label" tone="brand">Resumen de hoy</AppText>
            <AppText variant="title" accessibilityRole="header">{overview.firstName ? `¡Hola, ${overview.firstName}!` : '¡Bienvenido a StrongerFit!'}</AppText>
            <View style={styles.date}>
              <View style={styles.dateDot} />
              <AppText variant="caption" tone="muted">{date}</AppText>
            </View>
          </View>
          {overview.activeWeeks > 1 && <View style={styles.streak} accessible
            accessibilityLabel={`${overview.activeWeeks} semanas seguidas con al menos un entrenamiento`}>
            <Ionicons name="flame" size={15} color={colors.gold} />
            <AppText variant="label" style={styles.streakText}>{overview.activeWeeks} sem. activas</AppText>
          </View>}
        </View>
      </View>
      {isPreview && <PreviewNotice>Vista previa · Datos de ejemplo</PreviewNotice>}
      {unsent && <UnsentSession session={unsent} onRetry={onRetryUnsent} />}
      {pending ? <ResumeSession session={pending} onPress={onResume} />
        : <WorkoutSummary workout={overview.workout} onPress={onTrainingPress} />}
      <NutritionSummary nutrition={overview.nutrition} onPress={onNutritionPress} />
      {overview.weight && <WeightGoal weight={overview.weight} onPress={onWeightPress} />}
      {features.sleep && <SleepSummary sleep={sleep} onPress={onSleep} />}
      <WeeklyAdherence adherence={overview.adherence} today={today} onHistory={onHistory} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  greetingCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.surfaceHigh,
  },
  greeting: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  greetingText: { flexShrink: 1, gap: 2 },
  date: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 4 },
  dateDot: { width: 6, height: 6, borderRadius: radius.pill, backgroundColor: colors.brand },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.goldSoft,
    borderRadius: radius.pill,
  },
  streakText: { color: colors.gold },
});
