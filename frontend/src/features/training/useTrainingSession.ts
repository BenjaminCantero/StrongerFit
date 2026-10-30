import { useEffect, useReducer, useState } from 'react';
import { createSession, currentExercise, elapsedMs, restRemainingMs, sessionReducer,
  type SessionAction, type SessionTemplate } from './domain/session';

export function useTrainingSession(template: SessionTemplate) {
  const [state, dispatch] = useReducer(sessionReducer, template, (initial) => createSession(initial, Date.now()));
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
