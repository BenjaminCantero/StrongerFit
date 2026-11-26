import type { ComponentType } from 'react';

// En producción la ruta está protegida; no redirige para no crear un bucle si '/' tampoco está disponible.
function Unavailable() {
  return null;
}

// En producción Metro descarta la rama `__DEV__`: la pantalla de desarrollo no entra al bundle.
const DevStatus: ComponentType = __DEV__
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- import condicional para excluirlo del bundle
  ? (require('../features/dev/DevStatusScreen') as typeof import('../features/dev/DevStatusScreen')).DevStatusScreen
  : Unavailable;

export default DevStatus;
