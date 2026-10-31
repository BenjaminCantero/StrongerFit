import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { AppText } from '../../components/ui/AppText';
import { PreviewNotice } from '../../components/ui/PreviewNotice';
import { colors, radius, spacing } from '../../theme';
import { NutritionSummary } from './components/NutritionSummary';
import { WeeklyAdherence } from './components/WeeklyAdherence';
import { WorkoutSummary } from './components/WorkoutSummary';
import type { HomeOverview } from './home.types';

type Props = {
  overview: HomeOverview;
  isPreview?: boolean;
  onTrainingPress: () => void;
  onNutritionPress: () => void;
};

export function HomeScreen({ overview, isPreview, onTrainingPress, onNutritionPress }: Props) {
  const formattedDate = new Intl.DateTimeFormat('es-CL', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Santiago',
  }).format(overview.date);
  const date = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <Screen>
      <View style={styles.greeting}>
        <View style={styles.greetingText}>
          <AppText variant="title" accessibilityRole="header">{overview.firstName ? `¡Hola, ${overview.firstName}!` : '¡Bienvenido a StrongerFit!'}</AppText>
          <View style={styles.date}>
            <View style={styles.dateDot} />
            <AppText variant="caption" tone="muted">{date}</AppText>
          </View>
        </View>
        {overview.streakDays > 0 && <View style={styles.streak}>
          <Ionicons name="flame" size={15} color={colors.gold} />
          <AppText variant="label">{overview.streakDays} días racha</AppText>
        </View>}
      </View>
      {isPreview && <PreviewNotice>Vista previa · Datos de ejemplo</PreviewNotice>}
      <WorkoutSummary workout={overview.workout} onPress={onTrainingPress} />
      <NutritionSummary nutrition={overview.nutrition} onPress={onNutritionPress} />
      <WeeklyAdherence adherence={overview.adherence} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  greeting: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  greetingText: { flexShrink: 1 },
  date: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 2 },
  dateDot: { width: 5, height: 5, borderRadius: radius.pill, backgroundColor: colors.brand },
  streak: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.surfaceLow, borderRadius: radius.pill },
});
