import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Screen } from '../../components/Screen';
import { AppButton } from '../../components/ui/AppButton';
import { AppText } from '../../components/ui/AppText';
import { PreviewNotice } from '../../components/ui/PreviewNotice';
import { Card } from '../../components/ui/Card';
import { spacing } from '../../theme';
import { ExerciseCard } from './components/ExerciseCard';
import { ExerciseDetails } from './components/ExerciseDetails';
import { ExerciseTimer } from './components/ExerciseTimer';
import { RestTimer } from './components/RestTimer';
import { SessionControls } from './components/SessionControls';
import { SessionDialog } from './components/SessionDialog';
import { currentTimeLabel, todayDateKey } from '../../shared/calendar';
import { activeSet, sessionRecord, sessionSummary, type SessionState, type SessionTemplate } from './domain/session';
import { TrainingSummaryScreen } from './TrainingSummaryScreen';
import { useTrainingSession } from './useTrainingSession';
import { useTimerAlert } from './timerAlerts';
import { pauseTimer, type TimerRun } from './domain/timers';

type SessionRecord = NonNullable<ReturnType<typeof sessionRecord>>;
type Props = {
  template: SessionTemplate | null;
  sample?: boolean;
  restored?: { sessionId: string; state: SessionState };
  onPersist?: (sessionId: string, state: SessionState) => void;
  onExit: () => void;
  onViewHistory: () => void;
  onRecord: (record: SessionRecord) => void;
};

export function TrainingScreen({ template, ...actions }: Props) {
  const { onExit } = actions;
  if (!template) return (
    <Screen title="Tu entrenamiento" safeBottom>
      <Card>
        <AppText variant="heading">No hay una sesión activa</AppText>
        <AppText tone="muted">Tu sesión aparecerá aquí cuando tengas una rutina preparada.</AppText>
        <AppButton label="Volver a Inicio" onPress={onExit} />
      </Card>
    </Screen>
  );
  return <TrainingSession template={template} {...actions} />;
}

function TrainingSession({ template, sample = false, restored, onPersist, onExit, onViewHistory, onRecord }: Props & { template: SessionTemplate }) {
  const { state, exercise, elapsedSeconds, restSeconds, send } = useTrainingSession(template, restored?.state);
  const [sessionId] = useState(() => restored?.sessionId ?? `session-${Date.now()}`);
  const [timerRun, setTimerRun] = useState<TimerRun | null>(null);
  const [dialog, setDialog] = useState<'details' | 'finish' | 'next' | null>(null);
  const paused = state.status === 'paused';
  const next = state.exercises[state.exerciseIndex + 1];
  const summary = sessionSummary(state);

  function togglePause() {
    const now = Date.now();
    if (!paused) setTimerRun((current) => current?.startedAtMs != null ? pauseTimer(current, now) : current);
    send({ type: 'toggle-pause', now });
  }

  function goToNext() {
    setTimerRun(null);
    send({ type: 'next-exercise' });
  }

  function nextExercise() {
    if (activeSet(exercise)) setDialog('next');
    else goToNext();
  }

  const recorded = state.status === 'finished' && summary.completedSets > 0;
  useTimerAlert(state.status === 'active' ? state.rest.endsAtMs : null, 'Descanso terminado', `Sigue con ${exercise.name}`);

  // Cada cambio de la sesión se guarda como borrador hasta finalizar (RNF-06).
  useEffect(() => { onPersist?.(sessionId, state); }, [onPersist, sessionId, state]);

  useEffect(() => {
    // El id de la sesión evita duplicados si el efecto se repite.
    const record = sessionRecord(state, { id: sessionId, date: todayDateKey(), time: currentTimeLabel() });
    if (record) onRecord(record);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status]);

  if (state.status === 'finished') return (
    <TrainingSummaryScreen
      state={state}
      elapsedSeconds={elapsedSeconds}
      recorded={recorded}
      onGoHome={onExit}
      onViewHistory={onViewHistory}
    />
  );

  return (
    <Screen safeBottom>
      <PreviewNotice local={!sample}>{sample ? 'Vista previa · Sesión de ejemplo y cambios solo en memoria' : 'Se guarda en este dispositivo hasta que finalices la sesión'}</PreviewNotice>
      <SessionControls title={state.title} elapsedSeconds={elapsedSeconds} paused={paused}
        onPause={togglePause} onFinish={() => setDialog('finish')} />
      <ExerciseCard key={exercise.id} exercise={exercise} paused={paused} onDetails={() => setDialog('details')}
        onAddSet={() => send({ type: 'add-set' })}
        onComplete={(setId, weightKg, reps) => send({ type: 'complete-set', exerciseId: exercise.id, setId, weightKg, reps, now: Date.now() })} />
      <ExerciseTimer exercise={exercise} paused={paused} run={timerRun} setRun={setTimerRun} />
      <RestTimer seconds={restSeconds} durationSeconds={state.rest.durationMs / 1000} paused={paused}
        onAdd={() => send({ type: 'add-rest', now: Date.now() })} onSkip={() => send({ type: 'skip-rest' })} />
      {next ? <Card style={styles.nextCard}>
        <AppText variant="label" tone="brand">Siguiente ejercicio</AppText>
        <AppText variant="header">{next.name}</AppText>
        <AppButton label="Ir al siguiente ejercicio" icon="arrow-forward-outline" disabled={paused} onPress={nextExercise} />
      </Card> : <AppButton label="Finalizar entrenamiento" icon="checkmark-circle-outline" onPress={() => setDialog('finish')} />}

      <SessionDialog title={dialog === 'details' ? exercise.name : dialog === 'next' ? '¿Cambiar de ejercicio?' : '¿Finalizar entrenamiento?'}
        visible={dialog !== null} onClose={() => setDialog(null)}>
        {dialog === 'details' ? <ExerciseDetails exercise={exercise} onClose={() => setDialog(null)} />
          : dialog === 'next' ? <>
            <AppText>Quedan series pendientes en este ejercicio. Puedes pasar al siguiente; las series pendientes no se marcarán como completadas.</AppText>
            <AppButton label="Continuar al siguiente" onPress={() => { goToNext(); setDialog(null); }} />
            <AppButton label="Seguir en este ejercicio" variant="secondary" onPress={() => setDialog(null)} />
          </> : <>
            <AppText>Completaste {summary.completedSets} de {summary.totalSets} series. Al finalizar se detendrán los temporizadores.</AppText>
            <AppText tone="muted">La sesión se añadirá al historial de Progreso solo mientras la app esté abierta; aún no se guarda en el dispositivo ni en la nube.</AppText>
            <AppButton label={sample ? 'Finalizar sesión de ejemplo' : 'Finalizar sesión'} onPress={() => { send({ type: 'finish', now: Date.now() }); setDialog(null); }} />
            <AppButton label="Seguir entrenando" variant="secondary" onPress={() => setDialog(null)} />
          </>}
      </SessionDialog>
    </Screen>
  );
}

const styles = StyleSheet.create({
  nextCard: { gap: spacing.sm },
});
