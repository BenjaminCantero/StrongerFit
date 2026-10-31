import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppPressable } from '../../../components/ui/AppPressable';
import { AppText } from '../../../components/ui/AppText';
import { Card } from '../../../components/ui/Card';
import { ChartSegment, type ChartPoint } from '../../../components/ui/ChartSegment';
import { colors, layout, radius, spacing } from '../../../theme';
import type { ExerciseTrend } from '../domain/records';
import { formatKg, formatProgressDate } from '../presentation';

const HEIGHT = 110;
const DOT = 10;
const shortDate = (date: string) => formatProgressDate(date).replace(/ \d{4}$/, '').replace('.', '');

function Chart({ trend }: { trend: ExerciseTrend }) {
  const [width, setWidth] = useState(0);
  const values = trend.points.map((point) => point.weightKg);
  const low = Math.max(0, Math.floor(Math.min(...values) - 2.5));
  const high = Math.ceil(Math.max(...values) + 2.5);
  const at = (index: number, kg: number): ChartPoint => ({
    x: trend.points.length === 1 ? width / 2 : DOT / 2 + index / (trend.points.length - 1) * (width - DOT),
    y: (high - kg) / (high - low) * HEIGHT,
  });
  const bestIndex = trend.points.findIndex((point) => point.weightKg === trend.best.weightKg && point.reps === trend.best.reps);
  return <View style={styles.chart} accessible accessibilityRole="image"
    accessibilityLabel={`${trend.name}: ${trend.points.map((point) => `${formatKg(point.weightKg)} kilos por ${point.reps} el ${formatProgressDate(point.date)}`).join('; ')}`}>
    <View style={styles.plot} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      <View style={[styles.grid, { top: 0 }]} /><View style={[styles.grid, { top: HEIGHT - 1 }]} />
      {width > 0 && <>
        {trend.points.slice(1).map((point, index) => <ChartSegment key={`${point.date}-${index}`} color={colors.brandMedium} thickness={2.5}
          from={at(index, trend.points[index]!.weightKg)} to={at(index + 1, point.weightKg)} />)}
        {trend.points.map((point, index) => {
          const position = at(index, point.weightKg);
          return <View key={`${point.date}-${index}`} style={[styles.dot, index === bestIndex && styles.best,
            { left: position.x - DOT / 2, top: position.y - DOT / 2 }]} />;
        })}
      </>}
    </View>
    <View style={styles.axis}>
      <AppText variant="caption" tone="muted">{shortDate(trend.points[0]!.date)}</AppText>
      <AppText variant="caption" tone="muted">{formatKg(low)}–{formatKg(high)} kg</AppText>
      <AppText variant="caption" tone="muted">{shortDate(trend.points.at(-1)!.date)}</AppText>
    </View>
  </View>;
}

export function ExerciseProgress({ trends }: { trends: ExerciseTrend[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const trend = trends.find((item) => item.exerciseId === selectedId) ?? trends[0];
  return <Card tone="low">
    <View style={styles.heading}>
      <View style={styles.title}>
        <AppText variant="header" accessibilityRole="header">Carga por ejercicio</AppText>
        <AppText variant="caption" tone="muted">Serie más pesada de cada sesión</AppText>
      </View>
      <Ionicons name="trending-up-outline" size={24} color={colors.brand} />
    </View>
    {!trend ? <AppText tone="muted">Al completar sesiones de tu rutina verás aquí cómo evoluciona la carga de cada ejercicio.</AppText> : <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <View role="radiogroup" accessibilityLabel="Ejercicio" style={styles.chips}>
          {trends.map((item) => {
            const selected = item.exerciseId === trend.exerciseId;
            return <AppPressable key={item.exerciseId} accessibilityRole="radio" accessibilityState={{ checked: selected }} aria-checked={selected}
              onPress={() => setSelectedId(item.exerciseId)} style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}>
              <AppText variant="label" tone={selected ? 'white' : 'muted'}>{item.name}</AppText>
            </AppPressable>;
          })}
        </View>
      </ScrollView>
      <View style={styles.stats}>
        <View style={styles.stat}>
          <View style={styles.statLabel}><Ionicons name="trophy-outline" size={13} color={colors.gold} /><AppText variant="caption" tone="muted">Mejor serie</AppText></View>
          <AppText variant="strong">{formatKg(trend.best.weightKg)} kg × {trend.best.reps}</AppText>
        </View>
        <View style={styles.stat}>
          <AppText variant="caption" tone="muted">Cambio</AppText>
          <AppText variant="strong" tone={trend.changeKg > 0 ? 'brand' : undefined}>{trend.changeKg > 0 ? '+' : trend.changeKg < 0 ? '−' : ''}{formatKg(Math.abs(trend.changeKg))} kg</AppText>
        </View>
        <View style={styles.stat}>
          <AppText variant="caption" tone="muted">Sesiones</AppText>
          <AppText variant="strong">{trend.points.length}</AppText>
        </View>
      </View>
      {trend.points.length > 1 ? <Chart trend={trend} />
        : <AppText variant="caption" tone="muted">Una sola sesión en este período. Con dos o más verás la evolución.</AppText>}
      <AppText variant="caption" tone="muted">Subir de carga no es obligatorio en cada sesión; la técnica y el descanso también cuentan.</AppText>
    </>}
  </Card>;
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1, gap: spacing.xs },
  chips: { flexDirection: 'row', gap: spacing.sm },
  chip: { minHeight: layout.touchTarget, justifyContent: 'center', paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.surfaceHigh },
  selected: { backgroundColor: colors.brand },
  pressed: { opacity: 0.7 },
  stats: { flexDirection: 'row', gap: spacing.sm },
  stat: { flex: 1, gap: 2 },
  statLabel: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chart: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.lg, gap: spacing.sm },
  plot: { height: HEIGHT },
  grid: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: colors.surfaceHigh },
  dot: { position: 'absolute', width: DOT, height: DOT, borderRadius: radius.pill, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.brand },
  best: { backgroundColor: colors.gold, borderColor: colors.gold },
  axis: { flexDirection: 'row', justifyContent: 'space-between' },
});
