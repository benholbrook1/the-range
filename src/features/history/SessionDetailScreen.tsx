import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/src/components/ui/Button';
import { ListRow } from '@/src/components/ui/ListRow';
import { Screen } from '@/src/components/ui/Screen';
import { SectionHeader } from '@/src/components/ui/SectionHeader';
import { Text } from '@/src/components/ui/Text';
import { useStore } from '@/src/db/StoreContext';
import { formatDateTime, formatDuration } from '@/src/domain/format';
import { summarizeAttempts } from '@/src/domain/scoring';
import type { Attempt, Drill, Session } from '@/src/domain/types';
import { getSessionDetail } from '@/src/services/sessions';
import { spacing } from '@/src/theme';

export function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useStore();
  const router = useRouter();
  const navigation = useNavigation();
  const [session, setSession] = useState<Session | null>(null);
  const [drill, setDrill] = useState<Drill | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  const load = useCallback(async () => {
    if (!id) return;
    const detail = await getSessionDetail(store, id);
    setSession(detail.session);
    setDrill(detail.drill);
    setAttempts(detail.attempts);
  }, [id, store]);

  useEffect(() => {
    void load();
  }, [load]);

  useLayoutEffect(() => {
    if (session) {
      navigation.setOptions({ title: 'Results' });
    }
  }, [navigation, session]);

  const summary = useMemo(() => {
    if (!drill) return null;
    return summarizeAttempts(drill.scoring, attempts);
  }, [drill, attempts]);

  if (!session) {
    return (
      <Screen>
        <Text>Loading…</Text>
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      footer={
        <>
          <Button
            label="Repeat this drill"
            onPress={() => router.push(`/drill/${session.drillId}`)}
          />
          <Button
            label="Practice another"
            variant="secondary"
            onPress={() => router.replace('/(tabs)/drills')}
          />
          <Button
            label="Done"
            variant="ghost"
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace('/(tabs)');
            }}
          />
        </>
      }
    >
      <Text variant="title">{session.drillName}</Text>
      <Text muted style={styles.meta}>
        {formatDateTime(session.startedAt)} ·{' '}
        {formatDuration(session.startedAt, session.endedAt)}
      </Text>

      <SectionHeader title="Score" />
      <Text variant="subtitle">
        {session.summaryScore ?? summary?.label ?? '—'}
      </Text>
      {summary ? (
        <Text muted style={styles.detail}>
          {summary.detail}
        </Text>
      ) : null}

      <SectionHeader
        title="Attempts"
        subtitle={
          attempts.length === 0
            ? 'None logged'
            : `${attempts.length} recorded`
        }
      />
      {attempts.length === 0 ? (
        <Text muted>No attempts were logged for this session.</Text>
      ) : (
        attempts.map((attempt) => (
          <ListRow
            key={attempt.id}
            title={`#${attempt.index + 1}`}
            meta={describePayload(attempt)}
          />
        ))
      )}

      {session.notes ? (
        <>
          <SectionHeader title="Notes" />
          <Text>{session.notes}</Text>
        </>
      ) : null}
    </Screen>
  );
}

function describePayload(attempt: Attempt): string {
  const p = attempt.payload;
  if (p.type === 'makes_out_of') return p.made ? 'Make' : 'Miss';
  if (p.type === 'reps') return `${p.count} reps`;
  if (p.type === 'strokes') {
    return p.strokes === 1 ? '1 stroke' : `${p.strokes} strokes`;
  }
  return `${p.points} points`;
}

const styles = StyleSheet.create({
  meta: {
    marginTop: spacing.xs,
  },
  detail: {
    marginTop: spacing.xs,
  },
});
