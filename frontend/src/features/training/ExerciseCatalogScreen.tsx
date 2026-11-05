import Ionicons from '@expo/vector-icons/Ionicons';
import {
  catalog, difficultyLabels, equipmentLabels, muscleLabels, searchExercises,
  type Difficulty, type Equipment, type Exercise, type ExerciseFilters, type Muscle,
} from '@strongerfit/training-engine';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { AppPressable } from '../../components/ui/AppPressable';
import { AppText } from '../../components/ui/AppText';
import { ChoiceChips } from '../../components/ui/ChoiceChips';
import { MovementPictogram } from './components/MovementPictogram';
import { colors, fontFamily, layout, radius, spacing } from '../../theme';

const toggle = <T,>(current: T | null | undefined, value: T) => current === value ? null : value;

// RF-04, CU-13: búsqueda por nombre y filtros por músculo principal, equipo y dificultad.
export function ExerciseCatalogScreen({ onOpen }: { onOpen: (exercise: Exercise) => void }) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<ExerciseFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const results = searchExercises(query, filters);
  const active = [filters.muscle, filters.equipment, filters.difficulty].filter(Boolean).length;

  return <Screen>
    <View style={styles.heading}>
      <AppText variant="title" accessibilityRole="header">Catálogo de ejercicios</AppText>
      <AppText variant="caption" tone="muted">{catalog.length} ejercicios propios con pictogramas del patrón de movimiento. Contenido pendiente de revisión profesional.</AppText>
    </View>

    <View style={styles.search}>
      <Ionicons name="search-outline" size={21} color={colors.brand} />
      <TextInput accessibilityLabel="Buscar ejercicio" placeholder="Buscar por nombre…" value={query} onChangeText={setQuery}
        autoCorrect={false} style={styles.input} placeholderTextColor={colors.muted} selectionColor={colors.brandSoft} cursorColor={colors.brand} />
      {!!query && <AppPressable accessibilityRole="button" accessibilityLabel="Borrar búsqueda" onPress={() => setQuery('')} style={styles.iconButton}>
        <Ionicons name="close" size={20} color={colors.muted} />
      </AppPressable>}
    </View>

    <View style={styles.filterBar}>
      <AppPressable accessibilityRole="button" accessibilityState={{ expanded: showFilters }} onPress={() => setShowFilters((value) => !value)}
        style={({ pressed }) => [styles.filterToggle, active > 0 && styles.filterToggleActive, pressed && styles.pressed]}>
        <Ionicons name="options-outline" size={18} color={active ? colors.white : colors.ink} />
        <AppText variant="label" tone={active ? 'white' : 'default'}>{active ? `Filtros (${active})` : 'Filtros'}</AppText>
      </AppPressable>
      {active > 0 && <AppPressable accessibilityRole="button" onPress={() => setFilters({})} style={styles.clearFilters}>
        <AppText variant="label" tone="brand">Quitar filtros</AppText>
      </AppPressable>}
    </View>

    {showFilters && <View style={styles.filters}>
      <ChoiceChips<Muscle> label="Músculo principal" options={muscleLabels} value={filters.muscle ?? null}
        onChange={(muscle) => setFilters((current) => ({ ...current, muscle: toggle(current.muscle, muscle) }))} />
      <ChoiceChips<Equipment> label="Equipo" options={equipmentLabels} value={filters.equipment ?? null}
        onChange={(equipment) => setFilters((current) => ({ ...current, equipment: toggle(current.equipment, equipment) }))} />
      <ChoiceChips<Difficulty> label="Dificultad" options={difficultyLabels} value={filters.difficulty ?? null}
        onChange={(difficulty) => setFilters((current) => ({ ...current, difficulty: toggle(current.difficulty, difficulty) }))} />
    </View>}

    <View style={styles.results}>
      <AppText variant="caption" tone="muted" accessibilityLiveRegion="polite">
        {results.length === 1 ? '1 resultado' : `${results.length} resultados`}
      </AppText>
      {results.length ? results.map((exercise) => <AppPressable key={exercise.id} accessibilityRole="button"
        accessibilityLabel={`${exercise.name}, ${exercise.muscleGroup}, ${difficultyLabels[exercise.difficulty]}`} accessibilityHint="Abrir ficha del ejercicio"
        onPress={() => onOpen(exercise)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        <MovementPictogram pattern={exercise.pattern} />
        <View style={styles.rowText}>
          <AppText variant="strong">{exercise.name}</AppText>
          <AppText variant="caption" tone="muted">
            {exercise.muscleGroup} · {exercise.equipment.map((item) => equipmentLabels[item]).join(' o ')} · {difficultyLabels[exercise.difficulty]}
          </AppText>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.brand} />
      </AppPressable>) : <View style={styles.empty}>
        <AppText tone="muted">No encontramos ejercicios con esa búsqueda.</AppText>
        {(active > 0 || !!query) && <AppPressable accessibilityRole="button" onPress={() => { setFilters({}); setQuery(''); }} style={styles.clearFilters}>
          <AppText variant="label" tone="brand">Quitar búsqueda y filtros</AppText>
        </AppPressable>}
      </View>}
    </View>
  </Screen>;
}

const styles = StyleSheet.create({
  heading: { gap: spacing.xs },
  search: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, paddingLeft: spacing.md },
  input: { flex: 1, minWidth: 0, minHeight: layout.touchTarget, paddingVertical: spacing.md, fontFamily: fontFamily.body, fontSize: 14, color: colors.ink },
  iconButton: { width: layout.touchTarget, height: layout.touchTarget, alignItems: 'center', justifyContent: 'center' },
  filterBar: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.md, marginTop: -spacing.sm },
  filterToggle: { minHeight: layout.touchTarget, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.lg,
    borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.surfaceHigh },
  filterToggleActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  clearFilters: { minHeight: layout.touchTarget, justifyContent: 'center' },
  filters: { gap: spacing.lg, padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.white },
  results: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceLow,
    minHeight: layout.touchTarget },
  rowText: { flex: 1, gap: 2 },
  empty: { gap: spacing.xs, padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.surfaceLow },
  pressed: { opacity: 0.7 },
});
