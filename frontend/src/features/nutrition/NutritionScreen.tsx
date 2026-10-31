import { AppPressable } from '../../components/ui/AppPressable';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { AppButton } from '../../components/ui/AppButton';
import { AppDialog } from '../../components/ui/AppDialog';
import { AppText } from '../../components/ui/AppText';
import { PreviewNotice } from '../../components/ui/PreviewNotice';
import { colors, layout, radius, spacing } from '../../theme';
import { DiaryBalance } from './components/DiaryBalance';
import { DiaryDateSelector } from './components/DiaryDateSelector';
import { DiaryMealCard } from './components/DiaryMealCard';
import { diaryTotals, type DiaryEntry } from './domain/diary';
import type { MealId, Nutrients } from './domain/food-entry';
import { formatDiaryDate, formatKcal, mealLabels } from './presentation';

const meals: MealId[] = ['breakfast', 'lunch', 'snack', 'dinner'];
type Props = {
  date: string; entries: DiaryEntry[]; targets: Nutrients | null; isPreview: boolean;
  onMoveDate: (direction: number) => void; onToday: () => void;
  onAdd: (meal: MealId) => void; onEdit: (entry: DiaryEntry) => void; onDelete: (meal: MealId) => void;
};

export function NutritionScreen({ date, entries, targets, isPreview, onMoveDate, onToday, onAdd, onEdit, onDelete }: Props) {
  const [deleting, setDeleting] = useState<MealId | null>(null);
  const [showPlan, setShowPlan] = useState(false);
  const [notice, setNotice] = useState('');
  const consumed = diaryTotals(entries);
  const deletingTotal = diaryTotals(entries.filter((entry) => entry.meal === deleting));

  function moveDate(direction: number) {
    setNotice('');
    onMoveDate(direction);
  }

  return (
    <Screen>
      <DiaryDateSelector date={date} onPrevious={() => moveDate(-1)} onNext={() => moveDate(1)} onToday={() => { setNotice(''); onToday(); }} />
      {isPreview && <PreviewNotice>Vista previa · Diario de ejemplo y cambios solo en memoria</PreviewNotice>}
      <AppPressable accessibilityRole="button" accessibilityLabel="Abrir minuta semanal" onPress={() => setShowPlan(true)}
        style={({ pressed }) => [styles.plan, pressed && styles.pressed]}>
        <View style={styles.planIcon}><Ionicons name="calendar-outline" size={22} color={colors.brand} /></View>
        <View style={styles.planText}>
          <AppText variant="header">Minuta semanal</AppText>
          <AppText variant="caption" tone="muted">Propuesta de comidas para la semana · Próximamente</AppText>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </AppPressable>
      <DiaryBalance consumed={consumed} targets={targets} />
      {!!notice && <AppText accessibilityLiveRegion="polite" variant="label" tone="brand">{notice}</AppText>}
      {meals.map((meal) => <DiaryMealCard key={`${date}-${meal}`} meal={meal} entries={entries.filter((entry) => entry.meal === meal)}
        onAdd={() => onAdd(meal)} onEdit={onEdit} onDelete={() => setDeleting(meal)} />)}

      <AppDialog title="¿Eliminar registro?" visible={deleting !== null} onClose={() => setDeleting(null)}>
        <Ionicons name="trash-outline" size={32} color={colors.error} />
        <AppText>Se eliminarán los registros de {deleting ? mealLabels[deleting] : ''} del {formatDiaryDate(date).toLowerCase()} ({formatKcal(deletingTotal.kcal)} kcal).</AppText>
        <AppButton label="Sí, eliminar" onPress={() => {
          if (deleting) { onDelete(deleting); setNotice(`Registros de ${mealLabels[deleting]} eliminados.`); }
          setDeleting(null);
        }} style={styles.deleteButton} />
        <AppButton label="Cancelar" variant="secondary" onPress={() => setDeleting(null)} />
      </AppDialog>
      <AppDialog title="Tu minuta semanal" visible={showPlan} onClose={() => setShowPlan(false)}>
        <AppText>Todavía no hay una minuta guardada.</AppText>
        <AppButton label="Volver al diario" onPress={() => setShowPlan(false)} />
      </AppDialog>
    </Screen>
  );
}

const styles = StyleSheet.create({
  plan: { backgroundColor: colors.surfaceLow, borderRadius: radius.md, padding: spacing.lg, minHeight: layout.touchTarget,
    flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  planIcon: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  planText: { flex: 1, gap: spacing.xs },
  pressed: { opacity: 0.8 },
  deleteButton: { backgroundColor: colors.error },
});
