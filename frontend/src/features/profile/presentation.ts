import type { ImageSourcePropType } from 'react-native';
import type { ProfilePhoto } from './domain/profile';

export function profileAvatar(photo: ProfilePhoto): ImageSourcePropType | null {
  if (photo !== 'preview') return photo;
  // La foto de ejemplo solo existe en desarrollo; en producción el asset no entra al bundle.
  return __DEV__ ? require('../../../assets/images/preview-avatar.jpg') : null;
}
