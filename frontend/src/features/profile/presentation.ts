import type { ImageSourcePropType } from 'react-native';
import type { ProfilePhoto } from './domain/profile';

export function profileAvatar(photo: ProfilePhoto): ImageSourcePropType | null {
  return photo === 'preview' ? require('../../../assets/images/preview-avatar.jpg') : photo;
}
