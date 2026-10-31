import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { AppButton } from '../../../components/ui/AppButton';
import { AppDialog } from '../../../components/ui/AppDialog';
import { AppText } from '../../../components/ui/AppText';
import { Card } from '../../../components/ui/Card';
import { FormField } from '../../../components/ui/FormField';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { colors, radius, spacing } from '../../../theme';
import type { SessionExercise } from '../domain/session';
import { defaultInterval, elapsed, endsInMs, pauseTimer, resumeTimer, startTimer, timerPhase, totalMs, validInterval,
  type TimerRun, type TimerSpec } from '../domain/timers';
import { formatDuration } from '../format';
import { useTimerAlert } from '../timerAlerts';

const phaseLabel = { hold: 'Sostén', work: 'Trabajo', rest: 'Descanso', done: 'Terminado' } as const;

type Props = { exercise: SessionExercise; paused: boolean; run: TimerRun | null; setRun: (update: (current: TimerRun | null) => TimerRun | null) => void };

// El estado vive en la sesión: pausarla también pausa este temporizador.
export function ExerciseTimer({ exercise, paused, run, setRun }: Props) {
  const [now, setNow] = useState(Date.now);
  const [configuring, setConfiguring] = useState(false);
  const running = run?.startedAtMs != null;
  const ends = run ? endsInMs(run, now) : null;
  useTimerAlert(ends === null ? null : now + ends, 'Temporizador terminado', exercise.name);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [running]);

  const start = (spec: TimerSpec) => { const at = Date.now(); setNow(at); setRun(() => startTimer(spec, at)); };
  const toggle = () => { const at = Date.now(); setNow(at); setRun((current) => current && (current.startedAtMs === null ? resumeTimer(current, at) : pauseTimer(current, at))); };
  const state = run ? timerPhase(run, now) : null;
  const done = state?.phase === 'done';
  const tempo = exercise.tempo;
  const reps = exercise.sets.find((set) => !set.completed)?.reps;

  return <Card tone="low" style={styles.card}>
    <View style={styles.top}>
      <View style={styles.icon}><Ionicons name="stopwatch-outline" size={21} color={colors.brandStrong} /></View>
      <View style={styles.heading}>
        <AppText variant="label" tone="muted">Temporizador del ejercicio</AppText>
        {state && run ? <>
          <AppText variant="heading" accessibilityLiveRegion="polite">
            {done ? 'Terminado' : `${phaseLabel[state.phase]} · ${formatDuration(Math.ceil(state.remainingMs / 1000))}`}
          </AppText>
          {run.spec.kind === 'interval' && !done && <AppText variant="caption" tone="muted">Ronda {state.round} de {run.spec.rounds}</AppText>}
          {!running && !done && <AppText variant="caption" tone="muted">En pausa</AppText>}
        </> : <AppText variant="heading">{exercise.timer ? `Sostén ${exercise.timer.kind === 'hold' ? exercise.timer.seconds : 0} s` : 'Intervalos opcionales'}</AppText>}
      </View>
    </View>
    {tempo && <AppText variant="caption" tone="muted">
      Tempo {tempo.join('-')}: baja en {tempo[0]} s, pausa {tempo[1]} s y sube en {tempo[2]} s
      {reps ? ` · unos ${reps * (tempo[0] + tempo[1] + tempo[2])} s bajo tensión por serie` : ''}.
    </AppText>}
    {run && <ProgressBar value={totalMs(run.spec) - elapsed(run, now)} target={totalMs(run.spec)} label="Tiempo restante del temporizador" />}
    <View style={styles.actions}>
      {run && !done
        ? <AppButton label={running ? 'Pausar' : 'Reanudar'} icon={running ? 'pause-outline' : 'play-outline'} variant="secondary" disabled={paused} onPress={toggle} style={styles.button} />
        : exercise.timer && <AppButton label={done ? 'Repetir' : 'Iniciar'} icon="play-outline" variant="secondary" disabled={paused}
          onPress={() => start(exercise.timer!)} style={styles.button} />}
      {run ? <AppButton label={done ? 'Cerrar' : 'Detener'} icon={done ? 'close-outline' : 'stop-outline'} variant="secondary" onPress={() => setRun(() => null)} style={styles.button} />
        : <AppButton label="Intervalos" icon="repeat-outline" variant="secondary" disabled={paused} onPress={() => setConfiguring(true)} style={styles.button} />}
    </View>
    <AppText variant="caption" tone="muted">
      {Platform.OS === 'web' ? 'Es una referencia, no una medición.' : 'Al terminar recibirás un aviso, aunque la app esté en segundo plano. Es una referencia, no una medición.'}
    </AppText>

    <AppDialog title="Intervalos" visible={configuring} onClose={() => setConfiguring(false)}>
      <IntervalForm onCancel={() => setConfiguring(false)} onStart={(spec) => { setConfiguring(false); start(spec); }} />
    </AppDialog>
  </Card>;
}

function IntervalForm({ onStart, onCancel }: { onStart: (spec: TimerSpec) => void; onCancel: () => void }) {
  const initial = defaultInterval.kind === 'interval' ? defaultInterval : null!;
  const [form, setForm] = useState({ work: String(initial.workSeconds), rest: String(initial.restSeconds), rounds: String(initial.rounds) });
  const [error, setError] = useState('');
  const field = (name: keyof typeof form) => ({ value: form[name], onChange: (value: string) => { setForm((current) => ({ ...current, [name]: value })); setError(''); } });
  function start() {
    const [work, rest, rounds] = [form.work, form.rest, form.rounds].map((value) => /^\d+$/.test(value.trim()) ? Number(value) : NaN);
    const problem = validInterval(work!, rest!, rounds!);
    if (problem) setError(problem);
    else onStart({ kind: 'interval', workSeconds: work!, restSeconds: rest!, rounds: rounds! });
  }
  return <>
    <View style={styles.row}>
      <View style={styles.cell}><FormField label="Trabajo" unit="s" {...field('work')} keyboardType="number-pad" maxLength={3} /></View>
      <View style={styles.cell}><FormField label="Descanso" unit="s" {...field('rest')} keyboardType="number-pad" maxLength={3} /></View>
    </View>
    <FormField label="Rondas" {...field('rounds')} keyboardType="number-pad" maxLength={2} />
    {!!error && <AppText accessibilityRole="alert" variant="caption" style={styles.error}>{error}</AppText>}
    <AppButton label="Iniciar intervalos" icon="play-outline" onPress={start} />
    <AppButton label="Cancelar" variant="secondary" onPress={onCancel} />
  </>;
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1, gap: 2 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  button: { flex: 1, minWidth: 130 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  cell: { flex: 1, minWidth: 120 },
  error: { color: colors.error },
});
