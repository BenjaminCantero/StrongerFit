import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useProfile } from '../features/profile/useProfile';
import { TrainingScreen } from '../features/training/TrainingScreen';
import { sessionPreview } from '../features/training/data/session.preview';
import type { SessionDraft } from '../features/training/domain/draft';
import { sessionFromDay } from '../features/training/domain/plan';
import { sessionSummary, type SessionState } from '../features/training/domain/session';
import { sessionPayload } from '../features/training/data/training.mappers';
import { usePendingSession } from '../features/training/usePendingSession';
import { loadSessionDraft, persistSessionDraft } from '../features/training/useSessionDraft';
import { useRecordLoadDecision, useSaveTimerPreset, useTimerPresets, useTrainingHistory } from '../features/training/useTraining';
import { isUuid } from '../lib/data/ids';
import { todayDateKey } from '../shared/calendar';
import { colors } from '../theme';

export default function SessionRoute() {
  const router = useRouter();
  const { day, preview, resume } = useLocalSearchParams<{ day?: string; preview?: string; resume?: string }>();
  const { profile } = useProfile();
  const history = useTrainingHistory();
  const decide = useRecordLoadDecision();
  const timers = useTimerPresets();
  const saveTimer = useSaveTimerPreset();
  const { submit } = usePendingSession();
  const [draft, setDraft] = useState<SessionDraft | null | undefined>(undefined);
  const requested: SessionDraft['source'] = __DEV__ && preview === 'sample' ? { kind: 'sample' } : { kind: 'plan', day: Number(day) || 0 };

  // Retoma el borrador si se pide o si es de la misma sesión (p. ej. tras reabrir la app);
  // abrir otra sesión lo reemplaza.
  useEffect(() => {
    loadSessionDraft().then((saved) => {
      const same = saved && JSON.stringify(saved.source) === JSON.stringify(requested);
      setDraft(saved && (resume || same) ? saved : null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resume, day, preview]);

  const source: SessionDraft['source'] = draft?.source ?? requested;
  const persist = useCallback((sessionId: string, state: SessionState) => persistSessionDraft(sessionId, source, state),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [source.kind, source.kind === 'plan' ? source.day : -1]);

  // Sin historial todavía no se arma la sesión: las cargas dependen de él (BR-22). Sin
  // conexión la consulta queda en pausa y se entrena sin historial en vez de esperar.
  if (draft === undefined || (history.isPending && history.fetchStatus !== 'paused')) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas }}>
    <ActivityIndicator color={colors.brand} accessibilityLabel="Recuperando tu sesión" />
  </View>;

  const workouts = history.data?.workouts ?? [];
  const sample = source.kind === 'sample';
  const plan = profile.trainingPlan;
  const planDay = source.kind === 'plan' ? plan?.days[source.day] : undefined;
  // La sesión de ejemplo con historial solo existe en desarrollo.
  const template = sample ? (__DEV__ ? sessionPreview : null)
    : planDay ? sessionFromDay(planDay, workouts, todayDateKey(), profile.nextLoads) : null;
  return <TrainingScreen template={template} sample={sample} onPersist={persist} previous={workouts}
    restored={draft ? { sessionId: draft.sessionId, state: draft.state } : undefined}
    onExit={() => router.navigate('/')} onViewHistory={() => router.navigate('/progress')}
    zones={profile.onboarding?.zones ?? []}
    onLoadDecision={sample ? undefined : (decision) => decide.mutate(decision)}
    // Recordar el intervalo es una comodidad: si falla, no se interrumpe la sesión.
    timerPresets={timers.data}
    onTimerPreset={sample ? undefined : (exerciseId, restSeconds, spec) => saveTimer.mutate({ exerciseId, restSeconds, spec })}
    onRecord={(record, state) => {
      if (sample) return;
      // El plan de ejemplo de desarrollo no tiene ids reales: la sesión se envía sin vínculo.
      const stored = plan && isUuid(plan.id) ? plan : null;
      const dayIndex = source.kind === 'plan' ? source.day : -1;
      submit({
        title: state.title, ...sessionSummary(state),
        payload: sessionPayload(state, { clientId: record.id, planId: stored?.id ?? null, dayId: stored?.dayIds[dayIndex] ?? null, finishedAt: new Date() }),
      });
    }} />;
}
