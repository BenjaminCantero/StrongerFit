import { Platform } from 'react-native';

// Las direcciones locales solo existen en desarrollo; producción exige EXPO_PUBLIC_API_URL.
export const apiUrl = process.env.EXPO_PUBLIC_API_URL
  ?? (__DEV__ ? (Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000') : '');
