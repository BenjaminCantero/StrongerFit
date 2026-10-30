import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Screen } from '../../components/Screen';
import { AppButton } from '../../components/ui/AppButton';
import { AppText } from '../../components/ui/AppText';
import { Card } from '../../components/ui/Card';
import { colors, layout, spacing } from '../../theme';
import { FoodSearch } from './components/FoodSearch';
import { FoodSummary } from './components/FoodSummary';
import { FoodSuggestions } from './components/FoodSuggestions';
import { MealSelector } from './components/MealSelector';
import { NutrientBreakdown } from './components/NutrientBreakdown';
import { QuantityCard } from './components/QuantityCard';
import { canConfirm, type Food, type FoodEntry, type InitialFoodDraft } from './domain/food-entry';
import { mealLabels } from './presentation';
import { useFoodEntry } from './useFoodEntry';

type Props = { foods: readonly Food[]; initial?: InitialFoodDraft; onExit: () => void; onSave: (entry: FoodEntry) => void };

export function FoodRegistrationScreen({ foods, initial, onExit, onSave }: Props) {
  if (!foods.length) return (
    <Screen title="Alimentación" safeBottom>
      <Card>
        <AppText variant="heading">El catálogo aún no está disponible</AppText>
        <AppText tone="muted">Aquí podrás buscar alimentos y registrar tus comidas cuando haya datos disponibles.</AppText>
        <AppButton label="Volver a Alimentación" onPress={onExit} />
      </Card>
    </Screen>
  );
  return <FoodEntryPanel foods={foods} initial={initial} onExit={onExit} onSave={onSave} />;
}

function FoodEntryPanel({ foods, initial, onExit, onSave }: Props) {
  const { state, food, totals, suggestions, send, confirm } = useFoodEntry(foods, initial);
  const { draft } = state;

  return (
    <View style={styles.screen}>
      <Screen>
        <AppText variant="caption" tone="muted">Vista previa de alimentos · Datos de ejemplo</AppText>
        <FoodSearch foods={foods} selected={food} onSelect={(foodId) => send({ type: 'select-food', foodId })} />
        <MealSelector selected={draft.meal} onSelect={(meal) => send({ type: 'select-meal', meal })} />
        <FoodSummary food={food} />
        <QuantityCard food={food} draft={draft} onMode={(mode) => send({ type: 'set-mode', mode })}
          onQuantity={(value) => send({ type: 'set-quantity', value })} onKey={(key) => send({ type: 'key', key })}
          onAdjust={(delta) => send({ type: 'adjust-grams', delta })} onReset={() => send({ type: 'reset-quantity' })} />
        <NutrientBreakdown nutrients={totals} meal={draft.meal} />
        <Card style={styles.note}>
          <Ionicons name="information-circle-outline" size={20} color={colors.muted} />
          <AppText variant="caption" tone="muted" style={styles.noteText}>Valores ilustrativos para revisar el diseño. Las porciones y los nutrientes dependen de los datos del alimento; este catálogo todavía no tiene fuentes verificadas.</AppText>
        </Card>
        <FoodSuggestions foods={suggestions} selectedIds={draft.sideIds} onToggle={(foodId) => send({ type: 'toggle-side', foodId })} />
      </Screen>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.footer}>
        <View style={styles.footerContent}>
          <AppButton label={`Confirmar y registrar en ${mealLabels[draft.meal]}`} icon="checkmark-circle-outline"
            disabled={!canConfirm(state)} onPress={() => { const entry = confirm(); if (entry) onSave(entry); }} style={styles.confirm} />
          <AppButton label="Cancelar y volver a Alimentación" variant="ghost" onPress={onExit} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.canvas },
  footer: { backgroundColor: colors.canvas, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.surfaceHigh },
  footerContent: { width: '100%', maxWidth: layout.contentWidth, alignSelf: 'center', padding: spacing.lg, gap: spacing.xs },
  confirm: { backgroundColor: colors.brandStrong },
  note: { flexDirection: 'row', alignItems: 'flex-start', padding: spacing.lg, gap: spacing.sm },
  noteText: { flex: 1 },
});
