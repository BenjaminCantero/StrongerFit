import Ionicons from '@expo/vector-icons/Ionicons';
import {
  CATALOG_SOURCE, CATALOG_VERSION, catalog, difficultyLabels, equipmentLabels, measureLabels, muscleLabels, zoneLabels, type Exercise,
} from '@strongerfit/training-engine';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppButton } from '../../components/ui/AppButton';
import { Screen } from '../../components/Screen';
import { AppPressable } from '../../components/ui/AppPressable';
import { AppText } from '../../components/ui/AppText';
import { Card } from '../../components/ui/Card';
import { colors, layout, radius, spacing } from '../../theme';

function Fact({ label, value }: { label: string; value: string }) {
  return <View style={styles.fact}>
    <AppText variant="caption" tone="muted">{label}</AppText>
    <AppText variant="strong">{value}</AppText>
  </View>;
}

export type ReplaceTarget = { day: number; index: number; label: string };

type Props = {
  exercise: Exercise | undefined; onOpen: (exercise: Exercise) => void;
  // Uso en la rutina (CU-13, paso 5): ejercicios del mismo patrón que se pueden reemplazar.
  targets: ReplaceTarget[]; blocked: string | null; onReplace: (target: ReplaceTarget) => void;
};

// CU-13: ficha con músculos, equipo, dificultad, medición, zonas contraindicadas y descripción.
export function ExerciseDetailScreen({ exercise, onOpen, targets, blocked, onReplace }: Props) {
  const [choosing, setChoosing] = useState(false);
  const [notice, setNotice] = useState('');
  if (!exercise) return <Screen>
    <Card><AppText tone="muted">Este ejercicio no está en el catálogo.</AppText></Card>
  </Screen>;

  const zones = exercise.contraindications;
  const similar = exercise.substitutes.slice(0, 4).map((id) => catalog.find((item) => item.id === id)!);
  return <Screen>
    <View style={styles.heading}>
      <AppText variant="caption" tone="brand">{exercise.muscleGroup}</AppText>
      <AppText variant="title" accessibilityRole="header">{exercise.name}</AppText>
      <AppText tone="muted">{exercise.description}</AppText>
    </View>

    <Card>
      <View style={styles.facts}>
        <Fact label="Dificultad" value={difficultyLabels[exercise.difficulty]} />
        <Fact label="Medición" value={measureLabels[exercise.measure]} />
        <Fact label="Equipo" value={exercise.equipment.map((item) => equipmentLabels[item]).join(' o ')} />
        <Fact label="Músculo principal" value={muscleLabels[exercise.primary]} />
      </View>
      {exercise.secondary.length > 0 && <Fact label="Músculos secundarios" value={exercise.secondary.map((muscle) => muscleLabels[muscle]).join(', ')} />}
    </Card>

    <View style={styles.note}>
      <Ionicons name="medkit-outline" size={20} color={colors.gold} />
      <View style={styles.noteText}>
        <AppText variant="strong">Zonas contraindicadas</AppText>
        <AppText variant="caption">
          {zones === 'none-validated' ? 'Sin contraindicaciones validadas.' : zones.map((zone) => zoneLabels[zone]).join(', ')}
        </AppText>
        <AppText variant="caption" tone="muted">Lista provisional pendiente de revisión profesional. Si sientes dolor, detén el ejercicio y consulta a un profesional.</AppText>
      </View>
    </View>

    <Card>
      <AppText variant="header" accessibilityRole="header">Usar en mi rutina</AppText>
      {blocked ? <AppText variant="caption" tone="muted">{blocked}</AppText>
        : !targets.length ? <AppText variant="caption" tone="muted">Tu rutina no tiene ejercicios del mismo patrón para reemplazar.</AppText>
        : !choosing ? <AppButton label="Reemplazar un ejercicio de mi rutina" icon="swap-horizontal-outline" variant="secondary" onPress={() => { setChoosing(true); setNotice(''); }} />
        : <>
          <AppText variant="caption" tone="muted">Elige cuál reemplazar. Se conservan sus series, repeticiones y descanso.</AppText>
          {targets.map((target) => <AppButton key={`${target.day}-${target.index}`} label={target.label} variant="secondary"
            onPress={() => { onReplace(target); setChoosing(false); setNotice(`Listo: ${exercise.name} reemplaza a ${target.label}.`); }} />)}
          <AppButton label="Cancelar" variant="ghost" onPress={() => setChoosing(false)} />
        </>}
      {!!notice && <AppText variant="caption" tone="brand" accessibilityLiveRegion="polite">{notice}</AppText>}
    </Card>

    {similar.length > 0 && <View style={styles.similar}>
      <AppText variant="header" accessibilityRole="header">Ejercicios del mismo patrón</AppText>
      {similar.map((item) => <AppPressable key={item.id} accessibilityRole="button" accessibilityHint="Abrir ficha del ejercicio"
        onPress={() => onOpen(item)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        <View style={styles.rowText}>
          <AppText variant="strong">{item.name}</AppText>
          <AppText variant="caption" tone="muted">{item.equipment.map((equipment) => equipmentLabels[equipment]).join(' o ')} · {difficultyLabels[item.difficulty]}</AppText>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.brand} />
      </AppPressable>)}
    </View>}

    <AppText variant="caption" tone="muted">
      Procedencia: {CATALOG_SOURCE.source.toLowerCase()} · licencia {CATALOG_SOURCE.license.toLowerCase()} · {CATALOG_VERSION} ({CATALOG_SOURCE.date}).
    </AppText>
  </Screen>;
}

const styles = StyleSheet.create({
  heading: { gap: spacing.xs },
  facts: { flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.md },
  fact: { flexBasis: '50%', flexGrow: 1, gap: 2, paddingRight: spacing.sm },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.sand },
  noteText: { flex: 1, gap: spacing.xs },
  similar: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceLow,
    minHeight: layout.touchTarget },
  rowText: { flex: 1, gap: 2 },
  pressed: { opacity: 0.7 },
});
