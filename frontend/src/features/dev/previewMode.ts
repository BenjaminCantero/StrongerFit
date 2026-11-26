import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';

// Datos de ejemplo solo en desarrollo y solo si se activan en Conexión de desarrollo (SY-04).
// No se guarda: al reiniciar la app vuelve a datos reales.
const previewStore = createStore<{ enabled: boolean }>()(() => ({ enabled: false }));

export const usePreviewMode = () => useStore(previewStore, (state) => __DEV__ && state.enabled);
export const setPreviewMode = (enabled: boolean) => previewStore.setState({ enabled });
