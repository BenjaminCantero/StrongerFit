import { useEffect, useState } from 'react';
import { SleepScreen } from '../features/sleep/SleepScreen';
import { localNow } from '../features/sleep/domain/sleep';
import { useSleep } from '../features/sleep/useSleep';
import { todayDateKey } from '../shared/calendar';

export default function SleepRoute() {
  const sleep = useSleep();
  const [now, setNow] = useState(() => new Date());
  // Refresca la duración en curso cada minuto.
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 60_000); return () => clearInterval(id); }, []);
  return <SleepScreen state={sleep} dispatch={sleep.dispatch} today={todayDateKey(now)} now={localNow(now)} isPreview={__DEV__} />;
}
