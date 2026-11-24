import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/AppHeader';
import { AppText } from '../../components/ui/AppText';
import { QueryState } from '../../lib/data/QueryState';
import { profileAvatar } from '../../features/profile/presentation';
import { useProfile } from '../../features/profile/useProfile';
import { colors, fontFamily, layout } from '../../theme';

const screens: { name: string; title: string; icon: ComponentProps<typeof Ionicons>['name'] }[] = [
  { name: 'index', title: 'Inicio', icon: 'home-outline' },
  { name: 'training', title: 'Entrenar', icon: 'barbell-outline' },
  { name: 'nutrition', title: 'Alimentación', icon: 'restaurant-outline' },
  { name: 'progress', title: 'Progreso', icon: 'trending-up-outline' },
  { name: 'profile', title: 'Perfil', icon: 'person-outline' },
];

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const compact = width < 360 || fontScale > 1.2;
  const { profile, identity } = useProfile();
  const avatar = profileAvatar(profile.photo);
  // Las pestañas leen la identidad guardada (SY-02): se espera antes de mostrarlas.
  if (!identity.data) {
    return <View style={{ flex: 1, justifyContent: 'center', padding: 24, paddingTop: insets.top + 24, backgroundColor: colors.canvas }}>
      <QueryState isPending={identity.isPending} error={identity.error} onRetry={() => identity.refetch()} loadingLabel="Cargando tu perfil" />
    </View>;
  }
  return (
    <Tabs screenOptions={{
      headerShown: true,
      header: ({ options }) => <AppHeader title={options.title ?? 'StrongerFit'} avatar={avatar} />,
      tabBarActiveTintColor: colors.brand,
      tabBarInactiveTintColor: colors.ink,
      tabBarHideOnKeyboard: true,
      tabBarLabelPosition: 'below-icon',
      tabBarStyle: {
        backgroundColor: colors.canvas, borderTopColor: colors.surfaceHigh, borderTopWidth: 1,
        elevation: 0, height: Math.max(70, 38 + 30 * fontScale) + insets.bottom, paddingBottom: insets.bottom,
        width: '100%', maxWidth: layout.contentWidth, alignSelf: 'center',
      },
      sceneStyle: { backgroundColor: colors.canvas },
    }}>
      {screens.map(({ name, title, icon }) => (
        <Tabs.Screen key={name} name={name} options={{
          title,
          tabBarAccessibilityLabel: title,
          tabBarItemStyle: { flex: 1, paddingTop: 8, paddingBottom: 6 },
          tabBarLabel: ({ color }) => <AppText variant="label" style={{ color, fontFamily: fontFamily.medium,
            fontSize: 11, lineHeight: 15, textAlign: 'center', alignSelf: 'stretch', marginHorizontal: -5 }}>
            {compact && name === 'nutrition' ? 'Comidas' : compact && name === 'training' ? 'Entreno' : title}
          </AppText>,
          tabBarIcon: ({ color }) => <Ionicons name={icon} color={color as string} size={23} />,
        }} />
      ))}
    </Tabs>
  );
}
