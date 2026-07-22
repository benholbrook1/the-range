import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/src/components/ui/Button';
import { Screen } from '@/src/components/ui/Screen';
import { Text } from '@/src/components/ui/Text';
import { useStore } from '@/src/db/StoreContext';
import { categoryLabel } from '@/src/domain/categories';
import { formatRelativeDay } from '@/src/domain/format';
import type { HandicapSnapshot } from '@/src/domain/handicap';
import { getLastCompletedSession } from '@/src/services/drills';
import {
  formatDifferential,
  formatHandicap,
  getHandicapSnapshot,
} from '@/src/services/handicap';
import { getSettings } from '@/src/services/settings';
import { getActiveSession } from '@/src/services/sessions';
import { colors, spacing } from '@/src/theme';

export function HomeScreen() {
  const store = useStore();
  const router = useRouter();
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const boardOpacity = useRef(new Animated.Value(0)).current;
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
    brandOpacity.setValue(0);
    boardOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(brandOpacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(boardOpacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }, [brandOpacity, boardOpacity, handicap?.overall, active?.id]);

  const ratedCount =
    handicap?.areas.filter((a) => a.index != null).length ?? 0;

  return (
    <Screen
      scroll
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
      <View style={styles.shell}>
        <View style={styles.rail} />
        <View style={styles.stage}>
          <Animated.View style={{ opacity: brandOpacity }}>
            <Text style={styles.mark} accessibilityRole="header">
              The Range
            </Text>
            {displayName ? (
              <Text muted style={styles.welcome}>
                {displayName}
              </Text>
            ) : null}
          </Animated.View>

          <Animated.View style={[styles.board, { opacity: boardOpacity }]}>
            <Text style={styles.kicker}>Handicap</Text>
            {handicap?.overall != null ? (
              <Text style={styles.overall} color={colors.accent}>
                {formatHandicap(handicap.overall)}
              </Text>
            ) : (
              <Text style={styles.overallMuted}>—</Text>
            )}
            <Text muted style={styles.overallHint}>
              {ratedCount === 0
                ? 'Play games to build your index'
                : 'Overall · best recent form'}
            </Text>

            <View style={styles.areas}>
              {(handicap?.areas ?? []).map((area) => (
                <Pressable
                  key={area.category}
                  onPress={() => router.push('/(tabs)/drills')}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.areaRow,
                    pressed && styles.areaPressed,
                  ]}
                >
                  <View style={styles.areaText}>
                    <Text variant="subtitle">{categoryLabel(area.category)}</Text>
                    <Text muted variant="secondary">
                      {area.rounds === 0
                        ? 'No rounds yet'
                        : `${area.rounds} round${area.rounds === 1 ? '' : 's'} · best ${area.usedCount}`}
                    </Text>
                  </View>
                  <Text style={styles.areaIndex} color={colors.accent}>
                    {area.index == null ? '—' : formatHandicap(area.index)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>

          <Animated.View style={[styles.status, { opacity: boardOpacity }]}>
            {active ? (
              <>
                <Text style={styles.kicker}>In progress</Text>
                <Text style={styles.statusDetail}>{active.drillName}</Text>
              </>
            ) : last ? (
              <>
                <Text style={styles.kicker}>Last round</Text>
                <Text style={styles.statusDetail}>
                  {last.drillName}
                  {last.summaryScore ? ` · ${last.summaryScore}` : ''}
                  {` · ${formatRelativeDay(last.startedAt)}`}
                </Text>
                {last.differential != null ? (
                  <Text muted style={styles.diffLine}>
                    {last.categoryLabel} differential{' '}
                    {formatDifferential(last.differential)}
                  </Text>
                ) : null}
              </>
            ) : (
              <>
                <Text style={styles.kicker}>Get started</Text>
                <Text style={styles.statusDetail}>
                  Each game posts a differential — just like golf.
                </Text>
              </>
            )}
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
    flexGrow: 1,
    flexDirection: 'row',
    minHeight: 520,
  },
  rail: {
    width: 8,
    backgroundColor: colors.accent,
  },
  stage: {
    flex: 1,
    paddingHorizontal: spacing.pageX,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  mark: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -1,
    color: colors.text,
  },
  welcome: {
    marginTop: 4,
    fontSize: 15,
  },
  board: {
    gap: spacing.xs,
  },
  kicker: {
    fontFamily: 'SpaceGrotesk_500Medium',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.accent,
  },
  overall: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 64,
    lineHeight: 68,
    letterSpacing: -2,
  },
  overallMuted: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 64,
    lineHeight: 68,
    letterSpacing: -2,
    color: colors.border,
  },
  overallHint: {
    marginBottom: spacing.sm,
  },
  areas: {
    borderTopWidth: 2,
    borderTopColor: colors.accent,
    marginTop: spacing.xs,
  },
  areaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  areaPressed: {
    opacity: 0.65,
  },
  areaText: {
    flex: 1,
    gap: 2,
  },
  areaIndex: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.6,
  },
  status: {
    gap: 4,
    paddingTop: spacing.xs,
  },
  statusDetail: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 17,
    lineHeight: 24,
    color: colors.text,
  },
  diffLine: {
    marginTop: 2,
  },
});
