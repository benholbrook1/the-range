import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';

import { CategoryFilter } from '@/src/components/drills/CategoryFilter';
import { Button } from '@/src/components/ui/Button';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { ListRow } from '@/src/components/ui/ListRow';
import { Screen } from '@/src/components/ui/Screen';
import { Text } from '@/src/components/ui/Text';
import { useStore } from '@/src/db/StoreContext';
import { categoryLabel } from '@/src/domain/categories';
import type { Drill, DrillCategory } from '@/src/domain/types';
import { listDrills } from '@/src/services/drills';
import { tryInstallPackPayload } from '@/src/services/packs';
import { colors, spacing } from '@/src/theme';

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
    if (hasFilters) return `${drills.length} of ${totalCount} drills`;
    return `${totalCount} drills`;
  }, [filteredEmpty, hasFilters, drills.length, totalCount]);

  return (
    <Screen scroll>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text variant="title">Drills</Text>
          {subtitle ? (
            <Text muted variant="secondary">
              {subtitle}
            </Text>
          ) : null}
        </View>
        <Button label="Import pack" variant="ghost" onPress={importPack} />
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search drills"
        placeholderTextColor={colors.textMuted}
        style={styles.search}
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
      />

      <CategoryFilter value={category} onChange={setCategory} />

      {filteredEmpty ? (
        <EmptyState
          title={hasFilters ? 'No matching drills' : 'No drills yet'}
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
          <ListRow
            key={drill.id}
            title={drill.name}
            meta={`${categoryLabel(drill.category)} · ${drill.estimatedMinutes} min`}
            onPress={() => router.push(`/drill/${drill.id}`)}
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
});
