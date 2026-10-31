import { useLocalSearchParams, useRouter } from 'expo-router';
import { HomeScreen } from '../../features/home/HomeScreen';
import { homeOverview } from '../../features/home/domain/overview';
import { diaryTotals, entriesForDate } from '../../features/nutrition/domain/diary';
import { useNutritionDiary } from '../../features/nutrition/useNutritionDiary';
import { useProfile } from '../../features/profile/useProfile';
import { useProgressStore } from '../../features/progress/useProgress';
import { sessionSummary } from '../../features/training/domain/session';
import { useSessionDraft } from '../../features/training/useSessionDraft';
import { cycles, latestSleep, sleepMinutes, sleepWeek, timeOf } from '../../features/sleep/domain/sleep';
import { useSleep } from '../../features/sleep/useSleep';
import { todayDateKey } from '../../shared/calendar';

export default function HomeRoute() {
  const router = useRouter();
  const { preview } = useLocalSearchParams<{ preview?: string }>();
  const empty = __DEV__ && preview === 'empty';
  const { profile } = useProfile(empty);
  const progress = useProgressStore(empty);
  const diary = useNutritionDiary();
  const { draft } = useSessionDraft();
  const today = todayDateKey();
  const overview = homeOverview({
    profile, progress, today, now: new Date(),
    consumed: diaryTotals(empty ? [] : entriesForDate(diary, today)), targets: empty ? null : diary.targets,
  });
  const pending = draft && !empty ? { title: draft.state.title, ...sessionSummary(draft.state) } : null;
  const day = overview.workout?.day;
  const sleepState = useSleep();
  const week = sleepWeek(empty ? [] : sleepState.records, today);
  const last = empty ? null : latestSleep(sleepState.records);
  const lastMinutes = last ? sleepMinutes(last.bed, last.wake) : null;
  const sleep = { pendingSince: !empty && sleepState.pendingBed ? timeOf(sleepState.pendingBed) : null, lastMinutes,
    lastCycles: lastMinutes === null ? null : cycles(lastMinutes, sleepState.cycleMinutes).complete, averageMinutes: week.averageMinutes, logged: week.logged };

  return <HomeScreen overview={overview} today={today} pending={pending} isPreview={__DEV__ && !empty}
    onTrainingPress={() => day === undefined ? router.navigate('/training') : router.push({ pathname: '/session', params: { day: String(day) } })}
    onResume={() => router.push({ pathname: '/session', params: { resume: '1' } })}
    onNutritionPress={() => overview.nutrition ? router.push({ pathname: '/food-entry', params: { date: today } }) : router.navigate('/nutrition')}
    sleep={sleep} onSleep={() => router.push('/sleep')}
    onWeightPress={() => router.navigate('/progress')} onHistory={() => router.navigate('/progress')} />;
}
