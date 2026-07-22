import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/src/components/ui/Button';
import { Screen } from '@/src/components/ui/Screen';
import { Text } from '@/src/components/ui/Text';
import { useStore } from '@/src/db/StoreContext';
import { formatRelativeDay } from '@/src/domain/format';
import { getLastCompletedSession, listDrills } from '@/src/services/drills';
import { getSettings } from '@/src/services/settings';
import { getActiveSession } from '@/src/services/sessions';
import { colors, spacing } from '@/src/theme';

export function HomeScreen() {
  const store = useStore();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [drillCount, setDrillCount] = useState(0);
  const [active, setActive] = useState<{
    id: string;
    drillName: string;
  } | null>(null);
  const [last, setLast] = useState<{
    drillId: string;
    drillName: string;
    startedAt: string;
    summaryScore: string | null;
    sessionId: string;
  } | null>(null);

  const refresh = useCallback(async () => {
    const [settings, activeSession, lastSession, drills] = await Promise.all([
      getSettings(store),
      getActiveSession(store),
      getLastCompletedSession(store),
      listDrills(store),
    ]);
    setDisplayName(settings.displayName);
    setDrillCount(drills.length);
    setActive(
      activeSession
        ? { id: activeSession.id, drillName: activeSession.drillName }
        : null,
    );
    setLast(lastSession);
  }, [store]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const statusLine = (() => {
    const greeting = displayName ? `Hi ${displayName}. ` : '';
    if (active) return `${greeting}You have a session in progress.`;
    if (last) {
      return `${greeting}Last session ${formatRelativeDay(last.startedAt)}${
        last.summaryScore ? ` · ${last.summaryScore}` : ''
      }.`;
    }
    return `${greeting}Ready when you are.`;
  })();

  return (
    <Screen>
      <View style={styles.hero}>
        <Text variant="brand">The Range</Text>
        <Text muted style={styles.status}>
          {statusLine}
        </Text>
      </View>

      <View style={styles.actions}>
        {active ? (
          <Button
            label={`Continue ${active.drillName}`}
            onPress={() =>
              router.push({
                pathname: '/session/active',
                params: { sessionId: active.id },
              })
            }
          />
        ) : (
          <Button
            label="Browse drills"
            onPress={() => router.push('/(tabs)/drills')}
          />
        )}

        {!active && last ? (
          <Button
            label={`Repeat ${last.drillName}`}
            variant="secondary"
            onPress={() => router.push(`/drill/${last.drillId}`)}
          />
        ) : null}

        {active ? (
          <Button
            label="Browse drills"
            variant="ghost"
            onPress={() => router.push('/(tabs)/drills')}
          />
        ) : null}
      </View>

      <View style={styles.links}>
        {last ? (
          <Pressable
            onPress={() => router.push(`/session/${last.sessionId}`)}
            accessibilityRole="button"
            style={styles.linkRow}
          >
            <Text variant="secondary" color={colors.accent}>
              View last session
            </Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => router.push('/(tabs)/history')}
          accessibilityRole="button"
          style={styles.linkRow}
        >
          <Text variant="secondary" color={colors.accent}>
            Open history
          </Text>
        </Pressable>
        {!last && drillCount > 0 ? (
          <Text muted variant="secondary" style={styles.hint}>
            {drillCount} drills ready · pick one and tap Start
          </Text>
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
  links: {
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  linkRow: {
    minHeight: 44,
    justifyContent: 'center',
  },
  hint: {
    marginTop: spacing.sm,
  },
});
