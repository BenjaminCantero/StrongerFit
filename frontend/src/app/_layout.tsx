import '../../global.css';
import { QueryClientProvider, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, type PropsWithChildren } from 'react';
import { useFonts } from 'expo-font';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { appFonts } from '../theme/fonts';
import { AppHeader } from '../components/AppHeader';
import { routeAccess } from '../features/account/access';
import { useAuthSession } from '../features/account/auth';
import { AccountStatusErrorScreen, PendingOnboardingErrorScreen } from '../features/account/GateScreens';
import { signOutAndPurge, useSessionLifecycle } from '../features/account/session';
import { useFinishPendingOnboarding } from '../features/account/useFinishPendingOnboarding';
import { SessionContext } from '../features/account/SessionContext';
import { useAccountStatus } from '../features/account/useAccount';
import { dataErrorMessage, toDataError } from '../lib/data/errors';
import { cacheBuster } from '../lib/data/keys';
import { CACHE_MAX_AGE, createQueryClient, listenToConnectivity, queryPersister } from '../lib/data/query';
import { getSupabase } from '../lib/supabase';

// Al abrir la app sin una URL concreta, la primera pantalla es Bienvenida.
// Las guardas de Stack.Protected redirigen a onboarding, consentimiento o Inicio
// cuando ya hay una sesión activa.
export const unstable_settings = {
  anchor: 'welcome',
};

function Splash({ label }: { label: string }) {
  return <View style={{ flex: 1, backgroundColor: colors.canvas, alignItems: 'center', justifyContent: 'center' }}>
    <ActivityIndicator color={colors.brand} accessibilityLabel={label} />
  </View>;
}

// Con sesión, la caché se guarda en el teléfono y se separa por persona (buster por usuario).
function DataProvider({ client, userId, children }: PropsWithChildren<{ client: QueryClient; userId: string | null }>) {
  if (!queryPersister || !userId) return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return <PersistQueryClientProvider key={userId} client={client}
    persistOptions={{ persister: queryPersister, maxAge: CACHE_MAX_AGE, buster: cacheBuster(userId) }}>
    {children}
  </PersistQueryClientProvider>;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(appFonts);
  const [queryClient] = useState(createQueryClient);
  const auth = useAuthSession();
  useEffect(listenToConnectivity, []);

  if (fontError) throw fontError;
  if (!fontsLoaded || !auth.ready) return <Splash label="Preparando StrongerFit" />;
  const userId = auth.session?.user.id ?? null;

  return (
    <SafeAreaProvider>
      <DataProvider client={queryClient} userId={userId}>
        <SessionContext.Provider value={{ userId }}>
          <StatusBar style="dark" />
          <AppStack configured={auth.configured} userId={userId} />
        </SessionContext.Provider>
      </DataProvider>
    </SafeAreaProvider>
  );
}

// Pantalla de entrada según el acceso: '/' está protegida y no lleva a Bienvenida sin sesión.
function homeFor(access: ReturnType<typeof routeAccess>) {
  if (access === 'signed-out') return '/welcome' as const;
  if (access === 'needs-onboarding') return '/onboarding' as const;
  if (access === 'needs-consent') return '/consent' as const;
  return '/' as const;
}

// AU-01: sin sesión, Bienvenida, onboarding y Cuenta (onboarding primero, cuenta al final); con sesión,
// onboarding o consentimiento si faltan;
// el resto solo con la cuenta lista. Stack.Protected redirige cuando cambia el estado.
function AppStack({ configured, userId }: { configured: boolean; userId: string | null }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  useSessionLifecycle(queryClient, userId);
  const status = useAccountStatus(userId);
  const access = routeAccess({ configured, sessionReady: true, userId, status: status.data, statusError: status.isError });
  const finish = useFinishPendingOnboarding(userId, status.data);
  const sessionExpired = status.isError && toDataError(status.error).kind === 'session';

  // Sesión revocada o vencida: se cierra sin borrar el borrador (puede tener una sesión sin enviar).
  useEffect(() => {
    if (sessionExpired) getSupabase().auth.signOut().catch(() => undefined);
  }, [sessionExpired]);

  if (access === 'loading') return <Splash label="Abriendo tu cuenta" />;
  if (access === 'status-error') return <AccountStatusErrorScreen message={dataErrorMessage(toDataError(status.error))}
    onRetry={() => status.refetch()} onSignOut={() => signOutAndPurge(queryClient)} />;
  // Guardando el perfil hecho antes de crear la cuenta (sin <Redirect>: al quedar lista, las guardas llevan a Inicio).
  if (finish.phase === 'checking') return <Splash label="Abriendo tu cuenta" />;
  if (finish.phase === 'saving') return <Splash label="Guardando tu perfil" />;
  if (finish.phase === 'error') return <PendingOnboardingErrorScreen onRetry={finish.retry} onRedo={() => { void finish.discard(); }} />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={access === 'signed-out'}>
        <Stack.Screen name="welcome" />
        <Stack.Screen name="account" options={{ headerShown: true, title: 'Cuenta',
          header: ({ options }) => <AppHeader title={options.title ?? 'Cuenta'}
            backLabel="Volver" onBack={() => router.canGoBack() ? router.back() : router.navigate('/welcome')} /> }} />
      </Stack.Protected>
      <Stack.Protected guard={access === 'signed-out' || access === 'needs-onboarding'}>
        <Stack.Screen name="onboarding" options={{ headerShown: true, title: 'Crear tu perfil',
          header: ({ options }) => <AppHeader title={options.title ?? 'Crear tu perfil'} /> }} />
      </Stack.Protected>
      <Stack.Protected guard={access === 'needs-consent'}>
        <Stack.Screen name="consent" options={{ headerShown: true, title: 'Consentimiento',
          header: ({ options }) => <AppHeader title={options.title ?? 'Consentimiento'} /> }} />
      </Stack.Protected>
      <Stack.Protected guard={access === 'ready' || access === 'signed-out'}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="food-entry" options={{ headerShown: true, title: 'Registro de alimento',
          header: ({ options }) => <AppHeader title={options.title ?? 'Registro de alimento'}
            backLabel="Volver a Alimentación" onBack={() => router.dismissTo('/nutrition')} /> }} />
        <Stack.Screen name="barcode" options={{ headerShown: true, title: 'Código de barras',
          header: ({ options }) => <AppHeader title={options.title ?? 'Código de barras'}
            backLabel="Volver a Alimentación" onBack={() => router.dismissTo('/nutrition')} /> }} />
        <Stack.Screen name="food-photo" options={{ headerShown: true, title: 'Foto de comida',
          header: ({ options }) => <AppHeader title={options.title ?? 'Foto de comida'}
            backLabel="Volver a Alimentación" onBack={() => router.dismissTo('/nutrition')} /> }} />
        <Stack.Screen name="programs/index" options={{ headerShown: true, title: 'Programas clásicos',
          header: ({ options }) => <AppHeader title={options.title ?? 'Programas clásicos'}
            backLabel="Volver a Entrenar" onBack={() => router.canGoBack() ? router.back() : router.navigate('/training')} /> }} />
        <Stack.Screen name="programs/[id]" options={{ headerShown: true, title: 'Programa',
          header: ({ options }) => <AppHeader title={options.title ?? 'Programa'}
            backLabel="Volver a programas" onBack={() => router.canGoBack() ? router.back() : router.navigate('/programs')} /> }} />
        <Stack.Screen name="routine-suggestions" options={{ headerShown: true, title: 'Sugerencias de rutinas',
          header: ({ options }) => <AppHeader title={options.title ?? 'Sugerencias de rutinas'}
            backLabel="Volver a Entrenar" onBack={() => router.canGoBack() ? router.back() : router.navigate('/training')} /> }} />
        <Stack.Screen name="session" options={{ headerShown: true, title: 'Sesión de entrenamiento',
          header: ({ options }) => <AppHeader title={options.title ?? 'Sesión de entrenamiento'}
            backLabel="Volver" onBack={() => router.canGoBack() ? router.back() : router.navigate('/')} /> }} />
        <Stack.Screen name="meal-plan" options={{ headerShown: true, title: 'Minuta semanal',
          header: ({ options }) => <AppHeader title={options.title ?? 'Minuta semanal'}
            backLabel="Volver" onBack={() => router.canGoBack() ? router.back() : router.navigate('/nutrition')} /> }} />
        <Stack.Screen name="sleep" options={{ headerShown: true, title: 'Sueño',
          header: ({ options }) => <AppHeader title={options.title ?? 'Sueño'}
            backLabel="Volver" onBack={() => router.canGoBack() ? router.back() : router.navigate('/')} /> }} />
        <Stack.Screen name="nutrition-goals" options={{ headerShown: true, title: 'Metas nutricionales',
          header: ({ options }) => <AppHeader title={options.title ?? 'Metas nutricionales'}
            backLabel="Volver" onBack={() => router.back()} /> }} />
        <Stack.Screen name="exercises/index" options={{ headerShown: true, title: 'Catálogo de ejercicios',
          header: ({ options }) => <AppHeader title={options.title ?? 'Catálogo de ejercicios'}
            backLabel="Volver" onBack={() => router.canGoBack() ? router.back() : router.navigate('/training')} /> }} />
        <Stack.Screen name="exercises/[id]" options={{ headerShown: true, title: 'Ficha del ejercicio',
          header: ({ options }) => <AppHeader title={options.title ?? 'Ficha del ejercicio'}
            backLabel="Volver" onBack={() => router.canGoBack() ? router.back() : router.navigate('/exercises')} /> }} />
      </Stack.Protected>
      {/* Siempre declarada: en release la guarda la deja no disponible (expo-router registra el archivo igual). */}
      <Stack.Protected guard={__DEV__}>
        <Stack.Screen name="dev-status" options={{ headerShown: true, title: 'Conexión de desarrollo',
          header: ({ options }) => <AppHeader title={options.title ?? 'Conexión de desarrollo'}
            backLabel="Volver" onBack={() => router.canGoBack() ? router.back() : router.replace(homeFor(access))} /> }} />
      </Stack.Protected>
    </Stack>
  );
}
