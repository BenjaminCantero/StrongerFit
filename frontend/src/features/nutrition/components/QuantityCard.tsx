import { AppPressable } from '../../../components/ui/AppPressable';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, TextInput, View } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import { Card } from '../../../components/ui/Card';
import { colors, fontFamily, layout, radius, spacing } from '../../../theme';
import type { Food, FoodDraft, QuantityMode } from '../domain/food-entry';
import { formatGrams } from '../presentation';

type Props = {
  food: Food; draft: FoodDraft;
  onMode: (mode: QuantityMode) => void;
  onQuantity: (value: string) => void;
  onKey: (key: string) => void;
  onAdjust: (delta: number) => void;
  onReset: () => void;
};

export function QuantityCard({ food, draft, onMode, onQuantity, onKey, onAdjust, onReset }: Props) {
  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <AppText variant="label" tone="muted">Cantidad a consumir</AppText>
        <AppPressable accessibilityRole="button" accessibilityLabel="Borrar cantidad" onPress={() => onKey('clear')} style={styles.clear}>
          <Ionicons name="close-circle-outline" size={21} color={colors.muted} />
        </AppPressable>
      </View>
      <View style={styles.modes} role="radiogroup" accessibilityLabel="Unidad de cantidad">
        {(['grams', 'portions'] as const).map((mode) => (
          <AppPressable key={mode} accessibilityRole="radio" accessibilityLabel={mode === 'grams' ? 'Gramos' : 'Porciones'}
            accessibilityState={{ checked: draft.mode === mode }} aria-checked={draft.mode === mode} onPress={() => onMode(mode)}
            style={[styles.mode, draft.mode === mode && styles.selectedMode]}>
            <AppText variant="label" tone={draft.mode === mode ? 'brand' : 'muted'} style={styles.center}>
              {mode === 'grams' ? 'Gramos (g)' : `Porciones (${food.servingGrams} g)`}
            </AppText>
          </AppPressable>
        ))}
      </View>
      <View style={styles.amount}>
        <TextInput accessibilityLabel="Cantidad a consumir" value={draft.quantity} onChangeText={onQuantity}
          keyboardType="decimal-pad" showSoftInputOnFocus={false} selectTextOnFocus maxLength={10}
          placeholder="0" placeholderTextColor={colors.muted} selectionColor={colors.brandSoft} cursorColor={colors.brand} underlineColorAndroid="transparent"
          style={[styles.input, draft.quantity.length > 6 && styles.longInput]} />
        <AppText variant="heading" tone="brand">{draft.mode === 'grams' ? 'g' : 'porciones'}</AppText>
      </View>
      <AppText variant="caption" tone="muted" style={styles.center}>
        {draft.grams !== null && draft.grams > 0 ? `Equivale a ${formatGrams(draft.grams)} g` : 'Usa una cantidad mayor que 0, con hasta 6 decimales.'}
      </AppText>
      <View style={styles.steps}>
        {[-25, -10, 0, 10, 25].map((delta) => (
          <AppPressable key={delta} accessibilityRole="button"
            accessibilityLabel={delta === 0 ? `Restablecer ${food.defaultGrams} gramos` : `${delta > 0 ? 'Sumar' : 'Restar'} ${Math.abs(delta)} gramos`}
            onPress={delta === 0 ? onReset : () => onAdjust(delta)}
            style={({ pressed }) => [styles.step, delta === 0 && styles.standard, pressed && styles.pressed]}>
            <AppText variant="label" style={styles.center}>{delta === 0 ? `${food.defaultGrams} g` : `${delta > 0 ? '+' : '−'}${Math.abs(delta)} g`}</AppText>
          </AppPressable>
        ))}
      </View>
      <View style={styles.keypad}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', 'backspace'].map((key) => (
          <AppPressable key={key} accessibilityRole="button" accessibilityLabel={key === 'backspace' ? 'Borrar último dígito' : key === ',' ? 'Separador decimal' : `Introducir ${key}`}
            onPress={() => onKey(key)} style={({ pressed }) => [styles.key, pressed && styles.pressed]}>
            {key === 'backspace' ? <Ionicons name="backspace-outline" size={21} color={colors.muted} /> : <AppText variant="strong">{key}</AppText>}
          </AppPressable>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg, backgroundColor: colors.white, gap: spacing.md },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  clear: { width: layout.touchTarget, height: layout.touchTarget, alignItems: 'center', justifyContent: 'center' },
  modes: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.sm, padding: spacing.xs, gap: spacing.xs },
  mode: { flex: 1, minHeight: layout.touchTarget, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm, borderRadius: radius.sm },
  selectedMode: { backgroundColor: colors.white },
  center: { textAlign: 'center' },
  amount: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: spacing.sm },
  input: { width: 150, minHeight: 74, fontFamily: fontFamily.heading, fontSize: 48, color: colors.ink, textAlign: 'right', paddingVertical: spacing.sm },
  longInput: { fontSize: 30 },
  steps: { flexDirection: 'row', gap: spacing.xs },
  step: { flex: 1, minWidth: layout.touchTarget, minHeight: layout.touchTarget, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.surfaceLow },
  standard: { backgroundColor: colors.brandSoft },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.sm },
  key: { width: '31%', minHeight: layout.touchTarget, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderRadius: radius.md },
  pressed: { opacity: 0.6 },
});
