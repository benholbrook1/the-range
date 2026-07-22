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
import { colors, spacing } from '@/src/theme';

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
    if (active) return active.drillName;
    if (last) {
      const when = formatRelativeDay(last.startedAt);
      return last.summaryScore
        ? `${last.drillName} · ${last.summaryScore} · ${when}`
        : `${last.drillName} · ${when}`;
    }
    return displayName ? `Welcome, ${displayName}` : 'Practice starts here';
  })();

  const eyebrow = active
    ? 'In progress'
    : last
      ? 'Last session'
      : 'The practice notebook';

  return (
    <Screen
      footer={
        active ? (
          <Button
            label="Continue session"
            onPress={() =>
              router.push({
                pathname: '/session/active',
                params: { sessionId: active.id },
              })
            }
          />
        ) : (
          <>
            <Button
              label="Find a drill"
              onPress={() => router.push('/(tabs)/drills')}
            />
            {last ? (
              <Button
                label={`Repeat ${last.drillName}`}
                variant="secondary"
                onPress={() => router.push(`/drill/${last.drillId}`)}
              />
            ) : null}
          </>
        )
      }
    >
      <View style={styles.stage}>
        <Text variant="secondary" color={colors.accent} style={styles.eyebrow}>
          {eyebrow}
        </Text>
        <Text variant="brandHero" style={styles.brand}>
          The Range
        </Text>
        <View style={styles.rule} />
        <Text muted style={styles.status}>
          {status}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: spacing.xl,
  },
  eyebrow: {
    marginBottom: spacing.sm,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: 0.4,
  },
  brand: {
    marginBottom: spacing.md,
  },
  rule: {
    width: 48,
    height: 3,
    backgroundColor: colors.accent,
    marginBottom: spacing.md,
  },
  status: {
    maxWidth: 300,
    fontSize: 17,
    lineHeight: 24,
  },
});
