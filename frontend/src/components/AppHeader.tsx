import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, layout, radius, spacing } from '../theme';
import { AppText } from './ui/AppText';

export function AppHeader({ title }: { title: string }) {
  const [notificationsVisible, setNotificationsVisible] = useState(false);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.brand}>
          <View style={styles.mark} accessible={false}>
            <Ionicons name="barbell-outline" size={21} color={colors.brand} />
          </View>
          <View>
            <AppText variant="label" tone="brand" style={styles.wordmark}>StrongerFit</AppText>
            <AppText variant="header">{title}</AppText>
          </View>
        </View>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" accessibilityLabel="Notificaciones"
            accessibilityState={{ expanded: notificationsVisible }}
            onPress={() => setNotificationsVisible((visible) => !visible)}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Ionicons name={notificationsVisible ? 'notifications' : 'notifications-outline'} size={23} color={colors.ink} />
          </Pressable>
          <Link href="/profile" asChild>
            <Pressable accessibilityRole="link" accessibilityLabel="Abrir perfil"
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
              {__DEV__
                ? <Image source={require('../../assets/images/preview-avatar.jpg')} style={styles.avatar} />
                : <View style={[styles.avatar, styles.profilePlaceholder]}><Ionicons name="person-outline" size={20} color={colors.brand} /></View>}
            </Pressable>
          </Link>
        </View>
      </View>
      {notificationsVisible && (
        <View style={styles.notice} accessibilityLiveRegion="polite">
          <AppText variant="strong">Notificaciones</AppText>
          <AppText tone="muted">No hay notificaciones para mostrar.</AppText>
          <Pressable accessibilityRole="button" onPress={() => setNotificationsVisible(false)} style={styles.closeNotice}>
            <AppText variant="label" tone="brand">Cerrar</AppText>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.canvas, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.surfaceHigh },
  content: {
    minHeight: 68, width: '100%', maxWidth: layout.contentWidth, alignSelf: 'center', paddingHorizontal: spacing.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexShrink: 1 },
  mark: { width: 36, height: 36, borderRadius: radius.pill, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  wordmark: { letterSpacing: 0.8, textTransform: 'uppercase', fontSize: 10.5, lineHeight: 16 },
  actions: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { width: layout.touchTarget, height: layout.touchTarget, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 34, height: 34, borderRadius: radius.pill, borderWidth: 2, borderColor: colors.brandSoft },
  profilePlaceholder: { backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
  notice: { width: '100%', maxWidth: layout.contentWidth, alignSelf: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  closeNotice: { alignSelf: 'flex-start', minHeight: layout.touchTarget, justifyContent: 'center' },
});
