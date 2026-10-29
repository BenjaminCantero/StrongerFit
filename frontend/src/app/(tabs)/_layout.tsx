import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';

const screens: { name: string; title: string; icon: ComponentProps<typeof Ionicons>['name'] }[] = [
  { name: 'index', title: 'Inicio', icon: 'home-outline' },
  { name: 'training', title: 'Entrenar', icon: 'barbell-outline' },
  { name: 'nutrition', title: 'Alimentación', icon: 'restaurant-outline' },
  { name: 'progress', title: 'Progreso', icon: 'trending-up-outline' },
  { name: 'profile', title: 'Perfil', icon: 'person-outline' },
];

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#235C4B',
      tabBarInactiveTintColor: '#536276',
      tabBarStyle: { backgroundColor: '#FFFFFF', borderTopColor: '#DCE3EA' },
    }}>
      {screens.map(({ name, title, icon }) => (
        <Tabs.Screen key={name} name={name} options={{
          title,
          tabBarIcon: ({ color, size }) => <Ionicons name={icon} color={color} size={size} />,
        }} />
      ))}
    </Tabs>
  );
}
