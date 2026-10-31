import { exerciseById, swapOptions, validateExercise, type Equipment, type PlannedExercise } from '@strongerfit/training-engine';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppButton } from '../../../components/ui/AppButton';
import { AppText } from '../../../components/ui/AppText';
import { ChoiceChips } from '../../../components/ui/ChoiceChips';
import { FormField } from '../../../components/ui/FormField';
import { colors, spacing } from '../../../theme';

type Props = { item: PlannedExercise; equipment: Equipment[]; onSave: (item: PlannedExercise) => void; onCancel: () => void };

export function PlanExerciseEditor({ item, equipment, onSave, onCancel }: Props) {
  const [exerciseId, setExerciseId] = useState(item.exerciseId);
  const [form, setForm] = useState({ sets: String(item.sets), repsMin: String(item.repsMin), repsMax: String(item.repsMax), rest: String(item.restSeconds) });
  const [error, setError] = useState('');
  const swaps = swapOptions(item, equipment);
  const options = Object.fromEntries([exerciseById(item.exerciseId)!, ...swaps].map((exercise) => [exercise.id, exercise.name]));
  const field = (name: keyof typeof form) => ({ value: form[name], onChange: (value: string) => { setForm((current) => ({ ...current, [name]: value })); setError(''); } });

  function save() {
    const next = { exerciseId, sets: Number(form.sets), repsMin: Number(form.repsMin), repsMax: Number(form.repsMax), restSeconds: Number(form.rest) };
    const problem = Object.values(form).some((value) => !/^\d+$/.test(value.trim())) ? 'Usa solo números enteros.' : validateExercise(next, equipment);
    if (problem) setError(problem);
    else onSave(next);
  }

  return <>
    {swaps.length > 0
      ? <ChoiceChips label="Ejercicio (mismo patrón y tu equipamiento)" options={options} value={exerciseId} onChange={setExerciseId} />
      : <AppText tone="muted">No hay alternativas con tu equipamiento para este movimiento.</AppText>}
    <View style={styles.row}>
      <View style={styles.cell}><FormField label="Series" {...field('sets')} keyboardType="number-pad" maxLength={1} /></View>
      <View style={styles.cell}><FormField label="Descanso" unit="s" {...field('rest')} keyboardType="number-pad" maxLength={3} /></View>
    </View>
    <View style={styles.row}>
      <View style={styles.cell}><FormField label="Repeticiones mín." {...field('repsMin')} keyboardType="number-pad" maxLength={2} /></View>
      <View style={styles.cell}><FormField label="Repeticiones máx." {...field('repsMax')} keyboardType="number-pad" maxLength={2} /></View>
    </View>
    {!!error && <AppText accessibilityRole="alert" variant="caption" style={styles.error}>{error}</AppText>}
    <AppButton label="Guardar cambios" icon="checkmark-outline" onPress={save} />
    <AppButton label="Cancelar" variant="secondary" onPress={onCancel} />
  </>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  cell: { flex: 1, minWidth: 120 },
  error: { color: colors.error },
});
