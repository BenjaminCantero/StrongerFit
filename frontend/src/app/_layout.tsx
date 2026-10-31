import '../../global.css';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { useFonts } from 'expo-font';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { appFonts } from '../theme/fonts';
import { AppHeader } from '../components/AppHeader';

export default function RootLayout() {
  const router = useRouter();
  const [fontsLoaded, fontError] = useFonts(appFonts);
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
  }));

  if (fontError) throw fontError;
  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={colors.brand} accessibilityLabel="Preparando StrongerFit" />
    </View>;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="welcome" />
          <Stack.Screen name="onboarding" options={{ headerShown: true, title: 'Crear tu perfil',
            header: ({ options }) => <AppHeader title={options.title ?? 'Crear tu perfil'}
              backLabel="Volver a Bienvenida" onBack={() => router.dismissTo('/welcome')} /> }} />
          <Stack.Screen name="food-entry" options={{ headerShown: true, title: 'Registro de alimento',
            header: ({ options }) => <AppHeader title={options.title ?? 'Registro de alimento'}
              backLabel="Volver a Alimentación" onBack={() => router.dismissTo('/nutrition')} /> }} />
          <Stack.Screen name="session" options={{ headerShown: true, title: 'Sesión de entrenamiento',
            header: ({ options }) => <AppHeader title={options.title ?? 'Sesión de entrenamiento'}
              backLabel="Volver" onBack={() => router.canGoBack() ? router.back() : router.navigate('/')} /> }} />
          <Stack.Screen name="meal-plan" options={{ headerShown: true, title: 'Minuta semanal',
            header: ({ options }) => <AppHeader title={options.title ?? 'Minuta semanal'}
              backLabel="Volver" onBack={() => router.canGoBack() ? router.back() : router.navigate('/nutrition')} /> }} />
          <Stack.Screen name="nutrition-goals" options={{ headerShown: true, title: 'Metas nutricionales',
            header: ({ options }) => <AppHeader title={options.title ?? 'Metas nutricionales'}
              backLabel="Volver" onBack={() => router.back()} /> }} />
          <Stack.Screen name="dev-status" options={{ headerShown: true, title: 'Conexión de desarrollo' }} />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
