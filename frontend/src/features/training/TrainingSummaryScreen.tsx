import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../../components/ui/AppButton';
import { AppPressable } from '../../components/ui/AppPressable';
import { AppText } from '../../components/ui/AppText';
import { Card } from '../../components/ui/Card';
import { colors, layout, radius, spacing } from '../../theme';
import type { SessionState } from './domain/session';
import { formatDuration, formatWeight } from './format';

// Icon per muscle group keyword
function exerciseIcon(muscleGroup: string): string {
  const g = muscleGroup.toLowerCase();
  if (g.includes('pierna') || g.includes('cuádr') || g.includes('sentad')) return 'body-outline';
  if (g.includes('espalda') || g.includes('remo')) return 'barbell-outline';
  if (g.includes('pecho') || g.includes('press')) return 'fitness-outline';
  if (g.includes('hombro') || g.includes('elevac')) return 'arrow-up-outline';
  if (g.includes('core') || g.includes('abdomen')) return 'ellipse-outline';
  return 'barbell-outline';
}

type Props = {
  state: SessionState;
  elapsedSeconds: number;
  recorded: boolean;
  onGoHome: () => void;
  onViewHistory: () => void;
};

export function TrainingSummaryScreen({ state, elapsedSeconds, recorded, onGoHome, onViewHistory }: Props) {
  const allSets = state.exercises.flatMap((ex) => ex.sets);
  const completedSets = allSets.filter((s) => s.completed);
  const totalVolumeKg = completedSets.reduce((sum, s) => sum + s.weightKg * s.reps, 0);
  const exercisesDone = state.exercises.filter((ex) => ex.sets.some((s) => s.completed));

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.content}>

          {/* ── Hero celebration ── */}
          <View style={styles.heroCard}>
            <View style={styles.heroBadge}>
              <Ionicons name="leaf" size={28} color={colors.white} />
            </View>
            <AppText variant="title" style={styles.heroTitle}>¡Sesión completada!</AppText>
            <AppText variant="body" tone="muted" style={styles.heroSub}>
              Excelente constancia hoy. Cada sesión suma a tu bienestar y fuerza, a tu propio ritmo.
            </AppText>
            <View style={styles.saveRow} accessibilityLiveRegion="polite">
              <Ionicons name={recorded ? 'time-outline' : 'information-circle-outline'} size={15} color={colors.brand} />
              <AppText variant="caption" tone="muted" style={styles.saveText}>
                {recorded
                  ? 'Añadida al historial de Progreso · Solo en memoria, se borra al cerrar la app'
                  : 'Sin series completadas · Esta sesión no se añadió al historial'}
              </AppText>
            </View>
          </View>

          {/* ── Stats trio ── */}
          <Card>
            <View style={styles.statsRow}>
              <View style={styles.statCell}>
                <Ionicons name="timer-outline" size={22} color={colors.brand} />
                <AppText variant="caption" tone="muted" style={styles.statLabel}>Tiempo real</AppText>
                <AppText variant="metric" style={styles.statValue}>{formatDuration(elapsedSeconds)}</AppText>
                <AppText variant="caption" tone="muted">min:seg</AppText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCell}>
                <Ionicons name="barbell-outline" size={22} color={colors.brand} />
                <AppText variant="caption" tone="muted" style={styles.statLabel}>Ejercicios</AppText>
                <AppText variant="metric" style={styles.statValue}>{exercisesDone.length} de {state.exercises.length}</AppText>
                <AppText variant="caption" tone="muted">{completedSets.length} series totales</AppText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCell}>
                <Ionicons name="layers-outline" size={22} color={colors.brand} />
                <AppText variant="caption" tone="muted" style={styles.statLabel}>Carga total</AppText>
                <AppText variant="metric" style={styles.statValue}>{formatWeight(totalVolumeKg)}</AppText>
                <AppText variant="caption" tone="muted">kg</AppText>
              </View>
            </View>
          </Card>

          {/* ── Movement summary ── */}
          {exercisesDone.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <AppText variant="header">Resumen de movimientos</AppText>
                {totalVolumeKg > 0 && (
                  <AppText variant="caption" tone="muted">
                    Carga máxima anotada
                  </AppText>
                )}
              </View>
              {exercisesDone.map((ex) => {
                const done = ex.sets.filter((s) => s.completed);
                const maxWeight = Math.max(...done.map((s) => s.weightKg));
                const maxWeightSet = done.find((s) => s.weightKg === maxWeight);
                const exVol = done.reduce((sum, s) => sum + s.weightKg * s.reps, 0);
                return (
                  <Card key={ex.id} tone="low" style={styles.exerciseRow}>
                    <View style={styles.exIcon}>
                      <Ionicons name={exerciseIcon(ex.muscleGroup) as any} size={18} color={colors.brand} />
                    </View>
                    <View style={styles.exInfo}>
                      <AppText variant="strong">{ex.name}</AppText>
                      <AppText variant="caption" tone="muted">{done.length} series completadas</AppText>
                    </View>
                    <View style={styles.exStats}>
                      <AppText variant="strong" tone="brand">{formatWeight(exVol)} kg</AppText>
                      {maxWeightSet && (
                        <AppText variant="caption" tone="muted">
                          {maxWeightSet.reps} reps @ {formatWeight(maxWeight)} kg
                        </AppText>
                      )}
                    </View>
                  </Card>
                );
              })}
            </View>
          )}

          {/* ── Recovery tip ── */}
          <View style={styles.recoveryCard}>
            <View style={styles.recoveryIconWrap}>
              <Ionicons name="water-outline" size={22} color={colors.gold} />
            </View>
            <View style={styles.recoveryText}>
              <AppText variant="strong" tone="brand">Recuperación consciente</AppText>
              <AppText variant="caption" tone="muted">
                Hidrátate y descansa bien esta noche. La ganancia de fuerza ocurre durante las horas de reposo.
              </AppText>
            </View>
          </View>

          {/* ── Motivational image ── */}
          <View style={styles.imageCard}>
            <Image
              source={require('../../../assets/images/preview-progress-recovery.jpg')}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
              accessibilityLabel="Imagen motivacional de recuperación"
            />
            <View style={styles.imageShade} />
          </View>

          {/* ── Actions ── */}
          <AppButton
            label="Volver a Inicio"
            icon="home-outline"
            variant="primary"
            onPress={onGoHome}
          />
          {recorded && (
            <AppPressable
              accessibilityRole="button"
              onPress={onViewHistory}
              style={styles.historyLink}
            >
              <Ionicons name="time-outline" size={16} color={colors.brand} />
              <AppText variant="strong" tone="brand" style={styles.historyText}>Ver en el historial de Progreso</AppText>
            </AppPressable>
          )}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.canvas },
  scroll: { flexGrow: 1 },
  content: {
    width: '100%', maxWidth: layout.contentWidth, alignSelf: 'center',
    padding: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.section, gap: spacing.xl,
  },

  // Hero
  heroCard: {
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xxl,
    alignItems: 'center', gap: spacing.md,
  },
  heroBadge: {
    width: 60, height: 60, borderRadius: radius.pill,
    backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.brand, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12,
    elevation: 6,
  },
  heroTitle: { textAlign: 'center' },
  heroSub: { textAlign: 'center' },
  saveRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  saveText: { flexShrink: 1, textAlign: 'center' },

  // Stats
  statsRow: { flexDirection: 'row', alignItems: 'flex-start' },
  statCell: { flex: 1, minWidth: 0, alignItems: 'center', gap: 3, paddingHorizontal: spacing.xs },
  statLabel: { textAlign: 'center' },
  statValue: { fontSize: 22, lineHeight: 28, textAlign: 'center' },
  statDivider: { width: StyleSheet.hairlineWidth, backgroundColor: colors.line, alignSelf: 'stretch', marginVertical: spacing.sm },

  // Section
  section: { gap: spacing.md },
  sectionHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs },

  // Exercise row
  exerciseRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  exIcon: {
    width: 36, height: 36, borderRadius: radius.sm,
    backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center',
  },
  exInfo: { flex: 1, minWidth: 0, gap: 2 },
  exStats: { alignItems: 'flex-end', gap: 2, flexShrink: 1 },

  // Recovery
  recoveryCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md,
    backgroundColor: colors.goldSoft, borderRadius: radius.lg, padding: spacing.lg,
  },
  recoveryIconWrap: {
    width: 36, height: 36, borderRadius: radius.sm,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  recoveryText: { flex: 1, gap: spacing.xs },

  // Image
  imageCard: { height: 120, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.brandStrong },
  imageShade: { ...StyleSheet.absoluteFill, backgroundColor: colors.ink, opacity: 0.4 },

  // Actions
  historyLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, minHeight: layout.touchTarget,
  },
  historyText: { flexShrink: 1, textAlign: 'center' },
});
