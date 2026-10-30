import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, layout, spacing } from '../theme';
import { AppText } from './ui/AppText';

export function Screen({ title, children, safeBottom = false }: PropsWithChildren<{ title?: string; safeBottom?: boolean }>) {
  return (
    <SafeAreaView style={styles.safeArea} edges={safeBottom ? ['left', 'right', 'bottom'] : ['left', 'right']}>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {title && <AppText variant="title" accessibilityRole="header">{title}</AppText>}
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.canvas },
  scrollContent: { flexGrow: 1 },
  content: {
    width: '100%', maxWidth: layout.contentWidth, alignSelf: 'center',
    padding: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.section, gap: spacing.xl,
  },
});
