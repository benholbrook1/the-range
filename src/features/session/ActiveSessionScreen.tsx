import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/src/components/ui/Button';
import { Screen } from '@/src/components/ui/Screen';
import { Text } from '@/src/components/ui/Text';
import { useStore } from '@/src/db/StoreContext';
import { createAttemptPayload, summarizeAttempts } from '@/src/domain/scoring';
import type { Attempt, Drill, Session } from '@/src/domain/types';
import {
  completeSession,
  getSessionDetail,
  logAttempt,
} from '@/src/services/sessions';
import { colors, spacing } from '@/src/theme';

export function ActiveSessionScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const store = useStore();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [drill, setDrill] = useState<Drill | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [notes, setNotes] = useState('');
  const [flash, setFlash] = useState(false);
  const [repsInput, setRepsInput] = useState('1');
  const [pointsInput, setPointsInput] = useState('1');

  const refresh = useCallback(async () => {
    if (!sessionId) return;
    const detail = await getSessionDetail(store, sessionId);
    setSession(detail.session);
    setDrill(detail.drill);
    setAttempts(detail.attempts);
    if (detail.session.notes) setNotes(detail.session.notes);
  }, [sessionId, store]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const summary = useMemo(() => {
    if (!drill) return null;
    return summarizeAttempts(drill.scoring, attempts);
  }, [drill, attempts]);

  const onLog = useCallback(
    async (input: { made?: boolean; count?: number; points?: number }) => {
      if (!session || !drill) return;
      if (session.status !== 'active') return;
      const payload = createAttemptPayload(drill.scoring, input);
      await logAttempt(store, session.id, payload);
      setFlash(true);
      setTimeout(() => setFlash(false), 180);
      await refresh();
    },
    [session, drill, store, refresh],
  );

  const onComplete = useCallback(async () => {
    if (!session) return;
    try {
      const completed = await completeSession(store, session.id, notes);
      router.replace(`/session/${completed.id}`);
    } catch (e) {
      Alert.alert(
        'Could not save',
        e instanceof Error ? e.message : 'Unknown error',
      );
    }
  }, [session, store, notes, router]);

  if (!session || !drill) {
    return (
      <Screen>
        <Text>Loading session…</Text>
      </Screen>
    );
  }

  if (session.status !== 'active') {
    return (
      <Screen>
        <Text variant="title">Session finished</Text>
        <Button
          label="View details"
          onPress={() => router.replace(`/session/${session.id}`)}
          style={{ marginTop: spacing.md }}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Text muted variant="secondary">
        {drill.name}
      </Text>
      <Text
        variant="brand"
        style={[styles.counter, flash ? styles.flash : null]}
      >
        {summary?.label ?? '0'}
      </Text>
      <Text muted>
        {attempts.length} logged
        {drill.scoring.type === 'makes_out_of'
          ? ` · ${drill.scoring.attempts} target`
          : ''}
      </Text>

      <View style={styles.controls}>
        {drill.scoring.type === 'makes_out_of' ? (
          <View style={styles.row}>
            <Button
              label="Make"
              onPress={() => onLog({ made: true })}
              style={styles.half}
            />
            <Button
              label="Miss"
              variant="secondary"
              onPress={() => onLog({ made: false })}
              style={styles.half}
            />
          </View>
        ) : null}

        {drill.scoring.type === 'reps' ? (
          <View style={styles.stack}>
            <TextInput
              value={repsInput}
              onChangeText={setRepsInput}
              keyboardType="number-pad"
              style={styles.input}
            />
            <Button
              label="Add reps"
              onPress={() => onLog({ count: Number(repsInput) || 0 })}
            />
          </View>
        ) : null}

        {drill.scoring.type === 'score_total' ? (
          <View style={styles.stack}>
            <TextInput
              value={pointsInput}
              onChangeText={setPointsInput}
              keyboardType="number-pad"
              style={styles.input}
            />
            <Button
              label="Add points"
              onPress={() => onLog({ points: Number(pointsInput) || 0 })}
            />
          </View>
        ) : null}
      </View>

      <Text variant="subtitle" style={styles.section}>
        Notes
      </Text>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Optional notes"
        placeholderTextColor={colors.textMuted}
        style={[styles.input, styles.notes]}
        multiline
      />

      <Button label="End & save" onPress={onComplete} style={styles.save} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  counter: {
    marginTop: spacing.sm,
  },
  flash: {
    color: colors.success,
  },
  controls: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  half: {
    flex: 1,
  },
  stack: {
    gap: spacing.sm,
  },
  input: {
    minHeight: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    fontSize: 18,
    color: colors.text,
    fontFamily: 'DMSans_400Regular',
    paddingVertical: spacing.xs,
  },
  notes: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  section: {
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  save: {
    marginTop: spacing.lg,
  },
});
