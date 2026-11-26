import type { ExpoConfig } from 'expo/config';

// Variante de build (eas.json la fija por perfil). Sin variable equivale a producción.
// Cada variante tiene su propio paquete para convivir instaladas en el mismo teléfono.
const variant = process.env.APP_VARIANT;
const isDevelopment = variant === 'development';
const variantConfig = isDevelopment
  ? { name: 'StrongerFit Dev', id: 'cl.strongerfit.app.dev' }
  : variant === 'preview'
    ? { name: 'StrongerFit Preview', id: 'cl.strongerfit.app.preview' }
    : { name: 'StrongerFit', id: 'cl.strongerfit.app' };

// ID del proyecto EAS: pegar aquí el ID que imprime `npx eas-cli@27.11.0 init`
// (ver docs/operations/builds.md). No es secreto. `.env` no entra a los builds
// locales, por eso va en el código; EAS_PROJECT_ID en el entorno tiene prioridad.
const EAS_PROJECT_ID = '';
const easProjectId = process.env.EAS_PROJECT_ID ?? EAS_PROJECT_ID;

const config: ExpoConfig = {
  name: variantConfig.name,
  slug: 'strongerfit',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  scheme: 'strongerfit',
  ios: { supportsTablet: true, bundleIdentifier: variantConfig.id },
  android: { package: variantConfig.id, allowBackup: false },
  web: { bundler: 'metro', output: 'single' },
  plugins: [
    'expo-router',
    'expo-font',
    'expo-secure-store',
    'expo-sqlite',
    'expo-notifications',
    ['expo-camera', {
      cameraPermission: 'StrongerFit usa la cámara para leer códigos de barras y fotografiar tus comidas.',
      recordAudioAndroid: false,
    }],
    ['expo-image-picker', {
      cameraPermission: 'StrongerFit usa la cámara para fotografiar tus comidas y estimar sus calorías.',
      photosPermission: 'StrongerFit accede a tus fotos para elegir la imagen de una comida o de tu perfil.',
      microphonePermission: false,
    }],
    ['expo-build-properties', {
      android: { minSdkVersion: 29, usesCleartextTraffic: isDevelopment },
    }],
  ],
  experiments: { typedRoutes: true },
  ...(easProjectId !== '' ? { extra: { eas: { projectId: easProjectId } } } : {}),
};

export default config;
