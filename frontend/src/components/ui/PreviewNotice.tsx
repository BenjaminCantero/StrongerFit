import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../../theme';
import { AppText } from './AppText';

// Aviso común para datos de ejemplo o cambios que solo viven en memoria.
export function PreviewNotice({ children, local = false }: { children: string; local?: boolean }) {
  return <View style={styles.notice}>
    <Ionicons name={local ? 'phone-portrait-outline' : 'flask-outline'} size={16} color={colors.gold} />
    <AppText variant="caption" tone="muted" style={styles.text}>{children}</AppText>
  </View>;
}

const styles = StyleSheet.create({
  notice: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.sm, backgroundColor: colors.sand },
  text: { flex: 1 },
});
