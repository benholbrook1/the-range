import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/src/components/ui/Button';
import { ProgressBar } from '@/src/components/ui/ProgressBar';
import { Screen } from '@/src/components/ui/Screen';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { Text } from '@/src/components/ui/Text';
import { useStore } from '@/src/db/StoreContext';
import {
  createAttemptPayload,
  summarizeAttempts,
  targetAttemptCount,
} from '@/src/domain/scoring';
import type { Attempt, Drill, Session } from '@/src/domain/types';
import {
  completeSession,
  discardActiveSession,
  getSessionDetail,
  logAttempt,
  undoLastAttempt,
} from '@/src/services/sessions';
import { colors, spacing } from '@/src/theme';

export function ActiveSessionScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const store = useStore();
  const router = useRouter();
  const navigation = useNavigation();
  const [session, setSession] = useState<Session | null>(null);
  const [drill, setDrill] = useState<Drill | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [notes, setNotes] = useState('');
  const [flash, setFlash] = useState(false);
  const [repsInput, setRepsInput] = useState('1');
  const [pointsInput, setPointsInput] = useState('1');
  const [offeredComplete, setOfferedComplete] = useState(false);

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

  useLayoutEffect(() => {
    if (drill) {
      navigation.setOptions({ title: drill.name });
    }
  }, [navigation, drill]);

  const summary = useMemo(() => {
    if (!drill) return null;
    return summarizeAttempts(drill.scoring, attempts);
  }, [drill, attempts]);

  const targetAttempts = drill ? targetAttemptCount(drill.scoring) : null;
  const isTargetReached =
    targetAttempts != null && attempts.length >= targetAttempts;

  const saveAndFinish = useCallback(async () => {
    if (!session) return;
    const completed = await completeSession(store, session.id, notes);
    router.replace(`/session/${completed.id}`);
  }, [session, store, notes, router]);

  const onLog = useCallback(
    async (input: {
      made?: boolean;
      count?: number;
      points?: number;
      strokes?: number;
    }) => {
      if (!session || !drill) return;
      if (session.status !== 'active') return;
      if (
        targetAttempts != null &&
        attempts.length >= targetAttempts &&
        drill.scoring.type === 'strokes'
      ) {
        Alert.alert('Round complete', 'All balls are logged. Save when ready.');
        return;
      }
      const payload = createAttemptPayload(drill.scoring, input);
      await logAttempt(store, session.id, payload);
      setFlash(true);
      setTimeout(() => setFlash(false), 180);
      await refresh();
    },
    [session, drill, store, refresh, targetAttempts, attempts.length],
  );

  useEffect(() => {
    if (!isTargetReached || offeredComplete || !session) return;
    setOfferedComplete(true);
    Alert.alert('Target reached', 'Save this session now?', [
      { text: 'Keep going', style: 'cancel' },
      {
        text: 'Save',
        onPress: () => {
          void saveAndFinish();
        },
      },
    ]);
  }, [isTargetReached, offeredComplete, session, saveAndFinish]);

  const onUndo = useCallback(async () => {
    if (!session) return;
    const removed = await undoLastAttempt(store, session.id);
    if (!removed) {
      Alert.alert('Nothing to undo');
      return;
    }
    setOfferedComplete(false);
    await refresh();
  }, [session, store, refresh]);

  const onComplete = useCallback(() => {
    if (!session) return;
    if (attempts.length === 0) {
      Alert.alert(
        'No attempts yet',
        'Log at least one attempt, or discard this session.',
      );
      return;
    }
    Alert.alert('End session?', 'Save your score to History.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Save',
        onPress: () => {
          void saveAndFinish();
        },
      },
    ]);
  }, [session, attempts.length, saveAndFinish]);

  const onDiscard = useCallback(() => {
    Alert.alert(
      'Discard session?',
      'Logged attempts will be deleted and won’t appear in History.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: async () => {
            await discardActiveSession(store);
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/drills');
            }
          },
        },
      ],
    );
  }, [store, router]);

  if (!session || !drill) {
    return (
      <Screen>
        <Text>Loading session…</Text>
      </Screen>
    );
  }

  if (session.status !== 'active') {
    return (
      <Screen
        footer={
          <Button
            label="View results"
            onPress={() => router.replace(`/session/${session.id}`)}
          />
        }
      >
        <Text variant="title">Session saved</Text>
        <Text muted style={{ marginTop: spacing.xs }}>
          Your score is in History.
        </Text>
      </Screen>
    );
  }

  const ballLabel =
    drill.scoring.type === 'strokes'
      ? `Ball ${Math.min(attempts.length + 1, drill.scoring.holes)} of ${drill.scoring.holes}`
      : null;

  return (
    <Screen
      scroll
      footer={
        <>
          <Button label="End & save" onPress={onComplete} />
          <Button label="Discard" variant="ghost" onPress={onDiscard} />
        </>
      }
    >
      <Text
        variant="brand"
        style={[styles.counter, flash ? styles.flash : null]}
      >
        {summary?.label ?? '0'}
      </Text>
      <Text muted>
        {ballLabel
          ? ballLabel
          : `${attempts.length} logged${
              targetAttempts != null ? ` of ${targetAttempts}` : ''
            }`}
      </Text>
      {targetAttempts != null ? (
        <ProgressBar value={attempts.length} max={targetAttempts} />
      ) : null}

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

        {drill.scoring.type === 'strokes' ? (
          <View style={styles.stack}>
            <Text muted variant="secondary">
              Strokes for this ball
            </Text>
            <View style={styles.row}>
              <Button
                label="1"
                onPress={() => onLog({ strokes: 1 })}
                style={styles.quarter}
              />
              <Button
                label="2"
                onPress={() => onLog({ strokes: 2 })}
                style={styles.quarter}
              />
              <Button
                label="3"
                variant="secondary"
                onPress={() => onLog({ strokes: 3 })}
                style={styles.quarter}
              />
              <Button
                label="4+"
                variant="secondary"
                onPress={() => onLog({ strokes: 4 })}
                style={styles.quarter}
              />
            </View>
          </View>
        ) : null}

        {drill.scoring.type === 'score_total' ? (
          <View style={styles.stack}>
            {drill.scoring.attempts != null ? (
              <View style={styles.row}>
                <Button
                  label="0"
                  variant="secondary"
                  onPress={() => onLog({ points: 0 })}
                  style={styles.quarter}
                />
                <Button
                  label="1"
                  variant="secondary"
                  onPress={() => onLog({ points: 1 })}
                  style={styles.quarter}
                />
                <Button
                  label="2"
                  onPress={() => onLog({ points: 2 })}
                  style={styles.quarter}
                />
                <Button
                  label="3"
                  onPress={() => onLog({ points: 3 })}
                  style={styles.quarter}
                />
              </View>
            ) : (
              <>
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
              </>
            )}
          </View>
        ) : null}

        <Button
          label="Undo last"
          variant="ghost"
          onPress={onUndo}
          disabled={attempts.length === 0}
        />
      </View>

      <SectionHeader title="Notes" subtitle="Optional — saved with the session" />
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="How did it feel?"
        placeholderTextColor={colors.textMuted}
        style={[styles.input, styles.notes]}
        multiline
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  counter: {
    marginTop: spacing.xs,
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
    gap: spacing.xs,
  },
  half: {
    flex: 1,
  },
  quarter: {
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
});
