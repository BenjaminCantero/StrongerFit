import Ionicons from '@expo/vector-icons/Ionicons';
import { environmentLabels, exerciseById, programById, weekdayLabels, zoneLabels, type Plan, type PlanChange } from '@strongerfit/training-engine';
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
import { dataErrorMessage, toDataError } from '../../lib/data/errors';
import type { ProfileData } from '../profile/domain/profile';
import { MovementPictogram } from './components/MovementPictogram';
import { PlanExerciseEditor } from './components/PlanExerciseEditor';
import type { SessionDraft } from './domain/draft';
import { createPlan, estimatedMinutes } from './domain/plan';
import { sessionSummary } from './domain/session';
import { useSaveWorkoutPlan, useUpdatePlanExercise } from './useTraining';

const reasons: Record<PlanChange['reason'], string> = { equipment: 'falta equipo', injury: 'zona con lesión declarada', time: 'no cabe en tu duración' };

function changeText(change: PlanChange) {
  const name = exerciseById(change.exerciseId)?.name ?? change.exerciseId;
  return change.action === 'substituted'
    ? `${name} → ${exerciseById(change.replacementId!)?.name ?? change.replacementId} (${reasons[change.reason]})`
    : `${name} quitado (${reasons[change.reason]})`;
}

// Avisos de la generación (RF-05, RF-30, RF-34).
function warningText(plan: Plan, warning: Plan['warnings'][number]) {
  switch (warning) {
    case 'injury-review': return `Quitamos los ejercicios contraindicados para ${plan.input.zones.map((zone) => zoneLabels[zone].toLowerCase()).join(', ')}, sin reemplazarlos. La lista es provisional: revisa la rutina con un profesional y omite lo que cause dolor.`;
    case 'frequency-adjusted': return `Elegiste ${plan.input.days} días; usamos la plantilla de ${plan.days.length} días, la más cercana disponible.`;
    case 'level-adjusted': return 'Para nivel avanzado usamos la plantilla intermedia. Ajusta series y cargas según tu experiencia.';
    case 'environment-fallback': return `Tu equipo no alcanza para la plantilla de ${environmentLabels[plan.input.environment].toLowerCase()}; usamos la de ${environmentLabels[plan.environment].toLowerCase()}.`;
    case 'short-session': return 'Alguna sesión quedó con menos de 3 ejercicios. Revisa tus zonas o tu equipo y regenera la rutina.';
  }
}

type Props = {
  profile: ProfileData; onStart: (day: number) => void;
  draft: SessionDraft | null; onResume: () => void; onDiscard: () => void; onCatalog: () => void; onPrograms: () => void;
};

export function PlanScreen({ profile, onStart, draft, onResume, onDiscard, onCatalog, onPrograms }: Props) {
  const plan = profile.trainingPlan;
  const [selected, setSelected] = useState(0);
  const [editing, setEditing] = useState<number | null>(null);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [notice, setNotice] = useState('');
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const savePlan = useSaveWorkoutPlan();
  const updateExercise = useUpdatePlanExercise();
  const generate = () => {
    const next = createPlan(profile, new Date());
    setConfirmRegenerate(false);
    if (!next) return;
    savePlan.mutate(next, {
      onSuccess: () => { setSelected(0); setNotice('Rutina generada. Revísala y edítala antes de entrenar.'); },
      onError: (error) => setNotice(dataErrorMessage(toDataError(error))),
    });
  };

  if (!plan) return <Screen>
    <Card>
      <AppText variant="heading" accessibilityRole="header">Prepara tu rutina semanal</AppText>
      <AppText tone="muted">Usaremos tus días, minutos, equipamiento y perfil de deportista. Podrás editar cada ejercicio antes de entrenar.</AppText>
      <AppButton label={savePlan.isPending ? 'Generando…' : 'Generar mi rutina'} icon="sparkles-outline" disabled={savePlan.isPending} onPress={generate} />
      {!!notice && <AppText accessibilityRole="alert" variant="caption">{notice}</AppText>}
      <AppButton label="Elegir un programa clásico" icon="barbell-outline" variant="secondary" onPress={onPrograms} />
    </Card>
    <AppButton label="Ver catálogo de ejercicios" icon="library-outline" variant="secondary" onPress={onCatalog} />
  </Screen>;

  const day = plan.days[Math.min(selected, plan.days.length - 1)]!;
  const pending = draft && sessionSummary(draft.state);
  const dayChanges = plan.changes.filter((change) => change.day === Math.min(selected, plan.days.length - 1));
  const program = programById(plan.templateId);
  return <Screen>
    <View style={styles.heading}>
      <AppText variant="title" accessibilityRole="header">{program ? program.name : 'Tu plan semanal'}</AppText>
      <AppText variant="caption" tone="muted">
        {program
          ? `Programa clásico · ${program.perWeek} días por semana${program.perWeek > plan.days.length ? `, alternando ${plan.days.length} sesiones` : ''}`
          : `${plan.days.length} días · ${environmentLabels[plan.environment]} · ${labels.level[plan.input.level]}`}
      </AppText>
    </View>

    <AppPressable accessibilityRole="button" accessibilityLabel="Ver programas clásicos" accessibilityHint="5/3/1, GZCLP, Starting Strength y otros"
      onPress={onPrograms} style={({ pressed }) => [styles.programs, pressed && styles.pressed]}>
      <View style={styles.programsIcons}>
        <MovementPictogram pattern="squat" size={36} tone="inverse" />
        <MovementPictogram pattern="push-h" size={36} tone="inverse" />
        <MovementPictogram pattern="hinge" size={36} tone="inverse" />
      </View>
      <View style={styles.dayTitle}>
        <AppText variant="header" tone="white">{program ? 'Cambiar de programa' : 'Programas clásicos'}</AppText>
        <AppText variant="caption" tone="white">5/3/1, GZCLP, Starting Strength y 7 más</AppText>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.white} />
    </AppPressable>

    {draft && pending && <Card style={styles.resume}>
      <View style={styles.resumeTop}>
        <Ionicons name="play-circle-outline" size={26} color={colors.brand} />
        <View style={styles.dayTitle}>
          <AppText variant="header">Tienes una sesión en curso</AppText>
          <AppText variant="caption" tone="muted">{draft.state.title} · {pending.completedSets} de {pending.totalSets} series completadas</AppText>
        </View>
      </View>
      <AppButton label="Continuar sesión" icon="play-outline" onPress={onResume} />
      <AppButton label="Descartar" variant="secondary" onPress={() => setConfirmDiscard(true)} />
    </Card>}

    <View role="tablist" style={styles.days}>
      {plan.days.map((item, index) => <AppPressable key={item.name} role="tab" accessibilityState={{ selected: index === selected }}
        aria-selected={index === selected} accessibilityLabel={`${weekdayLabels[item.weekday]}: ${item.name}`} onPress={() => setSelected(index)}
        style={({ pressed }) => [styles.day, index === selected && styles.daySelected, pressed && styles.pressed]}>
        <AppText variant="label" tone={index === selected ? 'white' : 'muted'}>{weekdayLabels[item.weekday]?.slice(0, 3)}</AppText>
      </AppPressable>)}
    </View>

    {plan.warnings.map((warning) => <View key={warning} style={styles.note}>
      <Ionicons name={warning === 'injury-review' ? 'medkit-outline' : 'information-circle-outline'} size={20} color={colors.gold} />
      <AppText variant="caption" style={styles.noteText}>{warningText(plan, warning)}</AppText>
    </View>)}

    <Card>
      <View style={styles.dayHeader}>
        <View style={styles.dayTitle}>
          <AppText variant="heading">{weekdayLabels[day.weekday]} · {day.name}</AppText>
          <AppText variant="caption" tone="muted">{day.exercises.length} ejercicios · aprox. {estimatedMinutes(day)} min</AppText>
        </View>
      </View>
      {day.exercises.map((item, index) => {
        const exercise = exerciseById(item.exerciseId)!;
        return <AppPressable key={`${item.exerciseId}-${index}`} accessibilityRole="button" accessibilityHint="Editar ejercicio, series, repeticiones y descanso"
          onPress={() => setEditing(index)} style={({ pressed }) => [styles.exercise, pressed && styles.pressed]}>
          <MovementPictogram pattern={exercise.pattern} />
          <View style={styles.exerciseText}>
            <AppText variant="caption" tone="muted">{exercise.muscleGroup}</AppText>
            <AppText variant="strong">{exercise.name}</AppText>
            <AppText variant="caption" tone="muted">
              {item.sets} series · {exercise.kind === 'isometric' ? `${item.repsMin}–${item.repsMax} s` : `${item.repsMin}–${item.repsMax} reps`} · {item.restSeconds} s de descanso
            </AppText>
            {item.note && <AppText variant="caption" tone="brand">{item.note}</AppText>}
          </View>
          <Ionicons name="create-outline" size={20} color={colors.muted} />
        </AppPressable>;
      })}
      {dayChanges.length > 0 && <View style={styles.changes}>
        <AppText variant="label">{program ? 'Ajustes a tu equipo y lesiones' : 'Cambios respecto de la plantilla'}</AppText>
        {dayChanges.map((change) => <AppText key={`${change.exerciseId}-${change.action}-${change.reason}`} variant="caption" tone="muted">• {changeText(change)}</AppText>)}
      </View>}
      <AppButton label="Iniciar entrenamiento" icon="play-outline" disabled={!day.exercises.length} onPress={() => onStart(selected)} />
    </Card>

    {!!notice && <AppText accessibilityLiveRegion="polite" variant="caption" tone="brand">{notice}</AppText>}
    <AppButton label="Ver catálogo de ejercicios" icon="library-outline" variant="secondary" onPress={onCatalog} />
    <AppButton label={program ? 'Volver a una rutina generada' : 'Regenerar rutina'} icon="refresh-outline" variant="secondary" onPress={() => setConfirmRegenerate(true)} />
    {program ? <AppText variant="caption" tone="muted">
      {program.name} ({plan.templateVersion}), transcripción no oficial adaptada a tu equipo y {plan.input.zones.length ? `a tus zonas con lesión: ${plan.input.zones.map((zone) => zoneLabels[zone].toLowerCase()).join(', ')}` : 'sin zonas con lesión declaradas'}.
      Series, repeticiones y descansos son de referencia y requieren revisión profesional.
    </AppText> : <AppText variant="caption" tone="muted">
      Plantilla {plan.templateId} ({plan.templateVersion}) · reglas {plan.ruleVersion} · {plan.catalogVersion}. Usamos tu entorno, nivel, {plan.input.days} días,
      {' '}{plan.input.minutes} min por sesión y {plan.input.zones.length ? `zonas con lesión: ${plan.input.zones.map((zone) => zoneLabels[zone].toLowerCase()).join(', ')}` : 'ninguna zona con lesión'}.
      Series, repeticiones y descansos son de referencia y requieren revisión profesional.
    </AppText>}

    <AppDialog title="Editar ejercicio" visible={editing !== null} onClose={() => setEditing(null)}>
      {editing !== null && day.exercises[editing] && <PlanExerciseEditor item={day.exercises[editing]} equipment={plan.input.equipment} zones={plan.input.zones}
        onCancel={() => setEditing(null)}
        onSave={(exercise) => {
          const dayId = plan.dayIds[selected];
          if (!dayId) return;
          updateExercise.mutate({ dayId, index: editing, exercise }, {
            onSuccess: () => { setEditing(null); setNotice('Ejercicio actualizado.'); },
            onError: (error) => setNotice(dataErrorMessage(toDataError(error))),
          });
        }} />}
    </AppDialog>

    <AppDialog title="¿Descartar la sesión en curso?" visible={confirmDiscard} onClose={() => setConfirmDiscard(false)}>
      <AppText tone="muted">Las series registradas en esa sesión no se añadirán al historial. Esta acción no se puede deshacer.</AppText>
      <AppButton label="Descartar sesión" icon="trash-outline" variant="danger" onPress={() => { onDiscard(); setConfirmDiscard(false); }} />
      <AppButton label="Mantenerla" variant="secondary" onPress={() => setConfirmDiscard(false)} />
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
  resume: { gap: spacing.md, borderWidth: 1, borderColor: colors.brandMedium },
  resumeTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
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
  programs: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.brand,
    minHeight: layout.touchTarget },
  programsIcons: { flexDirection: 'row', gap: 4 },
  changes: { gap: spacing.xs, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceLow },
});
