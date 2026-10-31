import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'StrongerFit',
  slug: 'strongerfit',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  scheme: 'strongerfit',
  ios: { supportsTablet: true, bundleIdentifier: 'cl.strongerfit.app' },
  android: { package: 'cl.strongerfit.app', allowBackup: false },
  web: { bundler: 'metro', output: 'single' },
  plugins: [
    'expo-router',
    'expo-font',
    'expo-secure-store',
    'expo-sqlite',
    'expo-notifications',
    ['expo-build-properties', {
      android: { minSdkVersion: 29, usesCleartextTraffic: process.env.APP_VARIANT === 'development' },
    }],
  ],
  experiments: { typedRoutes: true },
};

export default config;
