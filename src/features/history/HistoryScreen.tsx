import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { CategoryFilter } from '@/src/components/drills/CategoryFilter';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ListRow } from '@/src/components/ui/ListRow';
import { Screen } from '@/src/components/ui/Screen';
import { Text } from '@/src/components/ui/Text';
import { useStore } from '@/src/db/StoreContext';
import { categoryLabel } from '@/src/domain/categories';
import { formatRelativeDay } from '@/src/domain/format';
import type { DrillCategory, Session } from '@/src/domain/types';
import { listHistoryDrillOptions } from '@/src/services/drills';
import { listHistory } from '@/src/services/sessions';
import { colors, spacing } from '@/src/theme';

export function HistoryScreen() {
  const store = useStore();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [category, setCategory] = useState<DrillCategory | 'all'>('all');
  const [drillId, setDrillId] = useState<string | 'all'>('all');
  const [drillOptions, setDrillOptions] = useState<
    Array<{ id: string; name: string }>
  >([]);

  const refresh = useCallback(async () => {
    const [rows, options] = await Promise.all([
      listHistory(store, {
        category,
        drillId: drillId === 'all' ? undefined : drillId,
      }),
      listHistoryDrillOptions(store),
    ]);
    setSessions(rows);
    setDrillOptions(options);
  }, [store, category, drillId]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const filters = useMemo(
    () => [{ id: 'all' as const, name: 'All drills' }, ...drillOptions],
    [drillOptions],
  );

  return (
    <Screen scroll>
      <Text variant="title">History</Text>
      <View style={styles.filter}>
        <CategoryFilter value={category} onChange={setCategory} />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.drillRow}
      >
        {filters.map((opt) => {
          const selected = opt.id === drillId;
          return (
            <Pressable
              key={opt.id}
              onPress={() => setDrillId(opt.id)}
              style={styles.drillChip}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text
                variant="secondary"
                color={selected ? colors.accent : colors.textMuted}
                style={selected ? styles.selected : undefined}
              >
                {opt.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

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
  drillRow: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  drillChip: {
    minHeight: 44,
    justifyContent: 'center',
  },
  selected: {
    textDecorationLine: 'underline',
    fontFamily: 'DMSans_700Bold',
  },
});
