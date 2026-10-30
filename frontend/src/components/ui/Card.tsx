import { StyleSheet, View, type ViewProps } from 'react-native';
import { colors, radius, spacing } from '../../theme';

export function Card({ tone = 'default', style, ...props }: ViewProps & { tone?: 'default' | 'low' }) {
  return <View {...props} style={[styles.base, tone === 'low' && styles.low, style]} />;
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.lg },
  low: { backgroundColor: colors.surfaceLow },
});
