import { useLocalSearchParams, useRouter } from 'expo-router';
import { HomeScreen } from '../../features/home/HomeScreen';
import { homeOverview } from '../../features/home/domain/overview';
import { diaryTotals, entriesForDate } from '../../features/nutrition/domain/diary';
import { useNutritionDiary } from '../../features/nutrition/useNutritionDiary';
import { useProfile } from '../../features/profile/useProfile';
import { useProgressStore } from '../../features/progress/useProgress';
import { sessionSummary } from '../../features/training/domain/session';
import { useSessionDraft } from '../../features/training/useSessionDraft';
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

  return <HomeScreen overview={overview} today={today} pending={pending} isPreview={__DEV__ && !empty}
    onTrainingPress={() => day === undefined ? router.navigate('/training') : router.push({ pathname: '/session', params: { day: String(day) } })}
    onResume={() => router.push({ pathname: '/session', params: { resume: '1' } })}
    onNutritionPress={() => overview.nutrition ? router.push({ pathname: '/food-entry', params: { date: today } }) : router.navigate('/nutrition')}
    onWeightPress={() => router.navigate('/progress')} onHistory={() => router.navigate('/progress')} />;
}
