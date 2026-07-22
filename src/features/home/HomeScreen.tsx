import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { Button } from '@/src/components/ui/Button';
import { Screen } from '@/src/components/ui/Screen';
import { Text } from '@/src/components/ui/Text';
import { useStore } from '@/src/db/StoreContext';
import { categoryLabel } from '@/src/domain/categories';
import { formatRelativeDay } from '@/src/domain/format';
import type { AreaHandicap, HandicapSnapshot } from '@/src/domain/handicap';
import { getLastCompletedSession } from '@/src/services/drills';
import {
  formatDifferential,
  formatHandicap,
  getHandicapSnapshot,
} from '@/src/services/handicap';
import { getSettings } from '@/src/services/settings';
import { getActiveSession } from '@/src/services/sessions';
import { colors, spacing } from '@/src/theme';

const AREA_SHORT: Record<string, string> = {
  putting: 'Putting',
  short_game: 'Short',
  full_swing: 'Full',
};

export function HomeScreen() {
  const store = useStore();
  const router = useRouter();
  const enter = useRef(new Animated.Value(0)).current;
  const [displayName, setDisplayName] = useState('');
  const [handicap, setHandicap] = useState<HandicapSnapshot | null>(null);
  const [active, setActive] = useState<{
    id: string;
    drillName: string;
  } | null>(null);
  const [last, setLast] = useState<{
    drillId: string;
    drillName: string;
    startedAt: string;
    summaryScore: string | null;
    differential: number | null;
    categoryLabel: string;
  } | null>(null);

  const refresh = useCallback(async () => {
    const [settings, activeSession, lastSession, snap] = await Promise.all([
      getSettings(store),
      getActiveSession(store),
      getLastCompletedSession(store),
      getHandicapSnapshot(store),
    ]);
    setDisplayName(settings.displayName);
    setHandicap(snap);
    setActive(
      activeSession
        ? { id: activeSession.id, drillName: activeSession.drillName }
        : null,
    );
    if (lastSession) {
      setLast({
        drillId: lastSession.drillId,
        drillName: lastSession.drillName,
        startedAt: lastSession.startedAt,
        summaryScore: lastSession.summaryScore,
        differential: lastSession.differential,
        categoryLabel: categoryLabel(lastSession.drillCategory),
      });
    } else {
      setLast(null);
    }
  }, [store]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  useEffect(() => {
    enter.setValue(0);
    Animated.timing(enter, {
      toValue: 1,
      duration: 360,
      useNativeDriver: true,
    }).start();
  }, [enter, handicap?.overall, active?.id, last?.drillId]);

  const areas = handicap?.areas ?? [];
  const hasIndex = handicap?.overall != null;

  const support = (() => {
    if (active) return `In progress · ${active.drillName}`;
    if (last) {
      const bits = [
        last.drillName,
        last.summaryScore,
        formatRelativeDay(last.startedAt),
      ].filter(Boolean);
      const diff =
        last.differential != null
          ? ` · ${formatDifferential(last.differential)}`
          : '';
      return `${bits.join(' · ')}${diff}`;
    }
    if (displayName) return `Welcome back, ${displayName}`;
    return 'Play a game. Your index starts here.';
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
              label="Play a game"
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
      <Animated.View
        style={[
          styles.stage,
          {
            opacity: enter,
            transform: [
              {
                translateY: enter.interpolate({
                  inputRange: [0, 1],
                  outputRange: [12, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.brandBlock}>
          <Text variant="brandHero" style={styles.brandLine}>
            The
          </Text>
          <Text variant="brandHero" style={styles.brandLine}>
            Range
          </Text>
        </View>

        <View style={styles.indexBlock}>
          <Text muted style={styles.indexLabel}>
            Your index
          </Text>
          <Text
            style={[styles.indexValue, !hasIndex && styles.indexEmpty]}
            color={hasIndex ? colors.text : colors.border}
          >
            {hasIndex ? formatHandicap(handicap!.overall!) : '—'}
          </Text>
        </View>

        <View style={styles.rule} />

        <View style={styles.areas}>
          {areas.map((area) => (
            <AreaColumn key={area.category} area={area} />
          ))}
        </View>

        <Text muted style={styles.support}>
          {support}
        </Text>
      </Animated.View>
    </Screen>
  );
}

function AreaColumn({ area }: { area: AreaHandicap }) {
  const rated = area.index != null;
  return (
    <View style={styles.areaCol}>
      <Text
        style={[styles.areaValue, !rated && styles.areaEmpty]}
        color={rated ? colors.accent : colors.border}
      >
        {rated ? formatHandicap(area.index!) : '—'}
      </Text>
      <Text muted style={styles.areaLabel}>
        {AREA_SHORT[area.category] ?? categoryLabel(area.category)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingTop: spacing.sm,
  },
  stage: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  brandBlock: {
    marginBottom: spacing.xs,
  },
  brandLine: {
    marginBottom: -8,
  },
  indexBlock: {
    gap: 2,
  },
  indexLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    lineHeight: 20,
  },
  indexValue: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 56,
    lineHeight: 60,
    letterSpacing: -1.8,
  },
  indexEmpty: {
    color: colors.border,
  },
  rule: {
    height: 2,
    width: 40,
    backgroundColor: colors.accent,
    marginVertical: spacing.xs,
  },
  areas: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  areaCol: {
    flex: 1,
    gap: 4,
  },
  areaValue: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.6,
  },
  areaEmpty: {
    color: colors.border,
  },
  areaLabel: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    lineHeight: 18,
  },
  support: {
    marginTop: spacing.sm,
    fontSize: 16,
    lineHeight: 22,
    maxWidth: 320,
  },
});
