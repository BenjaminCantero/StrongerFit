// Solo notificaciones locales. Se importan los submódulos para no cargar el índice
// de expo-notifications, que en Expo Go exige un módulo nativo de push ausente.
import { cancelScheduledNotificationAsync } from 'expo-notifications/build/cancelScheduledNotificationAsync';
import { AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types';
import { getPermissionsAsync, requestPermissionsAsync } from 'expo-notifications/build/NotificationPermissions';
import { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
import { SchedulableTriggerInputTypes } from 'expo-notifications/build/Notifications.types';
import { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';
import { setNotificationChannelAsync } from 'expo-notifications/build/setNotificationChannelAsync';
import { useEffect } from 'react';
import { Platform } from 'react-native';

const CHANNEL = 'temporizadores';
let ready: Promise<boolean> | undefined;
let channel: string | undefined;

// Se prepara la primera vez que corre un temporizador: el permiso se pide en contexto.
function prepare(): Promise<boolean> {
  ready ??= (async () => {
    setNotificationHandler({
      handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
    });
    // Canal propio con prioridad alta. Expo Go falla al crearlo; entonces se usa el predeterminado.
    if (Platform.OS === 'android') {
      channel = await setNotificationChannelAsync(CHANNEL, { name: 'Temporizadores', importance: AndroidImportance.HIGH, vibrationPattern: [0, 250, 250, 250] })
        .then(() => CHANNEL, () => undefined);
    }
    const current = await getPermissionsAsync();
    const granted = current.granted || (await requestPermissionsAsync()).granted;
    // Sin permiso se vuelve a consultar en el próximo temporizador.
    if (!granted) ready = undefined;
    return granted;
  })().catch((error: unknown) => {
    if (__DEV__) console.warn('Avisos de temporizador no disponibles:', error);
    ready = undefined;
    return false;
  });
  return ready;
}

async function schedule(seconds: number, title: string, body: string): Promise<string | null> {
  if (seconds < 1 || !(await prepare())) return null;
  return scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: { type: SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.ceil(seconds), ...(channel ? { channelId: channel } : {}) },
  }).catch(() => null);
}

function cancel(id: string | null) {
  if (id) cancelScheduledNotificationAsync(id).catch(() => undefined);
}

// Programa un aviso local para `endsAtMs` y lo cancela si cambia, se pausa o se desmonta (RNF-26).
export function useTimerAlert(endsAtMs: number | null, title: string, body: string) {
  useEffect(() => {
    if (endsAtMs === null) return;
    let id: string | null = null;
    let active = true;
    schedule((endsAtMs - Date.now()) / 1000, title, body).then((value) => { if (active) id = value; else cancel(value); });
    return () => { active = false; cancel(id); };
  }, [endsAtMs, title, body]);
}
