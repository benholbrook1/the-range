import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/src/components/ui/Button';
import { Screen } from '@/src/components/ui/Screen';
import { Text } from '@/src/components/ui/Text';
import { useStore } from '@/src/db/StoreContext';
import { formatRelativeDay } from '@/src/domain/format';
import { getLastCompletedSession } from '@/src/services/drills';
import { getSettings } from '@/src/services/settings';
import { getActiveSession } from '@/src/services/sessions';
import { spacing } from '@/src/theme';

/**
 * Home = one composition: brand, status, one primary action.
 * Resume or repeat is secondary — never a link farm.
 */
export function HomeScreen() {
  const store = useStore();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [active, setActive] = useState<{
    id: string;
    drillName: string;
  } | null>(null);
  const [last, setLast] = useState<{
    drillId: string;
    drillName: string;
    startedAt: string;
    summaryScore: string | null;
  } | null>(null);

  const refresh = useCallback(async () => {
    const [settings, activeSession, lastSession] = await Promise.all([
      getSettings(store),
      getActiveSession(store),
      getLastCompletedSession(store),
    ]);
    setDisplayName(settings.displayName);
    setActive(
      activeSession
        ? { id: activeSession.id, drillName: activeSession.drillName }
        : null,
    );
    setLast(
      lastSession
        ? {
            drillId: lastSession.drillId,
            drillName: lastSession.drillName,
            startedAt: lastSession.startedAt,
            summaryScore: lastSession.summaryScore,
          }
        : null,
    );
  }, [store]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const status = (() => {
    if (active) {
      return displayName
        ? `${displayName} · session in progress`
        : 'Session in progress';
    }
    if (last) {
      const when = formatRelativeDay(last.startedAt);
      const score = last.summaryScore ? ` · ${last.summaryScore}` : '';
      return displayName
        ? `${displayName} · last practiced ${when}${score}`
        : `Last practiced ${when}${score}`;
    }
    return displayName
      ? `${displayName} · ready to practice`
      : 'Ready to practice';
  })();

  return (
    <Screen>
      <View style={styles.hero}>
        <Text variant="brand">The Range</Text>
        <Text muted style={styles.status}>
          {status}
        </Text>
      </View>

      <View style={styles.actions}>
        {active ? (
          <>
            <Button
              label="Continue session"
              onPress={() =>
                router.push({
                  pathname: '/session/active',
                  params: { sessionId: active.id },
                })
              }
            />
            <Text muted variant="secondary" style={styles.caption}>
              {active.drillName}
            </Text>
          </>
        ) : (
          <>
            <Button
              label="Find a drill"
              onPress={() => router.push('/(tabs)/drills')}
            />
            {last ? (
              <Button
                label="Repeat last drill"
                variant="secondary"
                onPress={() => router.push(`/drill/${last.drillId}`)}
              />
            ) : (
              <Text muted variant="secondary" style={styles.caption}>
                Pick a drill, then tap Start
              </Text>
            )}
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingBottom: spacing.lg,
    minHeight: 220,
  },
  status: {
    marginTop: spacing.sm,
    maxWidth: 320,
  },
  actions: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  caption: {
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
