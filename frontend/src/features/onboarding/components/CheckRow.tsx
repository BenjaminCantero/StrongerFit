import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppPressable } from '../../../components/ui/AppPressable';
import { AppText } from '../../../components/ui/AppText';
import { colors, layout, radius, spacing } from '../../../theme';

export function CheckRow({ title, description, checked, onToggle, children }: {
  title: string; description?: string; checked: boolean; onToggle: () => void; children?: ReactNode;
}) {
  return <AppPressable accessibilityRole="checkbox" accessibilityState={{ checked }} aria-checked={checked}
    accessibilityLabel={description ? `${title}. ${description}` : title} onPress={onToggle}
    style={({ pressed }) => [styles.row, checked && styles.checked, pressed && styles.pressed]}>
    <View style={[styles.box, checked && styles.boxChecked]}>
      {checked && <Ionicons name="checkmark" size={18} color={colors.white} />}
    </View>
    <View style={styles.text}>
      <AppText variant="strong">{title}</AppText>
      {description && <AppText variant="caption" tone="muted">{description}</AppText>}
      {children}
    </View>
  </AppPressable>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, padding: spacing.lg, minHeight: layout.touchTarget,
    borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: 'transparent' },
  checked: { borderColor: colors.brand, backgroundColor: colors.surfaceLow },
  pressed: { opacity: 0.75 },
  box: { width: 24, height: 24, marginTop: 2, borderRadius: 6, borderWidth: 2, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  boxChecked: { backgroundColor: colors.brand, borderColor: colors.brand },
  text: { flex: 1, gap: 2 },
});
