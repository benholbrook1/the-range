import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

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
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandY = useRef(new Animated.Value(18)).current;
  const statusOpacity = useRef(new Animated.Value(0)).current;
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

  useEffect(() => {
    brandOpacity.setValue(0);
    brandY.setValue(18);
    statusOpacity.setValue(0);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(brandOpacity, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.timing(brandY, {
          toValue: 0,
          duration: 320,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(statusOpacity, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start();
  }, [brandOpacity, brandY, statusOpacity, active?.id, last?.drillId]);

  const kicker = active
    ? 'Session open'
    : last
      ? 'Last round'
      : 'Ready when you are';

  const detail = (() => {
    if (active) return active.drillName;
    if (last) {
      const when = formatRelativeDay(last.startedAt);
      return `${last.drillName} · ${when}`;
    }
    return displayName ? `Welcome, ${displayName}` : 'Pick a game and start logging.';
  })();

  return (
    <Screen
      style={styles.screen}
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
              label="Find a game"
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
      <View style={styles.shell}>
        <View style={styles.rail} />
        <View style={styles.stage}>
          <Animated.View
            accessible
            accessibilityRole="header"
            accessibilityLabel="The Range"
            style={{
              opacity: brandOpacity,
              transform: [{ translateY: brandY }],
            }}
          >
            <Text variant="brandHero" style={styles.brandLine}>
              The
            </Text>
            <Text variant="brandHero" style={styles.brandLine}>
              Range
            </Text>
          </Animated.View>

          <Animated.View style={[styles.statusBlock, { opacity: statusOpacity }]}>
            <Text style={styles.kicker}>{kicker}</Text>
            {last?.summaryScore && !active ? (
              <Text style={styles.heroScore} color={colors.accent}>
                {last.summaryScore}
              </Text>
            ) : null}
            <Text style={styles.detail}>{detail}</Text>
          </Animated.View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  shell: {
    flex: 1,
    flexDirection: 'row',
  },
  rail: {
    width: 8,
    backgroundColor: colors.accent,
  },
  stage: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.pageX,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  brandLine: {
    marginBottom: -6,
  },
  statusBlock: {
    gap: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 2,
    borderTopColor: colors.accent,
    maxWidth: 320,
  },
  kicker: {
    fontFamily: 'SpaceGrotesk_500Medium',
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.accent,
  },
  heroScore: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 48,
    lineHeight: 52,
    letterSpacing: -1.5,
  },
  detail: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 17,
    lineHeight: 24,
    color: colors.textMuted,
  },
});
