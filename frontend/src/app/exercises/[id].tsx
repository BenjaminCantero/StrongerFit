import { contraindicated, exerciseById, weekdayLabels } from '@strongerfit/training-engine';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ExerciseDetailScreen } from '../../features/training/ExerciseDetailScreen';
import { useProfile } from '../../features/profile/useProfile';
import { useUpdatePlanExercise } from '../../features/training/useTraining';

export default function ExerciseDetailRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useProfile();
  const update = useUpdatePlanExercise();
  const exercise = exerciseById(id);
  const plan = profile.trainingPlan;
  const zones = profile.onboarding?.zones ?? [];
  const owned = new Set(['bodyweight', ...(plan?.input.equipment ?? [])]);
  // Contraindicado para una zona declarada: se avisa y no se agrega (CU-13, flujo alternativo).
  const blocked = !exercise ? null : !plan ? 'Genera tu rutina en Entrenar para poder usar este ejercicio.'
    : contraindicated(exercise, zones) ? 'Está contraindicado para una zona con lesión que declaraste, así que no lo agregamos a tu rutina.'
    : !exercise.equipment.some((item) => owned.has(item)) ? 'Requiere equipo que no declaraste.' : null;
  const targets = !exercise || !plan ? [] : plan.days.flatMap((day, dayIndex) => day.exercises.flatMap((item, index) => {
    const current = exerciseById(item.exerciseId);
    const sameMeasure = (current?.kind === 'isometric') === (exercise.kind === 'isometric');
    return current && current.id !== exercise.id && current.pattern === exercise.pattern && sameMeasure
      ? [{ day: dayIndex, index, label: `${current.name} (${weekdayLabels[day.weekday] ?? day.name})` }] : [];
  }));
  return <ExerciseDetailScreen exercise={exercise} targets={targets} blocked={blocked}
    onOpen={(next) => router.push({ pathname: '/exercises/[id]', params: { id: next.id } })}
    onReplace={(target) => {
      const item = plan?.days[target.day]?.exercises[target.index];
      const dayId = plan?.dayIds[target.day];
      if (item && exercise && dayId) update.mutate({ dayId, index: target.index, exercise: { ...item, exerciseId: exercise.id } });
    }} />;
}
