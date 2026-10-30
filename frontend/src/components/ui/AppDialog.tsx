import { AppPressable } from './AppPressable';
import type { PropsWithChildren } from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../../theme';
import { AppText } from './AppText';

export function AppDialog({ title, visible, onClose, children }: PropsWithChildren<{
  title: string; visible: boolean; onClose: () => void;
}>) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={styles.overlay}>
        <AppPressable accessibilityRole="button" accessibilityLabel="Cerrar diálogo" onPress={onClose} style={StyleSheet.absoluteFill} />
        <View accessibilityViewIsModal role="dialog" aria-label={title} style={styles.panel}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            <AppText variant="heading" accessibilityRole="header">{title}</AppText>
            {children}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, backgroundColor: colors.scrim },
  panel: { width: '100%', maxWidth: 400, maxHeight: '90%', borderRadius: radius.lg, backgroundColor: colors.canvas },
  content: { padding: spacing.xxl, gap: spacing.lg },
});
