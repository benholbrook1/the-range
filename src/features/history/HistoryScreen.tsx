import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { CategoryFilter } from '@/src/components/drills/CategoryFilter';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ListRow } from '@/src/components/ui/ListRow';
import { Screen } from '@/src/components/ui/Screen';
import { Text } from '@/src/components/ui/Text';
import { useStore } from '@/src/db/StoreContext';
import { categoryLabel } from '@/src/domain/categories';
import { formatRelativeDay } from '@/src/domain/format';
import type { DrillCategory, Session } from '@/src/domain/types';
import { listHistory } from '@/src/services/sessions';
import { spacing } from '@/src/theme';

export function HistoryScreen() {
  const store = useStore();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [category, setCategory] = useState<DrillCategory | 'all'>('all');

  const refresh = useCallback(async () => {
    const rows = await listHistory(store, { category });
    setSessions(rows);
  }, [store, category]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return (
    <Screen scroll>
      <Text variant="title">History</Text>
      <View style={styles.filter}>
        <CategoryFilter value={category} onChange={setCategory} />
      </View>

      {sessions.length === 0 ? (
        <EmptyState
          title="No sessions yet"
          message="Complete a drill to see it here."
          actionLabel="Browse drills"
          onAction={() => router.push('/(tabs)/drills')}
        />
      ) : (
        sessions.map((session) => (
          <ListRow
            key={session.id}
            title={session.drillName}
            meta={`${formatRelativeDay(session.startedAt)} · ${
              session.summaryScore ?? '—'
            } · ${categoryLabel(session.drillCategory)}`}
            onPress={() => router.push(`/session/${session.id}`)}
            right={
              <Text muted variant="secondary">
                ›
              </Text>
            }
          />
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filter: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
});
