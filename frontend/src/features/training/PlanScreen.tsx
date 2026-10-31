import Ionicons from '@expo/vector-icons/Ionicons';
import { exerciseById, profiles } from '@strongerfit/training-engine';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { AppButton } from '../../components/ui/AppButton';
import { AppDialog } from '../../components/ui/AppDialog';
import { AppPressable } from '../../components/ui/AppPressable';
import { AppText } from '../../components/ui/AppText';
import { Card } from '../../components/ui/Card';
import { colors, layout, radius, spacing } from '../../theme';
import { labels } from '../onboarding/domain/onboarding';
import type { ProfileAction, ProfileData } from '../profile/domain/profile';
import { PlanExerciseEditor } from './components/PlanExerciseEditor';
import { createPlan, estimatedMinutes } from './domain/plan';

type Props = { profile: ProfileData; dispatch: (action: ProfileAction) => void; onStart: (day: number) => void };

export function PlanScreen({ profile, dispatch, onStart }: Props) {
  const plan = profile.trainingPlan;
  const [selected, setSelected] = useState(0);
  const [editing, setEditing] = useState<number | null>(null);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [notice, setNotice] = useState('');
  const generate = () => {
    const next = createPlan(profile, new Date());
    if (next) { dispatch({ type: 'set-training-plan', plan: next }); setSelected(0); setNotice('Rutina generada. Revísala y edítala antes de entrenar.'); }
    setConfirmRegenerate(false);
  };

  if (!plan) return <Screen>
    <Card>
      <AppText variant="heading" accessibilityRole="header">Prepara tu rutina semanal</AppText>
      <AppText tone="muted">Usaremos tus días, minutos, equipamiento y perfil de deportista. Podrás editar cada ejercicio antes de entrenar.</AppText>
      <AppButton label="Generar mi rutina" icon="sparkles-outline" onPress={generate} />
    </Card>
  </Screen>;

  const day = plan.days[Math.min(selected, plan.days.length - 1)]!;
  const profileParams = profiles[plan.input.athleteProfile];
  return <Screen>
    <View style={styles.heading}>
      <AppText variant="title" accessibilityRole="header">Tu plan semanal</AppText>
      <AppText variant="caption" tone="muted">
        {plan.days.length} días · Perfil {labels.athleteProfile[plan.input.athleteProfile].toLowerCase()} · {profileParams.sets[0]} a {profileParams.sets[1]} series
      </AppText>
    </View>

    <View role="tablist" style={styles.days}>
      {plan.days.map((item, index) => <AppPressable key={item.name} role="tab" accessibilityState={{ selected: index === selected }}
        aria-selected={index === selected} accessibilityLabel={`Día ${index + 1}: ${item.name}`} onPress={() => setSelected(index)}
        style={({ pressed }) => [styles.day, index === selected && styles.daySelected, pressed && styles.pressed]}>
        <AppText variant="label" tone={index === selected ? 'white' : 'muted'}>Día {index + 1}</AppText>
      </AppPressable>)}
    </View>

    {plan.warnings.includes('injury-review') && <View style={styles.note}>
      <Ionicons name="medkit-outline" size={20} color={colors.gold} />
      <AppText variant="caption" style={styles.noteText}>Declaraste una lesión activa. Revisa esta rutina con un profesional antes de empezar y omite cualquier ejercicio que cause dolor.</AppText>
    </View>}

    <Card>
      <View style={styles.dayHeader}>
        <View style={styles.dayTitle}>
          <AppText variant="heading">{day.name}</AppText>
          <AppText variant="caption" tone="muted">{day.exercises.length} ejercicios · aprox. {estimatedMinutes(day)} min</AppText>
        </View>
      </View>
      {day.exercises.map((item, index) => {
        const exercise = exerciseById(item.exerciseId)!;
        return <AppPressable key={`${item.exerciseId}-${index}`} accessibilityRole="button" accessibilityHint="Editar ejercicio, series, repeticiones y descanso"
          onPress={() => setEditing(index)} style={({ pressed }) => [styles.exercise, pressed && styles.pressed]}>
          <View style={styles.exerciseText}>
            <AppText variant="caption" tone="muted">{exercise.muscleGroup}</AppText>
            <AppText variant="strong">{exercise.name}</AppText>
            <AppText variant="caption" tone="muted">
              {item.sets} series · {exercise.kind === 'isometric' ? `${item.repsMin}–${item.repsMax} s` : `${item.repsMin}–${item.repsMax} reps`} · {item.restSeconds} s de descanso
            </AppText>
          </View>
          <Ionicons name="create-outline" size={20} color={colors.muted} />
        </AppPressable>;
      })}
      <AppButton label="Iniciar entrenamiento" icon="play-outline" onPress={() => onStart(selected)} />
    </Card>

    {!!notice && <AppText accessibilityLiveRegion="polite" variant="caption" tone="brand">{notice}</AppText>}
    <AppButton label="Regenerar rutina" icon="refresh-outline" variant="secondary" onPress={() => setConfirmRegenerate(true)} />
    <AppText variant="caption" tone="muted">
      Generada con un catálogo inicial de ejercicios, sin imágenes. Series, repeticiones y descansos son de referencia y requieren revisión profesional.
    </AppText>

    <AppDialog title="Editar ejercicio" visible={editing !== null} onClose={() => setEditing(null)}>
      {editing !== null && day.exercises[editing] && <PlanExerciseEditor item={day.exercises[editing]} equipment={plan.input.equipment}
        onCancel={() => setEditing(null)}
        onSave={(exercise) => { dispatch({ type: 'update-plan-exercise', day: selected, index: editing, exercise }); setEditing(null); setNotice('Ejercicio actualizado.'); }} />}
    </AppDialog>

    <AppDialog title="¿Regenerar la rutina?" visible={confirmRegenerate} onClose={() => setConfirmRegenerate(false)}>
      <AppText tone="muted">Se reemplazarán los ejercicios y tus ediciones del plan con los datos actuales de tu perfil. El historial de entrenamientos no cambia.</AppText>
      <AppButton label="Regenerar" icon="refresh-outline" onPress={generate} />
      <AppButton label="Mantener mi rutina" variant="secondary" onPress={() => setConfirmRegenerate(false)} />
    </AppDialog>
  </Screen>;
}

const styles = StyleSheet.create({
  heading: { gap: spacing.xs },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  day: { minHeight: layout.touchTarget, minWidth: 72, paddingHorizontal: spacing.md, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface },
  daySelected: { backgroundColor: colors.brand },
  pressed: { opacity: 0.7 },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.sand },
  noteText: { flex: 1 },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dayTitle: { flex: 1, gap: 2 },
  exercise: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceLow,
    minHeight: layout.touchTarget },
  exerciseText: { flex: 1, gap: 2 },
});
