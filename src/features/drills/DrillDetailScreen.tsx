import {
  useFocusEffect,
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from 'expo-router';
import React, { useCallback, useLayoutEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { DrillVisual } from '@/src/components/drills/DrillVisual';
import { Button } from '@/src/components/ui/Button';
import { Screen } from '@/src/components/ui/Screen';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { Text } from '@/src/components/ui/Text';
import { useStore } from '@/src/db/StoreContext';
import { categoryLabel } from '@/src/domain/categories';
import { describeScoring, isLowerBetter } from '@/src/domain/scoring';
import type { Drill, Session } from '@/src/domain/types';
import {
  getDrill,
  getLastScore,
  getPersonalBest,
} from '@/src/services/drills';
import {
  completeSession,
  getActiveSession,
  startSession,
} from '@/src/services/sessions';
import { spacing } from '@/src/theme';

export function DrillDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useStore();
  const router = useRouter();
  const navigation = useNavigation();
  const [drill, setDrill] = useState<Drill | null>(null);
  const [best, setBest] = useState<string | null>(null);
  const [last, setLast] = useState<string | null>(null);
  const [active, setActive] = useState<Session | null>(null);
  const [starting, setStarting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const [d, activeSession] = await Promise.all([
      getDrill(store, id),
      getActiveSession(store),
    ]);
    setDrill(d);
    setActive(activeSession);
    if (d) {
      const [pb, ls] = await Promise.all([
        getPersonalBest(store, d.id),
        getLastScore(store, d.id),
      ]);
      setBest(pb ? pb.label : null);
      setLast(ls ? ls.label : null);
    }
  }, [id, store]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useLayoutEffect(() => {
    if (drill) {
      navigation.setOptions({ title: drill.name });
    }
  }, [navigation, drill]);

  const goActive = useCallback(
    (sessionId: string) => {
      router.push({
        pathname: '/session/active',
        params: { sessionId },
      });
    },
    [router],
  );

  const begin = useCallback(
    async (discardActive?: boolean) => {
      if (!drill) return;
      const session = await startSession(store, drill.id, { discardActive });
      goActive(session.id);
    },
    [drill, store, goActive],
  );

  const onPrimary = useCallback(async () => {
    if (!drill) return;
    setStarting(true);
    try {
      const current = await getActiveSession(store);
      if (current && current.drillId === drill.id) {
        goActive(current.id);
        return;
      }
      if (current) {
        Alert.alert(
          'Session in progress',
          `“${current.drillName}” is still active.`,
          [
            {
              text: 'Continue that session',
              onPress: () => goActive(current.id),
            },
            {
              text: 'Save & start this',
              onPress: () => {
                void (async () => {
                  await completeSession(store, current.id);
                  await begin(false);
                })();
              },
            },
            {
              text: 'Discard & start this',
              style: 'destructive',
              onPress: () => {
                void begin(true);
              },
            },
            { text: 'Cancel', style: 'cancel' },
          ],
        );
        return;
      }
      await begin(false);
    } catch (e) {
      Alert.alert(
        'Could not start',
        e instanceof Error ? e.message : 'Unknown error',
      );
    } finally {
      setStarting(false);
    }
  }, [drill, store, begin, goActive]);

  if (!drill) {
    return (
      <Screen>
        <Text>Loading…</Text>
      </Screen>
    );
  }

  const sameActive = active?.drillId === drill.id;
  const primaryLabel = sameActive ? 'Continue session' : 'Start game';
  const bestHint = isLowerBetter(drill.scoring) ? ' (low)' : '';

  return (
    <Screen
      scroll
      footer={
        <Button label={primaryLabel} onPress={onPrimary} disabled={starting} />
      }
    >
      {drill.visual ? (
        <DrillVisual id={drill.visual} size="detail" style={styles.visual} />
      ) : null}

      <Text muted style={styles.meta}>
        {categoryLabel(drill.category)} · {drill.estimatedMinutes} min
      </Text>

      <SectionHeader title="How to play" />
      {drill.instructions.map((line, index) => (
        <Text key={index} style={styles.instruction}>
          {index + 1}. {line}
        </Text>
      ))}

      <SectionHeader
        title="Scoring"
        subtitle={describeScoring(drill.scoring)}
      />

      <View style={styles.stats}>
        <Text muted>
          {best
            ? `Personal best${bestHint}: ${best}`
            : 'No personal best yet'}
        </Text>
        <Text muted>
          {last ? `Last score: ${last}` : 'No previous score yet'}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  visual: {
    marginBottom: spacing.md,
  },
  meta: {
    marginBottom: spacing.xs,
  },
  instruction: {
    marginBottom: spacing.xs,
  },
  stats: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
});
