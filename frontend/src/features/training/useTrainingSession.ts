import { useEffect, useReducer, useState } from 'react';
import { createSession, currentExercise, elapsedMs, restRemainingMs, sessionReducer,
  type SessionAction, type SessionState, type SessionTemplate } from './domain/session';

// `restored` retoma un borrador guardado; sus marcas de tiempo son absolutas.
export function useTrainingSession(template: SessionTemplate, restored?: SessionState) {
  const [state, dispatch] = useReducer(sessionReducer, template, (initial) => restored ?? createSession(initial, Date.now()));
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (state.status !== 'active') return;
    // El intervalo refresca la vista; el tiempo se calcula con marcas absolutas.
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [state.status]);

  function send(action: SessionAction) {
    setNow(Date.now());
    dispatch(action);
  }

  return {
    state,
    exercise: currentExercise(state),
    elapsedSeconds: Math.floor(elapsedMs(state, now) / 1000),
    restSeconds: Math.ceil(restRemainingMs(state, now) / 1000),
    send,
  };
}
