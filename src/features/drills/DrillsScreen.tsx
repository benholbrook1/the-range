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
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<DrillCategory | 'all'>('all');

  const refresh = useCallback(async () => {
    const rows = await listDrills(store, { query, category });
    setDrills(rows);
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

  const empty = useMemo(() => drills.length === 0, [drills.length]);

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text variant="title">Drills</Text>
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
      />

      <CategoryFilter value={category} onChange={setCategory} />

      {empty ? (
        <EmptyState
          title="No drills found"
          message="Import a pack or clear filters."
          actionLabel="Import pack"
          onAction={importPack}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
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
