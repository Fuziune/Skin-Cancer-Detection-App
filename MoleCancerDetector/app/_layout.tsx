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

    // Only redirect if:
    // 1. User is authenticated AND
    // 2. Currently in auth group (login/register) AND
    // 3. Not already in tabs group
    if (user && inAuthGroup && !inTabsGroup) {
      console.log('Navigating to tabs after successful auth');
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
