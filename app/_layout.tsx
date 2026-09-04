import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { WorkoutProvider, useWorkouts } from '@/context/WorkoutContext';
import { LoadingState } from '@/components/ui';
import { colors } from '@/theme';

function WorkoutGate({ children }: { children: React.ReactNode }) {
  const { loading } = useWorkouts();
  if (loading) {
    return <LoadingState message="Loading your workouts…" fullScreen />;
  }
  return <>{children}</>;
}

function NavigationGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, bootstrapping } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (bootstrapping) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, bootstrapping, segments, router]);

  if (bootstrapping) {
    return <LoadingState message="Loading Velocity Fit…" fullScreen />;
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
