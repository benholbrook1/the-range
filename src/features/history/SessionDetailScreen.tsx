import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/src/components/ui/Button';
import { ListRow } from '@/src/components/ui/ListRow';
import { Screen } from '@/src/components/ui/Screen';
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
    <Screen scroll>
      <Text variant="title">{session.drillName}</Text>
      <Text muted style={styles.meta}>
        {formatDateTime(session.startedAt)} ·{' '}
        {formatDuration(session.startedAt, session.endedAt)}
      </Text>

      <Text variant="subtitle" style={styles.section}>
        Score
      </Text>
      <Text>{session.summaryScore ?? summary?.label ?? '—'}</Text>
      {summary ? (
        <Text muted style={styles.detail}>
          {summary.detail}
        </Text>
      ) : null}

      <Text variant="subtitle" style={styles.section}>
        Attempts
      </Text>
      {attempts.length === 0 ? (
        <Text muted>No attempts logged.</Text>
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
          <Text variant="subtitle" style={styles.section}>
            Notes
          </Text>
          <Text>{session.notes}</Text>
        </>
      ) : null}

      <View style={styles.cta}>
        <Button
          label="Repeat this drill"
          onPress={() => router.push(`/drill/${session.drillId}`)}
        />
      </View>
    </Screen>
  );
}

function describePayload(attempt: Attempt): string {
  const p = attempt.payload;
  if (p.type === 'makes_out_of') return p.made ? 'Make' : 'Miss';
  if (p.type === 'reps') return `${p.count} reps`;
  return `${p.points} points`;
}

const styles = StyleSheet.create({
  meta: {
    marginTop: spacing.xs,
  },
  section: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  detail: {
    marginTop: spacing.xs,
  },
  cta: {
    marginTop: spacing.lg,
  },
});
