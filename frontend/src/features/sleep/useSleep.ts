import { useStore } from 'zustand';
import { readValue, writeValue } from '../../storage/keyValue';
import { devPreview } from '../dev/devPreview';
import { createEmptySleep } from './domain/sleep';
import { createSleepStore } from './state/sleep-store';

const PENDING_KEY = 'sleep-pending-bed';

// Registros en memoria como el resto de la app. Solo la hora de acostarse pendiente se guarda
// en el teléfono: la app suele cerrarse durante la noche y no debe perderse.
export const sleepStore = createSleepStore(devPreview()?.createSleepPreview() ?? createEmptySleep());

readValue(PENDING_KEY).then((at) => { if (at) sleepStore.getState().dispatch({ type: 'restore-pending', at }); }).catch(() => undefined);
sleepStore.subscribe((state, previous) => {
  if (state.pendingBed !== previous.pendingBed) writeValue(PENDING_KEY, state.pendingBed).catch(() => undefined);
});

export function useSleep() {
  return useStore(sleepStore);
}

export function resetSleep() {
  sleepStore.setState(createEmptySleep());
}
