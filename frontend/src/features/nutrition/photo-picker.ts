import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export type PhotoSource = 'camera' | 'library';
export type PickResult = { status: 'picked'; uri: string } | { status: 'canceled' } | { status: 'denied' };

// Calidad reducida: basta para reconocer el plato y aligera la subida futura.
const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.6, allowsEditing: true, aspect: [4, 3] };

export async function pickFoodPhoto(source: PhotoSource): Promise<PickResult> {
  if (source === 'camera' && Platform.OS !== 'web') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return { status: 'denied' };
  }
  // Galería: el selector del sistema no requiere permiso en Android 13+ ni iOS 14+.
  const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  const uri = result.canceled ? null : result.assets[0]?.uri;
  return uri ? { status: 'picked', uri } : { status: 'canceled' };
}
