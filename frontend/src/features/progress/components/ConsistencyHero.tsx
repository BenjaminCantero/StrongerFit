import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import { colors, radius, spacing } from '../../../theme';
import type { ConsistencyCell } from '../domain/progress';
import { formatKg, formatProgressDate } from '../presentation';

const weekLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const hours = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 1 });
const stateLabels = { done: 'entrenaste', missed: 'sesión no realizada', empty: 'sin sesión', outside: '' };

type Props = {
  completed: number; planned: number; adherence: number | null; from: string; through: string;
  unit: 'day' | 'week'; cells: ConsistencyCell[]; totalKg: number; totalMinutes: number;
};

function Cell({ cell, unit, max }: { cell: ConsistencyCell; unit: 'day' | 'week'; max: number }) {
  const strength = cell.state === 'done' ? (unit === 'day' ? 1 : 0.45 + 0.55 * Math.min(1, cell.sessions / max)) : 0;
  const label = cell.state === 'outside' ? undefined : unit === 'day'
    ? `${formatProgressDate(cell.key)}: ${stateLabels[cell.state]}`
    : `Semana del ${formatProgressDate(cell.key)}: ${cell.sessions} ${cell.sessions === 1 ? 'sesión' : 'sesiones'}`;
  return <View accessible={!!label} accessibilityLabel={label}
    style={[unit === 'day' ? styles.day : styles.week, cell.state === 'outside' && styles.outside,
      cell.state === 'missed' && styles.missed, strength > 0 && { backgroundColor: colors.brandMedium, opacity: strength }]} />;
}

export function ConsistencyHero({ completed, planned, adherence, from, through, unit, cells, totalKg, totalMinutes }: Props) {
  const max = Math.max(1, ...cells.map((cell) => cell.sessions));
  return <View style={styles.card}>
    <View style={styles.top}>
      <View style={styles.heading}>
        <AppText variant="label" style={styles.soft}>Constancia</AppText>
        <AppText variant="metric" tone="white">{completed}<AppText variant="body" style={styles.soft}> de {planned} sesiones</AppText></AppText>
      </View>
      {adherence !== null && <View style={styles.ring} accessible accessibilityLabel={`${adherence} por ciento de adherencia`}>
        <AppText variant="heading" tone="white">{adherence}%</AppText>
        <AppText variant="caption" style={styles.soft}>adherencia</AppText>
      </View>}
    </View>

    <View style={styles.map}>
      {unit === 'day' && <View style={styles.row}>{weekLabels.map((label, index) =>
        <AppText key={index} variant="caption" style={[styles.soft, styles.columnLabel]}>{label}</AppText>)}</View>}
      {unit === 'day'
        ? Array.from({ length: cells.length / 7 }, (_, row) => <View key={row} style={styles.row}>
          {cells.slice(row * 7, row * 7 + 7).map((cell) => <Cell key={cell.key} cell={cell} unit={unit} max={max} />)}
        </View>)
        : <View style={styles.weeks}>{cells.map((cell) => <Cell key={cell.key} cell={cell} unit={unit} max={max} />)}</View>}
      <View style={styles.legend}>
        <View style={styles.legendItem}><View style={[styles.swatch, { backgroundColor: colors.brandMedium }]} /><AppText variant="caption" style={styles.soft}>{unit === 'day' ? 'Entrenaste' : 'Más sesiones, más intenso'}</AppText></View>
        <View style={styles.legendItem}><View style={[styles.swatch, styles.missed]} /><AppText variant="caption" style={styles.soft}>No realizada</AppText></View>
      </View>
    </View>

    <View style={styles.stats}>
      <View style={styles.stat}><AppText variant="strong" tone="white">{formatKg(totalKg)} kg</AppText><AppText variant="caption" style={styles.soft}>Volumen</AppText></View>
      <View style={styles.divider} />
      <View style={styles.stat}><AppText variant="strong" tone="white">{hours.format(totalMinutes / 60)} h</AppText><AppText variant="caption" style={styles.soft}>Entrenadas</AppText></View>
      <View style={styles.divider} />
      <View style={styles.stat}><AppText variant="strong" tone="white">{completed ? Math.round(totalMinutes / completed) : 0} min</AppText><AppText variant="caption" style={styles.soft}>Por sesión</AppText></View>
    </View>
    <AppText variant="caption" style={styles.soft}>{formatProgressDate(from)} — {formatProgressDate(through)}</AppText>
  </View>;
}

const cell = { borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.08)' };
const styles = StyleSheet.create({
  card: { backgroundColor: colors.brandStrong, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.lg },
  top: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  heading: { flex: 1, minWidth: 150 },
  soft: { color: colors.brandMedium },
  ring: { width: 86, height: 86, borderRadius: radius.pill, borderWidth: 3, borderColor: colors.brandMedium, alignItems: 'center', justifyContent: 'center' },
  map: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.xs },
  columnLabel: { flex: 1, textAlign: 'center' },
  day: { ...cell, flex: 1, aspectRatio: 1 },
  weeks: { flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  week: { ...cell, width: 18, height: 18, borderRadius: 4 },
  outside: { backgroundColor: 'rgba(255,255,255,0.03)' },
  missed: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.goldBar },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  stats: { flexDirection: 'row', alignItems: 'center', paddingTop: spacing.lg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.25)' },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  divider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.25)' },
});
