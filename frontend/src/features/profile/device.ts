import { File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

// Selector del sistema: en Android 13+ no requiere permiso de almacenamiento.
export async function pickProfilePhoto(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
  return result.canceled ? null : result.assets[0]?.uri ?? null;
}

export type ExportResult = 'shared' | 'downloaded' | 'unavailable';

export async function shareJsonExport(fileName: string, data: unknown): Promise<ExportResult> {
  const content = JSON.stringify(data, null, 2);
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
    const link = Object.assign(document.createElement('a'), { href: url, download: fileName });
    link.click();
    URL.revokeObjectURL(url);
    return 'downloaded';
  }
  if (!(await Sharing.isAvailableAsync())) return 'unavailable';
  // Archivo temporal en caché: el sistema puede borrarlo; no queda como copia permanente.
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  file.write(content);
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Exportar mis datos de StrongerFit' });
  return 'shared';
}
