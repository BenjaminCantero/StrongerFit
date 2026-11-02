import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppButton } from '../../../components/ui/AppButton';
import { AppText } from '../../../components/ui/AppText';
import { FormField } from '../../../components/ui/FormField';
import { colors, radius, spacing } from '../../../theme';
import { formatWeight } from '../format';

export type OverloadSuggestion = { exerciseId: string; name: string; currentKg: number; suggestedKg: number; step: number };
export type OverloadDecision = { exerciseId: string; suggestedKg: number; appliedKg: number | null; decision: 'applied' | 'modified' | 'ignored' | 'undone' };

type Status = { kind: 'pending' } | { kind: 'editing'; value: string; error?: string } | { kind: 'applied'; kg: number } | { kind: 'ignored' };

// RF-33, CU-14: la sugerencia nunca se aplica sola; se aplica, modifica o ignora, y se puede deshacer.
function SuggestionRow({ suggestion, onDecide }: { suggestion: OverloadSuggestion; onDecide: (decision: OverloadDecision) => void }) {
  const [status, setStatus] = useState<Status>({ kind: 'pending' });
  const decide = (decision: OverloadDecision['decision'], appliedKg: number | null) =>
    onDecide({ exerciseId: suggestion.exerciseId, suggestedKg: suggestion.suggestedKg, appliedKg, decision });

  function saveModified(value: string) {
    const kg = Number(value.trim().replace(',', '.'));
    if (!/^\d{1,3}(?:[.,]\d{1,2})?$/.test(value.trim()) || kg <= 0) {
      setStatus({ kind: 'editing', value, error: 'Ingresa una carga mayor que 0 kg.' });
      return;
    }
    decide('modified', kg);
    setStatus({ kind: 'applied', kg });
  }

  return <View style={styles.row}>
    <AppText variant="strong">{suggestion.name}</AppText>
    <AppText variant="caption" tone="muted">
      Completaste todas las series en el máximo del rango con {formatWeight(suggestion.currentKg)} kg. Sugerimos {formatWeight(suggestion.suggestedKg)} kg para la próxima sesión.
    </AppText>
    {status.kind === 'pending' && <View style={styles.actions}>
      <AppButton label={`Aplicar ${formatWeight(suggestion.suggestedKg)} kg`} icon="trending-up-outline"
        onPress={() => { decide('applied', suggestion.suggestedKg); setStatus({ kind: 'applied', kg: suggestion.suggestedKg }); }} />
      <AppButton label="Modificar" variant="secondary" onPress={() => setStatus({ kind: 'editing', value: String(suggestion.suggestedKg).replace('.', ',') })} />
      <AppButton label="Ignorar" variant="ghost" onPress={() => { decide('ignored', null); setStatus({ kind: 'ignored' }); }} />
    </View>}
    {status.kind === 'editing' && <View style={styles.actions}>
      <FormField label="Carga para la próxima sesión" unit="kg" value={status.value} error={status.error} keyboardType="decimal-pad" maxLength={6}
        onChange={(value) => setStatus({ kind: 'editing', value })} />
      <AppButton label="Guardar carga" icon="checkmark-outline" onPress={() => saveModified(status.value)} />
      <AppButton label="Cancelar" variant="secondary" onPress={() => setStatus({ kind: 'pending' })} />
    </View>}
    {status.kind === 'applied' && <View style={styles.applied} accessibilityLiveRegion="polite">
      <Ionicons name="checkmark-circle" size={18} color={colors.brand} />
      <AppText variant="caption" style={styles.flex}>Aplicada: {formatWeight(status.kg)} kg en tu próxima sesión.</AppText>
      <AppButton label="Deshacer" variant="ghost" onPress={() => { decide('undone', null); setStatus({ kind: 'pending' }); }} />
    </View>}
    {status.kind === 'ignored' && <AppText variant="caption" tone="muted" accessibilityLiveRegion="polite">Mantendremos tu carga actual.</AppText>}
  </View>;
}

export function OverloadSuggestions({ suggestions, onDecide }: { suggestions: OverloadSuggestion[]; onDecide: (decision: OverloadDecision) => void }) {
  if (!suggestions.length) return null;
  return <View style={styles.container}>
    <View style={styles.title}>
      <Ionicons name="trending-up" size={20} color={colors.brand} />
      <AppText variant="header">{suggestions.length === 1 ? 'Sugerencia de carga' : 'Sugerencias de carga'}</AppText>
    </View>
    {suggestions.map((suggestion) => <SuggestionRow key={suggestion.exerciseId} suggestion={suggestion} onDecide={onDecide} />)}
    <AppText variant="caption" tone="muted">Escalones de referencia (2,5 kg; 5 kg en máquinas) pendientes de validar con un entrenador.</AppText>
  </View>;
}

const styles = StyleSheet.create({
  container: { gap: spacing.md, padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.brandSoft },
  title: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  row: { gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.white },
  actions: { gap: spacing.sm },
  applied: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
});
