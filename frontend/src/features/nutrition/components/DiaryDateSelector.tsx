import { AppPressable } from '../../../components/ui/AppPressable';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import { colors, layout, radius, spacing } from '../../../theme';
import { todayDateKey } from '../domain/diary';
import { formatDiaryDate } from '../presentation';

export function DiaryDateSelector({ date, onPrevious, onNext, onToday }: {
  date: string; onPrevious: () => void; onNext: () => void; onToday: () => void;
}) {
  const isToday = date === todayDateKey();
  return (
    <View style={styles.container}>
      <AppPressable accessibilityRole="button" accessibilityLabel="Día anterior" onPress={onPrevious} style={styles.arrow}>
        <Ionicons name="chevron-back" size={23} color={colors.ink} />
      </AppPressable>
      <AppPressable accessibilityRole="button" accessibilityLabel="Volver a hoy" onPress={onToday} style={styles.date}>
        <AppText variant="label" tone="brand">{isToday ? 'Hoy' : 'Volver a hoy'}</AppText>
        <AppText variant="header" style={styles.dateText}>{formatDiaryDate(date)}</AppText>
      </AppPressable>
      <AppPressable accessibilityRole="button" accessibilityLabel="Día siguiente" onPress={onNext} style={styles.arrow}>
        <Ionicons name="chevron-forward" size={23} color={colors.ink} />
      </AppPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md },
  arrow: { width: layout.touchTarget, height: layout.touchTarget, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.canvas, borderRadius: radius.sm },
  date: { flex: 1, minHeight: layout.touchTarget, justifyContent: 'center', alignItems: 'center' },
  dateText: { textAlign: 'center', fontSize: 15 },
});
