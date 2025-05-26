import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    // If user is not authenticated and trying to access protected routes
    if (!user && !inAuthGroup) {
      console.log('Unauthorized access attempt, redirecting to login');
      router.replace('/(auth)/login');
    }
    // If user is authenticated and in auth group (login/register)
    else if (user && inAuthGroup) {
      console.log('Authenticated user in auth group, redirecting to main');
      router.replace('/(tabs)');
    }
  }, [user, segments, isLoading]);

  // Show nothing while loading
  if (isLoading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="diagnostic" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
