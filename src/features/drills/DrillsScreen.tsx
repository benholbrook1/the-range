import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { CategoryFilter } from '@/src/components/drills/CategoryFilter';
import { DrillVisual } from '@/src/components/drills/DrillVisual';
import { Button } from '@/src/components/ui/Button';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { Screen } from '@/src/components/ui/Screen';
import { Text } from '@/src/components/ui/Text';
import { useStore } from '@/src/db/StoreContext';
import { categoryLabel } from '@/src/domain/categories';
import type { Drill, DrillCategory } from '@/src/domain/types';
import { listDrills } from '@/src/services/drills';
import { tryInstallPackPayload } from '@/src/services/packs';
import { colors, spacing } from '@/src/theme';

function scoringMeta(drill: Drill): string {
  const scoring = drill.scoring;
  if (scoring.type === 'makes_out_of') {
    return `${scoring.attempts} ${scoring.unit}`;
  }
  if (scoring.type === 'strokes') {
    return `${scoring.holes} balls · par ${scoring.holes * scoring.parPerHole}`;
  }
  if (scoring.type === 'score_total') {
    return scoring.attempts != null
      ? `${scoring.attempts} shots · points`
      : 'Points';
  }
  return scoring.target != null
    ? `${scoring.target} ${scoring.unit}`
    : scoring.unit;
}

export function DrillsScreen() {
  const store = useStore();
  const router = useRouter();
  const [drills, setDrills] = useState<Drill[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<DrillCategory | 'all'>('all');

  const refresh = useCallback(async () => {
    const [rows, all] = await Promise.all([
      listDrills(store, { query, category }),
      listDrills(store),
    ]);
    setDrills(rows);
    setTotalCount(all.length);
  }, [store, query, category]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const importPack = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const uri = result.assets[0].uri;
      const contents = await (await fetch(uri)).text();
      const raw = JSON.parse(contents) as unknown;
      const installed = await tryInstallPackPayload(store, raw, 'imported');
      if (!installed.ok) {
        Alert.alert('Invalid pack', installed.error);
        return;
      }
      Alert.alert(
        'Pack installed',
        `${installed.pack.name} (${installed.drillCount} drills)`,
      );
      await refresh();
    } catch (e) {
      Alert.alert(
        'Import failed',
        e instanceof Error ? e.message : 'Could not import pack',
      );
    }
  }, [store, refresh]);

  const filteredEmpty = drills.length === 0;
  const hasFilters = query.trim().length > 0 || category !== 'all';

  const clearFilters = useCallback(() => {
    setQuery('');
    setCategory('all');
  }, []);

  const subtitle = useMemo(() => {
    if (filteredEmpty) return null;
    if (hasFilters) return `${drills.length} of ${totalCount} games`;
    return `${totalCount} games`;
  }, [filteredEmpty, hasFilters, drills.length, totalCount]);

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text variant="title">Games</Text>
          {subtitle ? (
            <Text muted variant="secondary">
              {subtitle}
            </Text>
          ) : (
            <Text muted variant="secondary">
              Measurable practice games
            </Text>
          )}
        </View>
        <Button label="Import" variant="ghost" onPress={importPack} />
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search games"
        placeholderTextColor={colors.textMuted}
        style={styles.search}
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
      />

      <CategoryFilter value={category} onChange={setCategory} />

      {filteredEmpty ? (
        <EmptyState
          title={hasFilters ? 'No matching games' : 'No games yet'}
          message={
            hasFilters
              ? 'Try clearing search or category filters.'
              : 'Import a pack to get started.'
          }
          actionLabel={hasFilters ? 'Clear filters' : 'Import pack'}
          onAction={hasFilters ? clearFilters : importPack}
        />
      ) : (
        drills.map((drill) => (
          <Pressable
            key={drill.id}
            onPress={() => router.push(`/drill/${drill.id}`)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          >
            {drill.visual ? (
              <DrillVisual id={drill.visual} size="list" />
            ) : (
              <View style={styles.visualPlaceholder} />
            )}
            <View style={styles.rowText}>
              <Text variant="subtitle">{drill.name}</Text>
              <Text muted variant="secondary">
                {categoryLabel(drill.category)} · {scoringMeta(drill)} ·{' '}
                {drill.estimatedMinutes} min
              </Text>
            </View>
          </Pressable>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
    paddingRight: spacing.sm,
  },
  search: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
    fontSize: 16,
    color: colors.text,
    fontFamily: 'DMSans_400Regular',
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
  rowText: {
    flex: 1,
    gap: 2,
  },
  visualPlaceholder: {
    width: 56,
    height: 40,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 6,
  },
});
