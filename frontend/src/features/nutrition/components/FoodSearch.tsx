import { AppPressable } from '../../../components/ui/AppPressable';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Keyboard, StyleSheet, TextInput, View } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import { colors, fontFamily, layout, radius, spacing } from '../../../theme';
import { searchFoods, type Food } from '../domain/food-entry';

export function FoodSearch({ foods, selected, onSelect }: { foods: readonly Food[]; selected: Food; onSelect: (id: string) => void }) {
  const [query, setQuery] = useState(selected.name);
  const [expanded, setExpanded] = useState(false);
  const results = searchFoods(foods, query);
  return (
    <View style={styles.container}>
      <View style={styles.search}>
        <Ionicons name="search-outline" size={21} color={colors.brand} />
        <TextInput accessibilityLabel="Buscar alimento" placeholder="Buscar alimento…" value={query} selectTextOnFocus
          autoCorrect={false} onFocus={() => setExpanded(true)} onChangeText={(value) => { setQuery(value); setExpanded(true); }}
          style={styles.input} placeholderTextColor={colors.muted} selectionColor={colors.brandSoft} cursorColor={colors.brand} />
        <AppPressable accessibilityRole="button" accessibilityLabel="Borrar búsqueda" onPress={() => { setQuery(''); setExpanded(true); }} style={styles.clear}>
          <Ionicons name="close" size={20} color={colors.muted} />
        </AppPressable>
      </View>
      {expanded && <View style={styles.results}>
        <AppText variant="caption" tone="muted">Catálogo de ejemplo · {results.length} resultados</AppText>
        {results.length ? results.map((food) => (
          <AppPressable key={food.id} accessibilityRole="button" accessibilityLabel={`Seleccionar ${food.name}`}
            onPress={() => { onSelect(food.id); setQuery(food.name); setExpanded(false); Keyboard.dismiss(); }} style={styles.result}>
            <AppText variant="strong" style={styles.resultName}>{food.name}</AppText>
            <Ionicons name="chevron-forward" size={18} color={colors.brand} />
          </AppPressable>
        )) : <AppText tone="muted">No encontramos alimentos. Prueba con pollo, palta o marraqueta.</AppText>}
        <AppPressable accessibilityRole="button" onPress={() => { setQuery(selected.name); setExpanded(false); Keyboard.dismiss(); }} style={styles.close}>
          <AppText variant="label" tone="brand">Cerrar búsqueda</AppText>
        </AppPressable>
      </View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  search: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, paddingLeft: spacing.md },
  input: { flex: 1, minWidth: 0, minHeight: layout.touchTarget, paddingVertical: spacing.md, fontFamily: fontFamily.body, fontSize: 14, color: colors.ink },
  clear: { width: layout.touchTarget, height: layout.touchTarget, alignItems: 'center', justifyContent: 'center' },
  results: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  result: { minHeight: layout.touchTarget, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  resultName: { flex: 1 },
  close: { minHeight: layout.touchTarget, justifyContent: 'center', alignSelf: 'flex-start' },
});
