import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { progressStore } from '../features/progress/useProgress';
import { useProfile } from '../features/profile/useProfile';
import { TrainingScreen } from '../features/training/TrainingScreen';
import { sessionPreview } from '../features/training/data/session.preview';
import type { SessionDraft } from '../features/training/domain/draft';
import { sessionFromDay } from '../features/training/domain/plan';
import type { SessionState } from '../features/training/domain/session';
import { loadSessionDraft, persistSessionDraft } from '../features/training/useSessionDraft';
import { todayDateKey } from '../shared/calendar';
import { colors } from '../theme';

export default function SessionRoute() {
  const router = useRouter();
  const { day, preview, resume } = useLocalSearchParams<{ day?: string; preview?: string; resume?: string }>();
  const { profile } = useProfile();
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

  if (draft === undefined) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas }}>
    <ActivityIndicator color={colors.brand} accessibilityLabel="Recuperando tu sesión" />
  </View>;

  const sample = source.kind === 'sample';
  const planDay = source.kind === 'plan' ? profile.trainingPlan?.days[source.day] : undefined;
  // La sesión de ejemplo con historial solo existe en desarrollo.
  const template = sample ? (__DEV__ ? sessionPreview : null) : planDay ? sessionFromDay(planDay, progressStore.getState().workouts, todayDateKey()) : null;
  return <TrainingScreen template={template} sample={sample} onPersist={persist} previous={progressStore.getState().workouts}
    restored={draft ? { sessionId: draft.sessionId, state: draft.state } : undefined}
    onExit={() => router.navigate('/')} onViewHistory={() => router.navigate('/progress')}
    onRecord={(record) => progressStore.getState().dispatch({ type: 'record-workout', record })} />;
}
