import { AppPressable } from '../../../components/ui/AppPressable';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { PropsWithChildren } from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../../components/ui/AppText';
import { colors, layout, radius, spacing } from '../../../theme';

export function SessionDialog({ title, visible, onClose, children }: PropsWithChildren<{
  title: string; visible: boolean; onClose: () => void;
}>) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <AppPressable accessibilityRole="button" accessibilityLabel="Cerrar diálogo" onPress={onClose} style={StyleSheet.absoluteFill} />
        <View accessibilityViewIsModal role="dialog" aria-label={title}
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.xl) }]}>
          <View style={styles.top}>
            <AppText variant="heading" accessibilityRole="header" style={styles.title}>{title}</AppText>
            <AppPressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onClose} style={styles.close}>
              <Ionicons name="close" size={22} color={colors.ink} />
            </AppPressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>{children}</ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.scrim },
  sheet: { width: '100%', maxWidth: layout.contentWidth, maxHeight: '90%', alignSelf: 'center',
    backgroundColor: colors.canvas, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.xl },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  title: { flex: 1 },
  close: { width: layout.touchTarget, height: layout.touchTarget, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, backgroundColor: colors.surface },
  content: { gap: spacing.lg },
});
