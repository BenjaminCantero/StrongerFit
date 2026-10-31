import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import { colors, radius, spacing } from '../../../theme';
import type { WeightGoal } from '../../onboarding/domain/onboarding';
import { MIN_WEIGHINS, weightGoalSummary } from '../domain/weight-goal';
import { formatKg, formatProgressDate } from '../presentation';

const HEIGHT = 150;
const DOT = 9;
const DAY = 86_400_000;
const time = (date: string) => Date.parse(`${date}T12:00:00Z`);
const shortDate = (date: string) => formatProgressDate(date).replace(/ \d{4}$/, '').replace('.', '');
const signed = (value: number) => `${value > 0 ? '+' : value < 0 ? '−' : ''}${formatKg(Math.abs(value))}`;

type Point = { x: number; y: number };

// Segmento recto como vista rotada: evita sumar una librería nativa de gráficos.
function Segment({ from, to, color, thickness }: { from: Point; to: Point; color: string; thickness: number }) {
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  if (length < 0.5) return null;
  return <View pointerEvents="none" style={{
    position: 'absolute', width: length, height: thickness, backgroundColor: color, borderRadius: thickness,
    left: (from.x + to.x) / 2 - length / 2, top: (from.y + to.y) / 2 - thickness / 2,
    transform: [{ rotate: `${Math.atan2(to.y - from.y, to.x - from.x)}rad` }],
  }} />;
}

function Dashed({ from, to }: { from: Point; to: Point }) {
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  const count = Math.floor(length / 9);
  return <>{Array.from({ length: count }, (_, index) => {
    const a = index / count; const b = Math.min(1, a + 5 / length);
    return <Segment key={index} color={colors.gold} thickness={1.5}
      from={{ x: from.x + (to.x - from.x) * a, y: from.y + (to.y - from.y) * a }}
      to={{ x: from.x + (to.x - from.x) * b, y: from.y + (to.y - from.y) * b }} />;
  })}</>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <View style={styles.stat}>
    <AppText variant="caption" tone="muted">{label}</AppText>
    <AppText variant="strong">{value}</AppText>
  </View>;
}

export function WeightGoalChart({ goal, weights: records, today }: { goal: WeightGoal; weights: { date: string; kg: number }[]; today: string }) {
  const [width, setWidth] = useState(0);
  const summary = weightGoalSummary(goal, records, today);
  const { weights, trend } = summary;
  const end = weights.at(-1) && weights.at(-1)!.date > goal.endDate ? weights.at(-1)!.date : goal.endDate;
  const values = [goal.startKg, goal.targetKg, ...weights.map((record) => record.kg)];
  const low = Math.floor(Math.min(...values) - 0.3);
  const high = Math.ceil(Math.max(...values) + 0.3);
  const span = Math.max(DAY, time(end) - time(goal.startDate));
  const at = (date: string, kg: number): Point => ({
    x: (time(date) - time(goal.startDate)) / span * width,
    y: (high - kg) / (high - low) * HEIGHT,
  });
  const todayX = at(today, low).x;
  const losing = goal.targetKg < goal.startKg;
  const description = [
    `Objetivo de ${formatKg(goal.startKg)} a ${formatKg(goal.targetKg)} kilos entre el ${formatProgressDate(goal.startDate)} y el ${formatProgressDate(goal.endDate)}.`,
    `${weights.length} pesajes; último ${formatKg(summary.currentKg)} kilos.`,
    `Variación ${signed(summary.changeKg)} kilos, avance ${summary.progressPercent} por ciento. La línea ideal marca ${formatKg(summary.idealToday)} kilos hoy.`,
    trend.length ? `Tendencia de 7 días: ${formatKg(Math.round(trend.at(-1)!.kg * 10) / 10)} kilos.` : 'Sin tendencia: se necesitan al menos 3 pesajes.',
  ].join(' ');

  return <View style={styles.block}>
    <View style={styles.stats}>
      <Stat label="Variación" value={`${signed(summary.changeKg)} kg`} />
      <Stat label="Avance" value={`${summary.progressPercent} %`} />
      <Stat label="Ideal hoy" value={`${formatKg(summary.idealToday)} kg`} />
    </View>

    <View style={styles.chart} accessible accessibilityRole="image" accessibilityLabel={description}>
      <View style={styles.yAxis}>
        <AppText variant="caption" tone="muted" style={[styles.tick, { top: -10 }]}>{formatKg(high)}</AppText>
        <AppText variant="caption" tone="muted" style={[styles.tick, { top: HEIGHT - 10 }]}>{formatKg(low)}</AppText>
      </View>
      <View style={styles.plot} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        {width > 0 && <>
          <View style={[styles.grid, { top: 0 }]} /><View style={[styles.grid, { top: HEIGHT / 2 }]} /><View style={[styles.grid, { top: HEIGHT - 1 }]} />
          {todayX > 0 && todayX < width && <View style={[styles.today, { left: todayX }]} />}
          <Dashed from={at(goal.startDate, goal.startKg)} to={at(goal.endDate, goal.targetKg)} />
          {trend.slice(1).map((point, index) => <Segment key={point.date} color={colors.brand} thickness={3}
            from={at(trend[index]!.date, trend[index]!.kg)} to={at(point.date, point.kg)} />)}
          {weights.map((record, index) => {
            const point = at(record.date, record.kg);
            return <View key={record.date} style={[styles.dot, index === weights.length - 1 && styles.lastDot,
              { left: point.x - DOT / 2, top: point.y - DOT / 2 }]} />;
          })}
        </>}
      </View>
    </View>
    <View style={styles.xAxis}>
      <AppText variant="caption" tone="muted">{shortDate(goal.startDate)}</AppText>
      <AppText variant="caption" tone="muted">{shortDate(end)}</AppText>
    </View>

    <View style={styles.legend}>
      <View style={styles.legendItem}><View style={[styles.dot, styles.legendDot]} /><AppText variant="caption" tone="muted">Pesajes</AppText></View>
      <View style={styles.legendItem}><View style={styles.trendKey} /><AppText variant="caption" tone="muted">Tendencia 7 días</AppText></View>
      <View style={styles.legendItem}><View style={styles.idealKey}><View style={styles.dash} /><View style={styles.dash} /></View><AppText variant="caption" tone="muted">Línea ideal</AppText></View>
      <View style={styles.legendItem}><View style={styles.todayKey} /><AppText variant="caption" tone="muted">Hoy</AppText></View>
    </View>

    <AppText variant="caption" tone={summary.comparison === null ? 'muted' : 'brand'}>
      {summary.comparison === null
        ? `Registra al menos ${MIN_WEIGHINS} pesajes para ver la tendencia. Llevas ${weights.length}.`
        : Math.abs(summary.comparison) < 0.2
          ? 'Tu tendencia va en línea con el ritmo ideal.'
          : `Tu tendencia va ${formatKg(Math.abs(summary.comparison))} kg ${summary.comparison > 0 ? 'por delante' : 'por detrás'} del ritmo ideal${losing ? ' de descenso' : ''}.`}
    </AppText>
  </View>;
}

const styles = StyleSheet.create({
  block: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.lg, gap: spacing.md },
  stats: { flexDirection: 'row', gap: spacing.sm },
  stat: { flex: 1, gap: 2 },
  chart: { flexDirection: 'row', gap: spacing.sm },
  yAxis: { width: spacing.xxl, height: HEIGHT },
  tick: { position: 'absolute', right: 0, lineHeight: 20 },
  plot: { flex: 1, height: HEIGHT },
  grid: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: colors.surfaceHigh },
  today: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: colors.line },
  dot: { position: 'absolute', width: DOT, height: DOT, borderRadius: radius.pill, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.brand },
  lastDot: { backgroundColor: colors.brand },
  xAxis: { flexDirection: 'row', justifyContent: 'space-between', marginLeft: spacing.xxl + spacing.sm },
  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.md, rowGap: spacing.xs },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot: { position: 'relative' },
  trendKey: { width: 16, height: 3, borderRadius: 3, backgroundColor: colors.brand },
  idealKey: { width: 16, flexDirection: 'row', justifyContent: 'space-between' },
  dash: { width: 6, height: 1.5, backgroundColor: colors.gold },
  todayKey: { width: 1, height: 12, backgroundColor: colors.line },
});
