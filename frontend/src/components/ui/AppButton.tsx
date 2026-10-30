import { AppPressable } from './AppPressable';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, type ComponentProps } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { colors, layout, radius, spacing } from '../../theme';
import { AppText } from './AppText';

type Props = {
  label: string;
  onPress: () => void;
  icon?: ComponentProps<typeof Ionicons>['name'];
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function AppButton({ label, onPress, icon, variant = 'primary', disabled, style }: Props) {
  const [focused, setFocused] = useState(false);
  const foreground = variant === 'primary' ? colors.white : variant === 'danger' ? colors.error : colors.muted;

  return (
    <AppPressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled }}
      disabled={disabled} onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={({ pressed }) => [styles.base, styles[variant], focused && styles.focused,
        (pressed || disabled) && styles.dimmed, style]}>
      {icon && <Ionicons name={icon} size={18} color={foreground} />}
      <AppText variant="strong" style={[styles.label, { color: foreground }]}>{label}</AppText>
    </AppPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: layout.touchTarget, borderRadius: radius.pill, borderWidth: 2, borderColor: 'transparent',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
  },
  primary: { backgroundColor: colors.brand },
  secondary: { backgroundColor: colors.sand },
  danger: { backgroundColor: colors.surfaceHigh },
  ghost: { backgroundColor: 'transparent' },
  label: { flexShrink: 1, textAlign: 'center' },
  focused: { borderColor: colors.brandStrong },
  dimmed: { opacity: 0.65 },
});
