import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="diagnostic" options={{ title: "Diagnostic Report" }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}
