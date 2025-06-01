import { Stack, Redirect } from 'expo-router';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import authService from './services/auth_service';
import diagnosticService from './services/user_service';
import { View, ActivityIndicator } from 'react-native';

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize services only once
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      if (!isMounted) return;
      
      try {
        await authService.initialize();
        await diagnosticService.initialize();
      } catch (error) {
        console.error('Error initializing services:', error);
      } finally {
        if (isMounted) {
          setIsInitialized(true);
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle auth state changes
  useEffect(() => {
    if (!isInitialized || isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, segments, isLoading, isInitialized]);

  // Show loading indicator while initializing or loading auth state
  if (!isInitialized || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ffd33d" />
      </View>
    );
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
