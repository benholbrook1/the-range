import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

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
      <Text variant="title" style={styles.title}>
        Practice log
      </Text>
      <Text muted style={styles.count}>
        {sessions.length === 0
          ? hasFilter
            ? 'No sessions in this category'
            : 'Nothing logged yet'
          : `${sessions.length} session${sessions.length === 1 ? '' : 's'}`}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {ALL_CATEGORIES.map((cat) => {
          const selected = cat === category;
          return (
            <Pressable
              key={cat}
              onPress={() => setCategory(cat)}
              style={[styles.filterItem, selected && styles.filterItemOn]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text
                variant="secondary"
                color={selected ? colors.surface : colors.textMuted}
                style={styles.filterLabel}
              >
                {categoryLabel(cat)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {sessions.length === 0 ? (
        <EmptyState
          title={hasFilter ? 'Nothing here yet' : 'No practice logged'}
          message={
            hasFilter
              ? 'Switch category, or clear to All.'
              : 'Complete a game and your scores land here.'
          }
          actionLabel={hasFilter ? 'Show all' : 'Find a game'}
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
            <View style={styles.timeline}>
              {group.sessions.map((session, index) => {
                const isLast = index === group.sessions.length - 1;
                return (
                  <Pressable
                    key={session.id}
                    onPress={() => router.push(`/session/${session.id}`)}
                    accessibilityRole="button"
                    style={({ pressed }) => [
                      styles.row,
                      pressed && styles.rowPressed,
                    ]}
                  >
                    <View style={styles.spine}>
                      <View style={styles.dot} />
                      {!isLast ? <View style={styles.line} /> : null}
                    </View>
                    <View style={styles.rowBody}>
                      <Text style={styles.score} color={colors.accent}>
                        {session.summaryScore ?? '—'}
                      </Text>
                      <Text variant="subtitle">{session.drillName}</Text>
                      <Text muted variant="secondary">
                        {categoryLabel(session.drillCategory)}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
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
    marginBottom: spacing.xs,
  },
  count: {
    marginBottom: spacing.md,
    fontSize: 15,
  },
  filters: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.lg,
    paddingRight: spacing.pageX,
  },
  filterItem: {
    minHeight: 36,
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  filterItemOn: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterLabel: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 13,
  },
  group: {
    marginBottom: spacing.lg,
  },
  day: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: colors.accent,
    marginBottom: spacing.sm,
  },
  timeline: {
    gap: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 72,
  },
  rowPressed: {
    opacity: 0.65,
  },
  spine: {
    width: 20,
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
    marginTop: 6,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginTop: 4,
    marginBottom: 0,
  },
  rowBody: {
    flex: 1,
    paddingBottom: spacing.md,
    paddingLeft: spacing.xs,
    gap: 2,
  },
  score: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.6,
  },
});
