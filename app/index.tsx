import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { LoadingState } from '@/components/ui';

export default function Index() {
  const { isAuthenticated, bootstrapping } = useAuth();

  if (bootstrapping) {
    return <LoadingState message="Loading Velocity Fit…" fullScreen />;
  }

  return <Redirect href={isAuthenticated ? '/(tabs)' : '/(auth)/login'} />;
}
