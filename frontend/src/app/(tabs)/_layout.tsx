import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/AppHeader';
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
  const compact = useWindowDimensions().width < 360;
  return (
    <Tabs screenOptions={{
      headerShown: true,
      header: ({ options }) => <AppHeader title={options.title ?? 'StrongerFit'} />,
      tabBarActiveTintColor: colors.brand,
      tabBarInactiveTintColor: colors.ink,
      tabBarHideOnKeyboard: true,
      tabBarLabelStyle: { fontFamily: fontFamily.medium, fontSize: 11, lineHeight: 16, marginHorizontal: 0 },
      tabBarStyle: {
        backgroundColor: colors.canvas, borderTopColor: colors.surfaceHigh, borderTopWidth: 1,
        elevation: 0, height: 70 + insets.bottom, paddingBottom: insets.bottom,
        width: '100%', maxWidth: layout.contentWidth, alignSelf: 'center',
      },
      sceneStyle: { backgroundColor: colors.canvas },
    }}>
      {screens.map(({ name, title, icon }) => (
        <Tabs.Screen key={name} name={name} options={{
          title,
          tabBarItemStyle: { flex: compact && name === 'nutrition' ? 1.25 : 1, paddingTop: 8, paddingBottom: 6 },
          tabBarIcon: ({ color }) => <Ionicons name={icon} color={color} size={23} />,
        }} />
      ))}
    </Tabs>
  );
}
