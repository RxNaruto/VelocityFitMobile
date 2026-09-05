import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { BrandSplash } from '@/components/BrandSplash';

export default function Index() {
  const { isAuthenticated, bootstrapping } = useAuth();

  if (bootstrapping) {
    return <BrandSplash />;
  }

  return <Redirect href={isAuthenticated ? '/(tabs)' : '/(auth)/welcome'} />;
}