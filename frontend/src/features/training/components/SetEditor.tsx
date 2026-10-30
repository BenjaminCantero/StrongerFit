import { AppPressable } from '../../../components/ui/AppPressable';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { StyleSheet, TextInput, View, useWindowDimensions } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import { colors, fontFamily, layout, radius, spacing } from '../../../theme';
import { parseSetInput, type PerformedSet } from '../domain/session';

function NumericField({ label, value, onChange, step, minimum, disabled }: {
  label: string; value: string; onChange: (value: string) => void; step: number; minimum: number; disabled: boolean;
}) {
  function adjust(delta: number) {
    const parsed = Number(value.replace(',', '.'));
    const next = Math.max(minimum, Math.round(((Number.isFinite(parsed) ? parsed : minimum) + delta) * 100) / 100);
    onChange(String(next).replace('.', ','));
  }
  return (
    <View style={styles.field}>
      <AppPressable accessibilityRole="button" accessibilityLabel={`Disminuir ${label}`} disabled={disabled}
        onPress={() => adjust(-step)} style={({ pressed }) => [styles.step, pressed && styles.pressed]}>
        <Ionicons name="remove" size={16} color={colors.muted} />
      </AppPressable>
      <TextInput accessibilityLabel={label} value={value} onChangeText={onChange}
        editable={!disabled} keyboardType={step === 1 ? 'number-pad' : 'decimal-pad'} selectTextOnFocus
        maxLength={7} underlineColorAndroid="transparent" style={styles.input} />
      <AppPressable accessibilityRole="button" accessibilityLabel={`Aumentar ${label}`} disabled={disabled}
        onPress={() => adjust(step)} style={({ pressed }) => [styles.step, pressed && styles.pressed]}>
        <Ionicons name="add" size={16} color={colors.muted} />
      </AppPressable>
    </View>
  );
}

export function SetEditor({ set, disabled, onComplete }: {
  set: PerformedSet; disabled: boolean; onComplete: (weightKg: number, reps: number) => void;
}) {
  const [weight, setWeight] = useState(String(set.weightKg).replace('.', ','));
  const [reps, setReps] = useState(String(set.reps));
  const [error, setError] = useState<string | null>(null);
  const { width, fontScale } = useWindowDimensions();
  const compact = width < 480 || fontScale > 1.15;

  function complete() {
    const parsed = parseSetInput(weight, reps);
    if (!parsed) {
      setError('Ingresa una carga de 0 kg o más y repeticiones enteras mayores que 0.');
      return;
    }
    setError(null);
    onComplete(parsed.weightKg, parsed.reps);
  }

  return (
    <View style={styles.container}>
      <AppText variant="label" tone="brand">Actual · Serie {set.id}</AppText>
      <View style={[styles.row, compact && styles.compact]}>
        <View style={compact && styles.fieldRow}>
          {compact && <AppText variant="label" style={styles.fieldLabel}>Carga (kg)</AppText>}
          <NumericField label="Carga en kg" value={weight} onChange={setWeight} step={1.25} minimum={0} disabled={disabled} />
        </View>
        <View style={compact && styles.fieldRow}>
          {compact && <AppText variant="label" style={styles.fieldLabel}>Reps</AppText>}
          <NumericField label="Repeticiones" value={reps} onChange={setReps} step={1} minimum={1} disabled={disabled} />
        </View>
        <AppPressable accessibilityRole="button" accessibilityLabel={`Completar serie ${set.id}`}
          accessibilityState={{ disabled }} disabled={disabled} onPress={complete}
          style={({ pressed }) => [styles.complete, compact && styles.wide, (pressed || disabled) && styles.pressed]}>
          <Ionicons name="checkmark" size={24} color={colors.white} />
          {compact && <AppText variant="strong" tone="white">Completar serie</AppText>}
        </AppPressable>
      </View>
      {error && <AppText accessibilityRole="alert" variant="caption" style={styles.error}>{error}</AppText>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.canvas, padding: spacing.xs, borderRadius: radius.md, gap: spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.xs },
  compact: { flexDirection: 'column', alignItems: 'stretch', gap: spacing.sm },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  fieldLabel: { flex: 1 },
  field: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceLow, borderRadius: radius.sm },
  step: { minWidth: layout.touchTarget, minHeight: layout.touchTarget, alignItems: 'center', justifyContent: 'center' },
  input: { width: 64, minHeight: layout.touchTarget, paddingHorizontal: 0, textAlign: 'center', color: colors.ink,
    fontFamily: fontFamily.bold, fontSize: 15, fontVariant: ['tabular-nums'] },
  complete: { width: layout.touchTarget, minHeight: layout.touchTarget, backgroundColor: colors.brand,
    borderRadius: radius.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  wide: { width: '100%' },
  pressed: { opacity: 0.6 },
  error: { color: colors.error },
});
