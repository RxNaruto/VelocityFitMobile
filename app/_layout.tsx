import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { WorkoutProvider, useWorkouts } from '@/context/WorkoutContext';
import { BrandSplash } from '@/components/BrandSplash';
import { colors } from '@/theme';

// Hold the native splash until the stored session has been read, so the logo
// never flashes away into an empty screen.
void SplashScreen.preventAutoHideAsync().catch(() => undefined);

function WorkoutGate({ children }: { children: React.ReactNode }) {
  const { loading } = useWorkouts();
  if (loading) {
    return <BrandSplash message="Loading your workouts…" />;
  }
  return <>{children}</>;
}

function NavigationGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, bootstrapping } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (bootstrapping) return;
    void SplashScreen.hideAsync().catch(() => undefined);
  }, [bootstrapping]);

  useEffect(() => {
    if (bootstrapping) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, bootstrapping, segments, router]);

  if (bootstrapping) {
    return <BrandSplash />;
  }

  if (isAuthenticated) {
    return (
      <WorkoutProvider>
        <WorkoutGate>{children}</WorkoutGate>
      </WorkoutProvider>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <NavigationGuard>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" options={{ animation: 'fade' }} />
          <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        </Stack>
      </NavigationGuard>
    </AuthProvider>
  );
}