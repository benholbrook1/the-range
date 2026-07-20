import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Button } from '@/src/components/ui/Button';
import { Screen } from '@/src/components/ui/Screen';
import { Text } from '@/src/components/ui/Text';
import { useStore } from '@/src/db/StoreContext';
import { categoryLabel } from '@/src/domain/categories';
import { describeScoring } from '@/src/domain/scoring';
import type { Drill } from '@/src/domain/types';
import {
  getDrill,
  getLastScore,
  getPersonalBest,
} from '@/src/services/drills';
import {
  getActiveSession,
  startSession,
} from '@/src/services/sessions';
import { spacing } from '@/src/theme';

export function DrillDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useStore();
  const router = useRouter();
  const [drill, setDrill] = useState<Drill | null>(null);
  const [best, setBest] = useState<string | null>(null);
  const [last, setLast] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const d = await getDrill(store, id);
    setDrill(d);
    if (d) {
      const [pb, ls] = await Promise.all([
        getPersonalBest(store, d.id),
        getLastScore(store, d.id),
      ]);
      setBest(pb ? pb.label : null);
      setLast(ls ? ls.label : null);
    }
  }, [id, store]);

  useEffect(() => {
    void load();
  }, [load]);

  const begin = useCallback(
    async (discardActive?: boolean) => {
      if (!drill) return;
      const session = await startSession(store, drill.id, { discardActive });
      router.push({
        pathname: '/session/active',
        params: { sessionId: session.id },
      });
    },
    [drill, store, router],
  );

  const onStart = useCallback(async () => {
    if (!drill) return;
    setStarting(true);
    try {
      const active = await getActiveSession(store);
      if (active) {
        Alert.alert(
          'Session in progress',
          `“${active.drillName}” is still active. Continue it, or discard it and start this drill.`,
          [
            {
              text: 'Continue',
              onPress: () =>
                router.push({
                  pathname: '/session/active',
                  params: { sessionId: active.id },
                }),
            },
            {
              text: 'Discard & start',
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
  }, [drill, store, router, begin]);

  if (!drill) {
    return (
      <Screen>
        <Text>Loading…</Text>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Text variant="title">{drill.name}</Text>
      <Text muted style={styles.meta}>
        {categoryLabel(drill.category)} · {drill.estimatedMinutes} min
      </Text>

      <Text variant="subtitle" style={styles.section}>
        Setup
      </Text>
      {drill.instructions.map((line, index) => (
        <Text key={index} style={styles.instruction}>
          {index + 1}. {line}
        </Text>
      ))}

      <Text variant="subtitle" style={styles.section}>
        Scoring
      </Text>
      <Text muted>{describeScoring(drill.scoring)}</Text>

      <Text muted style={styles.best}>
        {best ? `Personal best: ${best}` : 'No personal best yet'}
      </Text>
      <Text muted>
        {last ? `Last score: ${last}` : 'No previous score yet'}
      </Text>

      <View style={styles.cta}>
        <Button label="Start" onPress={onStart} disabled={starting} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  meta: {
    marginTop: spacing.xs,
  },
  section: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  instruction: {
    marginBottom: spacing.xs,
  },
  best: {
    marginTop: spacing.md,
  },
  cta: {
    marginTop: spacing.lg,
  },
});
