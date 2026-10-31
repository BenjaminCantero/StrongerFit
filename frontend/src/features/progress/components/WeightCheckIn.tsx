import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef, useState } from 'react';
import { Keyboard, StyleSheet, TextInput, View } from 'react-native';
import { AppButton } from '../../../components/ui/AppButton';
import { AppPressable } from '../../../components/ui/AppPressable';
import { AppText } from '../../../components/ui/AppText';
import { Card } from '../../../components/ui/Card';
import { colors, fontFamily, layout, radius, spacing } from '../../../theme';
import type { WeightGoal } from '../../onboarding/domain/onboarding';
import { parseWeight, type WeightRecord } from '../domain/progress';
import { formatKg, formatProgressDate } from '../presentation';
import { WeightGoalChart } from './WeightGoalChart';

const CHART = 88;

// Puntos por fecha y línea de meta; sin librería de gráficos para no sumar dependencias nativas.
function WeightTrend({ weights, targetKg }: { weights: WeightRecord[]; targetKg: number | null }) {
  const points = weights.slice(-8);
  const values = [...points.map((point) => point.kg), ...(targetKg === null ? [] : [targetKg])];
  const low = Math.min(...values) - 0.5;
  const high = Math.max(...values) + 0.5;
  const y = (kg: number) => (kg - low) / (high - low) * CHART;
  return <View style={styles.chart} accessible
    accessibilityLabel={`Pesos del período: ${points.map((point) => `${formatKg(point.kg)} kilos el ${formatProgressDate(point.date)}`).join('; ')}${targetKg === null ? '' : `. Meta ${formatKg(targetKg)} kilos`}`}>
    <View style={styles.plot}>
      {targetKg !== null && <View style={[styles.goal, { bottom: y(targetKg) }]}>
        <AppText variant="caption" tone="brand" style={styles.goalLabel}>Meta {formatKg(targetKg)}</AppText>
      </View>}
      {points.map((point, index) => <View key={point.date} style={styles.column}>
        <View style={[styles.stem, { height: y(point.kg) }]} />
        <View style={[styles.dot, index === points.length - 1 && styles.lastDot, { bottom: y(point.kg) - 5 }]} />
      </View>)}
    </View>
    <View style={styles.axis}>
      {points.map((point) => <AppText key={point.date} variant="caption" tone="muted" style={styles.axisLabel}>
        {formatProgressDate(point.date).replace(/ \d{4}$/, '').replace('.', '')}
      </AppText>)}
    </View>
  </View>;
}

export function WeightCheckIn({ record, weights, allWeights, goal, today, onSave }: {
  record: WeightRecord | null; weights: WeightRecord[]; allWeights: WeightRecord[]; goal: WeightGoal | null; today: string; onSave: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const input = useRef<TextInput>(null);
  const change = weights.length > 1 ? Math.round((weights.at(-1)!.kg - weights[0]!.kg) * 10) / 10 : null;

  function close() { setEditing(false); setError(''); Keyboard.dismiss(); }
  function save() {
    if (parseWeight(value) === null) { setError('Ingresa un peso mayor que 0, con hasta tres cifras enteras y dos decimales.'); input.current?.focus(); return; }
    onSave(value);
    close();
    setNotice('Peso anotado en esta vista. Se conserva solo mientras la app está abierta.');
  }

  return <Card tone="low">
    <View style={styles.top}>
      <View style={styles.heading}>
        <AppText variant="header" accessibilityRole="header">Peso corporal</AppText>
        <AppText variant="metric">{record ? formatKg(record.kg) : '—'}<AppText variant="caption" tone="muted"> kg</AppText></AppText>
        <AppText variant="caption" tone="muted">{record ? `Último registro: ${formatProgressDate(record.date)}` : 'Sin registros en este período'}</AppText>
        {goal && <AppText variant="label" tone="brand">Meta {formatKg(goal.targetKg)} kg · hasta el {formatProgressDate(goal.endDate)}</AppText>}
      </View>
      {!goal && change !== null && <View style={styles.change}>
        <Ionicons name={change > 0 ? 'arrow-up' : change < 0 ? 'arrow-down' : 'remove'} size={14} color={colors.brandText} />
        <AppText variant="label" tone="brand">{formatKg(Math.abs(change))} kg en el período</AppText>
      </View>}
    </View>
    {goal ? <WeightGoalChart goal={goal} weights={allWeights} today={today} />
      : weights.length > 1 && <WeightTrend weights={weights} targetKg={null} />}
    <AppButton label={record?.date === today ? 'Editar peso de hoy' : 'Registrar peso hoy'} icon="add-outline" variant="secondary"
      onPress={() => { setValue(record?.date === today ? String(record.kg).replace('.', ',') : ''); setNotice(''); setEditing(true); }} />
    <View style={styles.note}>
      <Ionicons name="leaf-outline" size={18} color={colors.gold} />
      <AppText variant="caption" tone="muted" style={styles.noteText}>El peso fluctúa día a día. Mira la tendencia; no resume tu fuerza, constancia ni bienestar.</AppText>
    </View>
    {editing && <View style={styles.editor}>
      <View style={styles.editorTop}>
        <AppText variant="label" style={styles.editorTitle}>Ingresa tu peso de hoy</AppText>
        <AppPressable accessibilityRole="button" accessibilityLabel="Cancelar registro de peso" onPress={close} style={styles.close}>
          <Ionicons name="close" size={22} color={colors.muted} />
        </AppPressable>
      </View>
      <View style={styles.row}>
        <TextInput ref={input} accessibilityLabel="Peso de hoy en kilogramos" accessibilityHint="Por ejemplo, 71 coma 4."
          value={value} onChangeText={(text) => { setValue(text); setError(''); }} keyboardType="decimal-pad" maxLength={6}
          placeholder="Ej: 71,4" placeholderTextColor={colors.muted} selectionColor={colors.brandSoft}
          underlineColorAndroid="transparent" onSubmitEditing={save} style={styles.input} />
        <AppText variant="label" tone="muted">kg</AppText>
      </View>
      {!!error && <AppText accessibilityRole="alert" variant="caption" style={styles.error}>{error}</AppText>}
      <AppButton label="Guardar peso en esta vista" icon="checkmark-outline" onPress={save} />
    </View>}
    {!!notice && <AppText accessibilityLiveRegion="polite" variant="caption" tone="brand">{notice}</AppText>}
  </Card>;
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.md },
  heading: { flex: 1, minWidth: 160, gap: spacing.xs },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  change: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.brandSoft },
  chart: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.lg, gap: spacing.sm },
  plot: { height: CHART, flexDirection: 'row', alignItems: 'flex-end' },
  column: { flex: 1, height: CHART, alignItems: 'center', justifyContent: 'flex-end' },
  stem: { width: 2, backgroundColor: colors.brandSoft },
  dot: { position: 'absolute', width: 10, height: 10, borderRadius: radius.pill, backgroundColor: colors.brandMedium, borderWidth: 2, borderColor: colors.brand },
  lastDot: { backgroundColor: colors.brand },
  goal: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1, borderStyle: 'dashed', borderColor: colors.brand },
  goalLabel: { position: 'absolute', right: 0, top: -18 },
  axis: { flexDirection: 'row' },
  axisLabel: { flex: 1, textAlign: 'center' },
  noteText: { flex: 1 },
  editor: { backgroundColor: colors.white, padding: spacing.md, borderRadius: radius.md, gap: spacing.md },
  editorTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  editorTitle: { flex: 1 },
  close: { width: layout.touchTarget, height: layout.touchTarget, justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: { flex: 1, minHeight: layout.touchTarget, padding: spacing.md, borderRadius: radius.sm, fontFamily: fontFamily.body,
    fontSize: 16, color: colors.ink, backgroundColor: colors.surfaceLow },
  error: { color: colors.error },
});
