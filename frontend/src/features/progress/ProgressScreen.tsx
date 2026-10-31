import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { AppButton } from '../../components/ui/AppButton';
import { AppText } from '../../components/ui/AppText';
import { PreviewNotice } from '../../components/ui/PreviewNotice';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { colors, radius, spacing } from '../../theme';
import { PeriodSelector } from './components/PeriodSelector';
import { VolumeChart } from './components/VolumeChart';
import { WeightCheckIn } from './components/WeightCheckIn';
import { WorkoutHistory } from './components/WorkoutHistory';
import { progressSummary, type ProgressAction, type ProgressState } from './domain/progress';
import { formatProgressDate } from './presentation';

type Props = { state: ProgressState; dispatch: (action: ProgressAction) => void; today: string; isPreview: boolean };

export function ProgressScreen({ state, dispatch, today, isPreview }: Props) {
  const summary = progressSummary(state, state.period, today);
  const [exportInfo, setExportInfo] = useState(false);
  return <Screen>
    <PeriodSelector selected={state.period} onSelect={(period) => { dispatch({ type: 'select-period', period }); setExportInfo(false); }} />
    <PreviewNotice local={!isPreview}>{isPreview ? 'Vista previa · Datos de ejemplo y cambios solo en memoria' : 'Registro temporal · Los cambios se borran al cerrar la app'}</PreviewNotice>
    <Card tone="low">
      <View style={styles.summaryTop}>
        <View style={styles.summaryHeading}>
          <AppText variant="header" accessibilityRole="header">Consistencia del período</AppText>
          <AppText variant="heading">{summary.planned ? `${summary.completed} de ${summary.planned} sesiones` : 'Aún sin sesiones registradas'}</AppText>
        </View>
        {summary.adherence !== null && <View style={styles.badge}>
          <Ionicons name="leaf" size={16} color={colors.brand} /><AppText variant="label">{summary.adherence}% adherencia</AppText>
        </View>}
      </View>
      <AppText variant="caption" tone="muted">{formatProgressDate(summary.from)} — {formatProgressDate(summary.through)}</AppText>
      {summary.planned > 0 && <ProgressBar value={summary.completed} target={summary.planned} label="Sesiones completadas del período" />}
      <AppText variant="caption" tone="muted">{summary.planned ? 'Cada sesión aporta a tu hábito. También hay espacio para ajustar el ritmo y descansar.' : 'Aquí podrás seguir tu constancia cuando tengas entrenamientos registrados.'}</AppText>
    </Card>

    {summary.completed > 0 && <View style={styles.milestone}>
      <View style={styles.milestoneImage}>
        <Ionicons name="barbell-outline" size={28} color={colors.brand} />
        <Image source={require('../../../assets/images/preview-progress-weights.jpg')} style={styles.photo} />
      </View>
      <View style={styles.milestoneText}>
        <AppText variant="header">Ritmo sostenido y sin apuros</AppText>
        <AppText variant="caption" tone="muted">Entrenar con calma también fortalece el hábito a largo plazo.</AppText>
      </View>
    </View>}

    <VolumeChart points={summary.points} totalKg={summary.totalKg} changePercent={summary.changePercent} period={state.period} />
    <WeightCheckIn record={summary.latestWeight} today={today} onSave={(value) => dispatch({ type: 'record-weight', date: today, value })} />
    <WorkoutHistory records={summary.history} />

    <View style={styles.reflection}>
      <Image source={require('../../../assets/images/preview-progress-recovery.jpg')} style={styles.photo} />
      <View style={styles.shade} />
      <AppText variant="header" tone="white" style={styles.reflectionText}>Tu ritmo sostenible vale más que cualquier sesión extrema.</AppText>
    </View>
    <View style={styles.export}>
      <AppButton label="Exportar resumen personal (PDF)" icon="download-outline" variant="secondary" onPress={() => setExportInfo((visible) => !visible)} />
      <AppText variant="caption" tone="muted">Exportación PDF próximamente.</AppText>
      {exportInfo && <AppText accessibilityLiveRegion="polite" variant="caption" tone="brand">La descarga de tu resumen todavía no está disponible. Puedes revisar los datos del período en esta pantalla.</AppText>}
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  summaryTop: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  summaryHeading: { flex: 1, minWidth: 160, gap: spacing.xs },
  badge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.sand, borderRadius: radius.pill },
  milestone: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md, backgroundColor: colors.surfaceHigh, borderRadius: radius.md },
  milestoneImage: { width: 64, height: 64, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, overflow: 'hidden' },
  milestoneText: { flex: 1, gap: spacing.xs },
  photo: { ...StyleSheet.absoluteFill, width: '100%', height: '100%', resizeMode: 'cover' },
  reflection: { minHeight: 160, justifyContent: 'flex-end', backgroundColor: colors.brandStrong, padding: spacing.xl, borderRadius: radius.md, overflow: 'hidden' },
  shade: { ...StyleSheet.absoluteFill, backgroundColor: colors.ink, opacity: 0.74 },
  reflectionText: { zIndex: 1 },
  export: { gap: spacing.sm },
});
