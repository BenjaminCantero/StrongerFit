import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { colors, layout, radius, spacing } from '../../theme';
import { AppText } from './AppText';

type Props = {
  label: string;
  onPress: () => void;
  icon?: ComponentProps<typeof Ionicons>['name'];
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function AppButton({ label, onPress, icon, variant = 'primary', disabled, style }: Props) {
  const [focused, setFocused] = useState(false);
  const foreground = variant === 'primary' ? colors.white : colors.muted;

  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled }}
      disabled={disabled} onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={({ pressed }) => [styles.base, styles[variant], focused && styles.focused,
        (pressed || disabled) && styles.dimmed, style]}>
      {icon && <Ionicons name={icon} size={18} color={foreground} />}
      <AppText variant="strong" style={{ color: foreground }}>{label}</AppText>
    </Pressable>
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
  focused: { borderColor: colors.brandStrong },
  dimmed: { opacity: 0.65 },
});
