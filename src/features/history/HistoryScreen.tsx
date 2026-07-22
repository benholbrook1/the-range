import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/src/components/ui/EmptyState';
import { Screen } from '@/src/components/ui/Screen';
import { Text } from '@/src/components/ui/Text';
import { useStore } from '@/src/db/StoreContext';
import {
  ALL_CATEGORIES,
  categoryLabel,
} from '@/src/domain/categories';
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
    <Screen scroll style={styles.page}>
      <Text variant="brand" style={styles.title}>
        Log
      </Text>

      <View style={styles.filters}>
        {ALL_CATEGORIES.map((cat) => {
          const selected = cat === category;
          return (
            <Pressable
              key={cat}
              onPress={() => setCategory(cat)}
              style={styles.filterItem}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text
                variant="secondary"
                color={selected ? colors.accent : colors.textMuted}
                style={[
                  styles.filterLabel,
                  selected ? styles.filterLabelOn : null,
                ]}
              >
                {categoryLabel(cat)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {sessions.length === 0 ? (
        <EmptyState
          title={hasFilter ? 'Nothing here yet' : 'No practice logged'}
          message={
            hasFilter
              ? 'Switch category, or clear to All.'
              : 'Complete a drill and your scores land here.'
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
            <Text style={styles.day}>{group.label}</Text>
            {group.sessions.map((session) => (
              <Pressable
                key={session.id}
                onPress={() => router.push(`/session/${session.id}`)}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.row,
                  pressed && styles.rowPressed,
                ]}
              >
                <View style={styles.rowMain}>
                  <Text variant="subtitle">{session.drillName}</Text>
                  <Text muted variant="secondary">
                    {categoryLabel(session.drillCategory)}
                  </Text>
                </View>
                <Text variant="score" color={colors.accent}>
                  {session.summaryScore ?? '—'}
                </Text>
              </Pressable>
            ))}
          </View>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingTop: spacing.md,
  },
  title: {
    marginBottom: spacing.md,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  filterItem: {
    minHeight: 40,
    justifyContent: 'center',
  },
  filterLabel: {
    fontSize: 15,
  },
  filterLabelOn: {
    fontFamily: 'DMSans_700Bold',
    textDecorationLine: 'underline',
  },
  group: {
    marginBottom: spacing.lg,
  },
  day: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowPressed: {
    opacity: 0.65,
  },
  rowMain: {
    flex: 1,
    gap: 2,
  },
});
