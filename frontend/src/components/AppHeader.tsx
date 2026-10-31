import { AppPressable } from './ui/AppPressable';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, View, useWindowDimensions, type ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, layout, radius, spacing } from '../theme';
import { AppText } from './ui/AppText';

type Props = { title: string; onBack?: () => void; backLabel?: string; avatar?: ImageSourcePropType | null };

export function AppHeader({ title, onBack, backLabel = 'Volver a Inicio', avatar = null }: Props) {
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const { width, fontScale } = useWindowDimensions();
  const compact = width < 360 || fontScale > 1.2;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.brand}>
          {onBack ? <AppPressable accessibilityRole="button" accessibilityLabel={backLabel} onPress={onBack} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={23} color={colors.ink} />
          </AppPressable> : null}
          <AppText variant={onBack ? 'header' : 'heading'} accessibilityRole="header" style={styles.title}>{title}</AppText>
        </View>
        {(!onBack || !compact) && <View style={styles.actions}>
          {!onBack && <AppPressable accessibilityRole="button" accessibilityLabel="Notificaciones"
            accessibilityState={{ expanded: notificationsVisible }}
            onPress={() => setNotificationsVisible((visible) => !visible)}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Ionicons name={notificationsVisible ? 'notifications' : 'notifications-outline'} size={23} color={colors.ink} />
          </AppPressable>}
          <Link href="/profile" asChild>
            <AppPressable accessibilityRole="link" accessibilityLabel="Abrir perfil" style={styles.iconButton}>
              {avatar
                ? <Image source={avatar} style={styles.avatar} />
                : <View style={[styles.avatar, styles.profilePlaceholder]}><Ionicons name="person-outline" size={20} color={colors.brand} /></View>}
            </AppPressable>
          </Link>
        </View>}
      </View>
      {notificationsVisible && (
        <View style={styles.notice} accessibilityLiveRegion="polite">
          <AppText variant="strong">Notificaciones</AppText>
          <AppText tone="muted">No hay notificaciones para mostrar.</AppText>
          <AppPressable accessibilityRole="button" onPress={() => setNotificationsVisible(false)} style={styles.closeNotice}>
            <AppText variant="label" tone="brand">Cerrar</AppText>
          </AppPressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.canvas, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.surfaceHigh },
  content: {
    minHeight: 60, width: '100%', maxWidth: layout.contentWidth, alignSelf: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexShrink: 1 },
  title: { flexShrink: 1 },
  actions: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { width: layout.touchTarget, height: layout.touchTarget, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 34, height: 34, borderRadius: radius.pill, borderWidth: 2, borderColor: colors.brandSoft },
  profilePlaceholder: { backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
  notice: { width: '100%', maxWidth: layout.contentWidth, alignSelf: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  closeNotice: { alignSelf: 'flex-start', minHeight: layout.touchTarget, justifyContent: 'center' },
});
