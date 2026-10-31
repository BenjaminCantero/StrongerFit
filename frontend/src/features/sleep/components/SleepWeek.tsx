import { StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/ui/AppText';
import { colors, radius, spacing } from '../../../theme';
import { formatSleep, type SleepNight } from '../domain/sleep';

const HEIGHT = 110;
const MAX_HOURS = 10;
const dayLabel = (date: string) => ['D', 'L', 'M', 'X', 'J', 'V', 'S'][new Date(`${date}T12:00:00Z`).getUTCDay()]!;
const dayName = (date: string) => new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));

export function SleepWeek({ nights, today }: { nights: SleepNight[]; today: string }) {
  return <View style={styles.chart}>
    <View style={styles.body}>
    <View style={styles.yAxis}>
      {[8, 6].map((hours) => <AppText key={hours} variant="caption" tone="muted" style={[styles.guideLabel, { bottom: hours / MAX_HOURS * HEIGHT - 10 }]}>{hours} h</AppText>)}
    </View>
    <View style={styles.plot}>
      {[8, 6].map((hours) => <View key={hours} style={[styles.guide, { bottom: hours / MAX_HOURS * HEIGHT }]} />)}
      {nights.map((night) => <View key={night.date} style={styles.column} accessible
        accessibilityLabel={`${dayName(night.date)}: ${night.minutes === null ? 'sin registro' : formatSleep(night.minutes)}`}>
        {night.minutes === null ? <View style={styles.empty} />
          : <View style={[styles.bar, night.date === today && styles.today, { height: Math.max(4, Math.min(1, night.minutes / 60 / MAX_HOURS) * HEIGHT) }]} />}
      </View>)}
    </View>
    </View>
    <View style={[styles.axis, styles.axisOffset]}>
      {nights.map((night) => <AppText key={night.date} variant="caption" tone={night.date === today ? 'brand' : 'muted'} style={styles.axisLabel}>
        {dayLabel(night.date)}
      </AppText>)}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  chart: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.lg, gap: spacing.sm },
  body: { flexDirection: 'row', gap: spacing.sm },
  yAxis: { width: 26, height: HEIGHT },
  plot: { flex: 1, height: HEIGHT, flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  guide: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1, borderStyle: 'dashed', borderColor: colors.surfaceHigh },
  guideLabel: { position: 'absolute', right: 0, lineHeight: 20 },
  column: { flex: 1, height: HEIGHT, justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: '70%', borderTopLeftRadius: 8, borderTopRightRadius: 8, backgroundColor: colors.brandMedium },
  today: { backgroundColor: colors.brand },
  empty: { width: '70%', height: 4, borderRadius: 2, backgroundColor: colors.surfaceHigh },
  axis: { flexDirection: 'row', gap: spacing.sm },
  axisOffset: { marginLeft: 26 + spacing.sm },
  axisLabel: { flex: 1, textAlign: 'center' },
});
