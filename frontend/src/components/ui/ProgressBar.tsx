import { StyleSheet, View } from 'react-native';
import { colors, radius } from '../../theme';

export function ProgressBar({ value, target, label, color = colors.brand }: {
  value: number; target: number; label: string; color?: string;
}) {
  const ratio = target > 0 ? Math.max(0, Math.min(1, value / target)) : 0;

  return (
    <View accessibilityRole="progressbar" accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(ratio * 100), text: `${value} de ${target}` }}
      style={styles.track}>
      <View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 7, borderRadius: radius.pill, backgroundColor: colors.surfaceHigh, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
});
