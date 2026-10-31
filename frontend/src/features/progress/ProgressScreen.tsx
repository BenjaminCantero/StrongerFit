import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { AppButton } from '../../components/ui/AppButton';
import { AppText } from '../../components/ui/AppText';
import { PreviewNotice } from '../../components/ui/PreviewNotice';
import { spacing } from '../../theme';
import type { WeightGoal } from '../onboarding/domain/onboarding';
import { ConsistencyHero } from './components/ConsistencyHero';
import { PeriodSelector } from './components/PeriodSelector';
import { VolumeChart } from './components/VolumeChart';
import { WeightCheckIn } from './components/WeightCheckIn';
import { WorkoutHistory } from './components/WorkoutHistory';
import { consistencyMap, progressSummary, type ProgressAction, type ProgressState } from './domain/progress';

type Props = { state: ProgressState; dispatch: (action: ProgressAction) => void; today: string; isPreview: boolean; goal: WeightGoal | null };

export function ProgressScreen({ state, dispatch, today, isPreview, goal }: Props) {
  const summary = progressSummary(state, state.period, today);
  const map = consistencyMap(state, state.period, today);
  const [exportInfo, setExportInfo] = useState(false);
  return <Screen>
    <PeriodSelector selected={state.period} onSelect={(period) => { dispatch({ type: 'select-period', period }); setExportInfo(false); }} />
    <PreviewNotice local={!isPreview}>{isPreview ? 'Vista previa · Datos de ejemplo y cambios solo en memoria' : 'Registro temporal · Los cambios se borran al cerrar la app'}</PreviewNotice>
    <ConsistencyHero completed={summary.completed} planned={summary.planned} adherence={summary.adherence} from={summary.from}
      through={summary.through} unit={map.unit} cells={map.cells} totalKg={summary.totalKg} totalMinutes={summary.totalMinutes} />
    <VolumeChart points={summary.points} totalKg={summary.totalKg} changePercent={summary.changePercent} period={state.period} />
    <WeightCheckIn record={summary.latestWeight} weights={summary.weights} allWeights={state.weights} goal={goal} today={today} onSave={(value) => dispatch({ type: 'record-weight', date: today, value })} />
    <WorkoutHistory records={summary.history} />

    <View style={styles.export}>
      <AppButton label="Exportar resumen personal (PDF)" icon="download-outline" variant="secondary" onPress={() => setExportInfo((visible) => !visible)} />
      <AppText variant="caption" tone="muted">Exportación PDF próximamente.</AppText>
      {exportInfo && <AppText accessibilityLiveRegion="polite" variant="caption" tone="brand">La descarga de tu resumen todavía no está disponible. Puedes revisar los datos del período en esta pantalla.</AppText>}
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  export: { gap: spacing.sm },
});
