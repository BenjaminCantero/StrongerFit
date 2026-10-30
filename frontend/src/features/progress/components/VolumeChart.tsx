import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import { Card } from '../../../components/ui/Card';
import { colors, radius, spacing } from '../../../theme';
import type { Period, VolumePoint } from '../domain/progress';
import { formatKg, formatPercent } from '../presentation';

export function VolumeChart({ points, totalKg, changePercent, period }: {
  points: VolumePoint[]; totalKg: number; changePercent: number | null; period: Period;
}) {
  const [width, setWidth] = useState(0);
  const { fontScale } = useWindowDimensions();
  const maximum = Math.max(...points.map((point) => point.kg), 1);
  const columnWidth = Math.max((period === '1y' ? 52 : 44) * fontScale, (width - spacing.sm * (points.length - 1)) / points.length);
  const overflow = columnWidth * points.length + spacing.sm * (points.length - 1) > width + 1;
  return <Card tone="low">
    <View style={styles.heading}>
      <View style={styles.title}>
        <AppText variant="header" accessibilityRole="header">Volumen total movilizado</AppText>
        <AppText variant="caption" tone="muted">Carga acumulada en series completadas (kg)</AppText>
      </View>
      <Ionicons name="bar-chart-outline" size={24} color={colors.brand} />
    </View>
    <View style={styles.chart} onLayout={(event) => setWidth(event.nativeEvent.layout.width - spacing.md * 2)}>
      <ScrollView horizontal showsHorizontalScrollIndicator={overflow} contentContainerStyle={styles.plot}>
        {points.map((point) => <View key={point.from} accessible
          accessibilityLabel={`${point.label}: ${formatKg(point.kg)} kilogramos${point.current ? ', período en curso' : ''}`}
          style={[styles.column, { width: columnWidth }]}>
          <AppText variant="label" tone={point.current ? 'brand' : 'muted'} style={styles.center}>{formatKg(point.kg)}</AppText>
          <View style={styles.barArea}>
            <View style={[styles.bar, { height: point.kg > 0 ? Math.max(2, point.kg / maximum * 130) : 0,
              backgroundColor: point.current ? colors.brand : colors.brandMedium }]} />
          </View>
          <AppText variant="caption" tone={point.current ? 'brand' : 'muted'} style={styles.center}>{point.label}</AppText>
        </View>)}
      </ScrollView>
    </View>
    {overflow && <AppText variant="caption" tone="muted">Desliza el gráfico para ver todos los meses o semanas.</AppText>}
    <View style={styles.legend}>
      <View style={styles.current}><View style={styles.dot} /><AppText variant="caption" tone="muted">{period === '4w' ? 'Semana' : 'Mes'} en curso</AppText></View>
      {changePercent !== null && <AppText variant="label" tone="brand">{changePercent > 0 ? '+' : ''}{formatPercent(changePercent)}% respecto al inicio</AppText>}
    </View>
    <AppText variant="caption" tone="muted">Total del período: {formatKg(totalKg)} kg. El volumen es una referencia, no una meta que debas aumentar cada semana.</AppText>
    {totalKg === 0 && <AppText tone="muted">Aún no hay volumen registrado en este período.</AppText>}
  </Card>;
}

const styles = StyleSheet.create({
  heading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1, gap: spacing.xs },
  chart: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.md },
  plot: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, paddingBottom: spacing.sm },
  column: { gap: spacing.sm },
  center: { textAlign: 'center' },
  barArea: { height: 130, justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: 34, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderWidth: 1, borderColor: colors.brand },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'space-between' },
  current: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: colors.brand },
});
