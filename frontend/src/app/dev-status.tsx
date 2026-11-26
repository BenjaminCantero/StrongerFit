import { Redirect } from 'expo-router';
import type { ComponentType } from 'react';

function Unavailable() {
  return <Redirect href="/" />;
}

// En producción Metro descarta la rama `__DEV__`: la pantalla de desarrollo no entra al bundle.
const DevStatus: ComponentType = __DEV__
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- import condicional para excluirlo del bundle
  ? (require('../features/dev/DevStatusScreen') as typeof import('../features/dev/DevStatusScreen')).DevStatusScreen
  : Unavailable;

export default DevStatus;
