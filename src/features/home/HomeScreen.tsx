import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/src/components/ui/Button';
import { Screen } from '@/src/components/ui/Screen';
import { Text } from '@/src/components/ui/Text';
import { useStore } from '@/src/db/StoreContext';
import { formatRelativeDay } from '@/src/domain/format';
import {
  getLastCompletedSession,
} from '@/src/services/drills';
import { getSettings } from '@/src/services/settings';
import { getActiveSession } from '@/src/services/sessions';
import { spacing } from '@/src/theme';

export function HomeScreen() {
  const store = useStore();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDrillName, setActiveDrillName] = useState<string | null>(null);
  const [last, setLast] = useState<{
    drillId: string;
    drillName: string;
    startedAt: string;
  } | null>(null);

  const refresh = useCallback(async () => {
    const [settings, active, lastSession] = await Promise.all([
      getSettings(store),
      getActiveSession(store),
      getLastCompletedSession(store),
    ]);
    setDisplayName(settings.displayName);
    setActiveId(active?.id ?? null);
    setActiveDrillName(active?.drillName ?? null);
    setLast(lastSession);
  }, [store]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return (
    <Screen>
      <View style={styles.hero}>
        <Text variant="brand">The Range</Text>
        <Text muted style={styles.status}>
          {displayName
            ? `Hi ${displayName}. `
            : ''}
          {last
            ? `Last session: ${formatRelativeDay(last.startedAt)}`
            : 'Ready when you are.'}
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          label="Start a drill"
          onPress={() => router.push('/(tabs)/drills')}
        />
        {activeId ? (
          <Button
            label={`Continue: ${activeDrillName ?? 'session'}`}
            variant="secondary"
            onPress={() =>
              router.push({
                pathname: '/session/active',
                params: { sessionId: activeId },
              })
            }
          />
        ) : null}
        {!activeId && last ? (
          <Button
            label={`Repeat: ${last.drillName}`}
            variant="ghost"
            onPress={() => router.push(`/drill/${last.drillId}`)}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: spacing.lg,
    gap: spacing.xs,
  },
  status: {
    marginTop: spacing.xs,
  },
  actions: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
});
