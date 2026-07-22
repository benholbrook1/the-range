import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CategoryFilter } from '@/src/components/drills/CategoryFilter';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { Screen } from '@/src/components/ui/Screen';
import { Text } from '@/src/components/ui/Text';
import { useStore } from '@/src/db/StoreContext';
import { formatRelativeDay } from '@/src/domain/format';
import type { DrillCategory, Session } from '@/src/domain/types';
import { listHistory } from '@/src/services/sessions';
import { colors, spacing } from '@/src/theme';

type DayGroup = {
  label: string;
  sessions: Session[];
};

function groupByDay(sessions: Session[]): DayGroup[] {
  const map = new Map<string, Session[]>();
  for (const session of sessions) {
    const label = formatRelativeDay(session.startedAt);
    const list = map.get(label) ?? [];
    list.push(session);
    map.set(label, list);
  }
  return Array.from(map.entries()).map(([label, items]) => ({
    label,
    sessions: items,
  }));
}

function HistoryRow({
  session,
  onPress,
}: {
  session: Session;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <Text variant="body" style={styles.rowText}>
        {session.drillName}
      </Text>
      <Text variant="subtitle" style={styles.score}>
        {session.summaryScore ?? '—'}
      </Text>
    </Pressable>
  );
}

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

  const groups = useMemo(() => groupByDay(sessions), [sessions]);
  const hasFilter = category !== 'all';

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text variant="title">History</Text>
        <Text muted style={styles.lede}>
          Your practice log
        </Text>
      </View>

      <View style={styles.filter}>
        <CategoryFilter value={category} onChange={setCategory} />
      </View>

      {sessions.length === 0 ? (
        <EmptyState
          title={hasFilter ? 'Nothing in this category' : 'No sessions yet'}
          message={
            hasFilter
              ? 'Try another category, or clear the filter.'
              : 'Finish a drill and it will show up here.'
          }
          actionLabel={hasFilter ? 'Show all' : 'Find a drill'}
          onAction={
            hasFilter
              ? () => setCategory('all')
              : () => router.push('/(tabs)/drills')
          }
        />
      ) : (
        groups.map((group) => (
          <View key={group.label} style={styles.group}>
            <Text variant="secondary" muted style={styles.day}>
              {group.label}
            </Text>
            {group.sessions.map((session) => (
              <HistoryRow
                key={session.id}
                session={session}
                onPress={() => router.push(`/session/${session.id}`)}
              />
            ))}
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  lede: {
    maxWidth: 280,
  },
  filter: {
    marginBottom: spacing.md,
  },
  group: {
    marginBottom: spacing.md,
  },
  day: {
    marginBottom: spacing.xs,
  },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowPressed: {
    opacity: 0.7,
  },
  rowText: {
    flex: 1,
  },
  score: {
    fontFamily: 'DMSans_700Bold',
    color: colors.text,
  },
});
