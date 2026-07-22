import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
  useFonts,
} from '@expo-google-fonts/dm-sans';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Text } from '@/src/components/ui/Text';
import { getAppStore } from '@/src/db/client';
import type { AppStore } from '@/src/db/memoryStore';
import { StoreProvider } from '@/src/db/StoreContext';
import { bootstrapApp } from '@/src/services/bootstrap';
import { colors } from '@/src/theme';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  });
  const [store, setStore] = useState<AppStore | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const appStore = await getAppStore();
        await bootstrapApp(appStore);
        if (!cancelled) setStore(appStore);
      } catch (e) {
        if (!cancelled) {
          setBootError(
            e instanceof Error ? e.message : 'Failed to open local database',
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (fontsLoaded && (store || bootError)) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, store, bootError]);

  if (bootError) {
    return (
      <SafeAreaProvider>
        <View style={styles.center}>
          <Text variant="title">Couldn’t open local data</Text>
          <Text muted style={styles.error}>
            {bootError}
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  if (!fontsLoaded || !store) {
    return (
      <SafeAreaProvider>
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StoreProvider store={store}>
        <Stack
          screenOptions={{
            headerShadowVisible: false,
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.accent,
            headerTitleStyle: { fontFamily: 'DMSans_700Bold', color: colors.text },
            contentStyle: { backgroundColor: colors.bg },
            headerBackTitle: 'Back',
            headerBackButtonDisplayMode: 'minimal',
          }}
        >
          <Stack.Screen
            name="(tabs)"
            options={{ headerShown: false, title: 'Home' }}
          />
          <Stack.Screen name="drill/[id]" options={{ title: 'Drill' }} />
          <Stack.Screen name="session/active" options={{ title: 'Session' }} />
          <Stack.Screen name="session/[id]" options={{ title: 'Session' }} />
        </Stack>
      </StoreProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    padding: 24,
    gap: 12,
  },
  error: {
    textAlign: 'center',
  },
});
