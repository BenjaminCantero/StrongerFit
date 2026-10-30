import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, type ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppButton } from '../../../components/ui/AppButton';
import { AppText } from '../../../components/ui/AppText';
import { Card } from '../../../components/ui/Card';
import { colors, radius, spacing } from '../../../theme';
import { diaryTotals, type DiaryEntry } from '../domain/diary';
import type { MealId } from '../domain/food-entry';
import { formatGrams, formatKcal, mealLabels } from '../presentation';

const mealIcons: Record<MealId, ComponentProps<typeof Ionicons>['name']> = {
  breakfast: 'sunny-outline', lunch: 'restaurant-outline', snack: 'cafe-outline', dinner: 'moon-outline',
};

export function DiaryMealCard({ meal, entries, onAdd, onEdit, onDelete }: {
  meal: MealId; entries: DiaryEntry[]; onAdd: () => void; onEdit: (entry: DiaryEntry) => void; onDelete: () => void;
}) {
  const [choosing, setChoosing] = useState(false);
  const total = diaryTotals(entries);

  function edit() {
    if (entries.length === 1) onEdit(entries[0]!);
    else setChoosing((value) => !value);
  }

  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <View style={styles.icon}><Ionicons name={mealIcons[meal]} size={22} color={meal === 'lunch' ? colors.gold : colors.brand} /></View>
        <View style={styles.heading}>
          <AppText variant="header" accessibilityRole="header">{mealLabels[meal]}</AppText>
          <AppText variant="caption" tone="muted">{entries.length ? `${entries.length} ${entries.length === 1 ? 'registro' : 'registros'}` : 'Aún sin registros'}</AppText>
        </View>
        <View style={styles.total}>
          <AppText variant="header">{formatKcal(total.kcal)}</AppText>
          <AppText variant="caption" tone="muted">kcal</AppText>
        </View>
      </View>
      {entries.length ? <>
        <View style={styles.items}>
          {entries.flatMap((entry) => entry.items.map((item, index) => (
            <View key={`${entry.id}-${index}`} style={styles.item}>
              <View style={styles.dot} />
              <View style={styles.itemName}>
                <AppText>{item.name}</AppText>
                <AppText variant="caption" tone="muted">{formatGrams(item.grams)} g</AppText>
              </View>
              <AppText variant="label">{formatKcal(item.nutrients.kcal)} kcal</AppText>
            </View>
          )))}
        </View>
        <View style={styles.actions}>
          <AppButton label="Editar" icon="create-outline" variant="secondary" onPress={edit} style={styles.action} />
          <AppButton label="Eliminar" icon="trash-outline" variant="danger" onPress={onDelete} style={styles.action} />
        </View>
        {choosing && <View style={styles.chooser}>
          <AppText variant="label">Elige el registro que quieres editar</AppText>
          {entries.map((entry) => <AppButton key={entry.id} label={entry.items.map((item) => item.name).join(', ')}
            variant="ghost" onPress={() => { setChoosing(false); onEdit(entry); }} />)}
        </View>}
      </> : <View style={styles.empty}>
        <Ionicons name={meal === 'dinner' ? 'moon-outline' : 'leaf-outline'} size={23} color={colors.muted} />
        <AppText variant="caption" tone="muted" style={styles.emptyText}>Los alimentos que registres en {mealLabels[meal].toLowerCase()} aparecerán aquí.</AppText>
      </View>}
      <AppButton label={entries.length ? 'Añadir alimento' : `Registrar ${mealLabels[meal]}`} icon="add-outline" variant="secondary" onPress={onAdd} style={styles.add} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.lg, gap: spacing.md },
  top: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  icon: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1, minWidth: 105 },
  total: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  items: { paddingHorizontal: spacing.md, backgroundColor: colors.canvas, borderRadius: radius.md },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.surfaceHigh },
  itemName: { flex: 1 },
  dot: { width: 5, height: 5, borderRadius: radius.pill, backgroundColor: colors.brand },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  action: { flex: 1, minWidth: 130, borderRadius: radius.sm },
  add: { borderRadius: radius.sm, backgroundColor: colors.canvas },
  empty: { alignItems: 'center', padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.surfaceLow, gap: spacing.sm },
  emptyText: { textAlign: 'center' },
  chooser: { backgroundColor: colors.canvas, borderRadius: radius.md, padding: spacing.sm, gap: spacing.sm },
});
