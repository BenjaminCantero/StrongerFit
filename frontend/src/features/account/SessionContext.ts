import { createContext, useContext } from 'react';

// Persona con sesión. Las rutas protegidas solo se montan con sesión, así que ahí userId existe.
export const SessionContext = createContext<{ userId: string | null }>({ userId: null });

// Para pantallas que existen con y sin sesión (onboarding).
export const useOptionalUserId = (): string | null => useContext(SessionContext).userId;

export function useUserId(): string {
  const { userId } = useContext(SessionContext);
  if (!userId) throw new Error('useUserId se usó fuera de una ruta con sesión.');
  return userId;
}
