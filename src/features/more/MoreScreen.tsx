import Constants from 'expo-constants';
import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/src/components/ui/Button';
import { ListRow } from '@/src/components/ui/ListRow';
import { Screen } from '@/src/components/ui/Screen';
import { Text } from '@/src/components/ui/Text';
import { useStore } from '@/src/db/StoreContext';
import type { DistanceUnits, Pack } from '@/src/domain/types';
import { clearAllAndReseed } from '@/src/services/bootstrap';
import {
  listInstalledPacks,
  tryInstallPackPayload,
  uninstallPack,
} from '@/src/services/packs';
import {
  getSettings,
  setDisplayName,
  setUnits,
} from '@/src/services/settings';
import { colors, spacing } from '@/src/theme';

export function MoreScreen() {
  const store = useStore();
  const [name, setName] = useState('');
  const [units, setUnitsState] = useState<DistanceUnits>('yards');
  const [packs, setPacks] = useState<Pack[]>([]);

  const refresh = useCallback(async () => {
    const [settings, installed] = await Promise.all([
      getSettings(store),
      listInstalledPacks(store),
    ]);
    setName(settings.displayName);
    setUnitsState(settings.units);
    setPacks(installed);
  }, [store]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const saveName = useCallback(async () => {
    await setDisplayName(store, name);
    Alert.alert('Saved', 'Display name updated.');
  }, [store, name]);

  const onUnits = useCallback(
    async (next: DistanceUnits) => {
      setUnitsState(next);
      await setUnits(store, next);
    },
    [store],
  );

  const importPack = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const contents = await (await fetch(result.assets[0].uri)).text();
      const installed = await tryInstallPackPayload(
        store,
        JSON.parse(contents) as unknown,
        'imported',
      );
      if (!installed.ok) {
        Alert.alert('Invalid pack', installed.error);
        return;
      }
      Alert.alert('Pack installed', installed.pack.name);
      await refresh();
    } catch (e) {
      Alert.alert(
        'Import failed',
        e instanceof Error ? e.message : 'Could not import pack',
      );
    }
  }, [store, refresh]);

  const onRemovePack = useCallback(
    (pack: Pack) => {
      Alert.alert(
        'Remove pack?',
        `Remove “${pack.name}”? Past sessions stay in History.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              try {
                await uninstallPack(store, pack.id);
                await refresh();
              } catch (e) {
                Alert.alert(
                  'Could not remove',
                  e instanceof Error ? e.message : 'Unknown error',
                );
              }
            },
          },
        ],
      );
    },
    [store, refresh],
  );

  const onClear = useCallback(() => {
    Alert.alert(
      'Clear local data?',
      'This removes sessions and re-seeds the starter pack.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearAllAndReseed(store);
            await refresh();
            Alert.alert('Cleared', 'Local data reset.');
          },
        },
      ],
    );
  }, [store, refresh]);

  const version =
    Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? '1.0.0';

  return (
    <Screen scroll>
      <Text variant="title">More</Text>

      <Text variant="subtitle" style={styles.section}>
        Profile
      </Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Display name (optional)"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
      />
      <Button label="Save name" variant="secondary" onPress={saveName} />

      <Text variant="subtitle" style={styles.section}>
        Units
      </Text>
      <View style={styles.unitsRow}>
        {(['yards', 'meters'] as DistanceUnits[]).map((option) => {
          const selected = units === option;
          return (
            <Pressable
              key={option}
              onPress={() => void onUnits(option)}
              style={styles.unitOption}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text
                color={selected ? colors.accent : colors.textMuted}
                style={selected ? styles.unitSelected : undefined}
              >
                {option === 'yards' ? 'Yards' : 'Meters'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text variant="subtitle" style={styles.section}>
        Drill packs
      </Text>
      {packs.map((pack) => (
        <ListRow
          key={pack.id}
          title={pack.name}
          meta={`${pack.source} · v${pack.schemaVersion}`}
          right={
            <Pressable
              onPress={() => onRemovePack(pack)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${pack.name}`}
            >
              <Text color={colors.danger} variant="secondary">
                Remove
              </Text>
            </Pressable>
          }
        />
      ))}
      <Button label="Import pack" onPress={importPack} style={styles.spaced} />

      <Text variant="subtitle" style={styles.section}>
        Data
      </Text>
      <Text muted>Export / Import profile — Coming soon</Text>
      <Button
        label="Clear local data"
        variant="danger"
        onPress={onClear}
        style={styles.spaced}
      />

      <Text muted style={styles.about}>
        The Range · v{version}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  input: {
    minHeight: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    marginBottom: spacing.sm,
    fontSize: 16,
    color: colors.text,
    fontFamily: 'DMSans_400Regular',
  },
  unitsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 44,
    alignItems: 'center',
  },
  unitOption: {
    minHeight: 44,
    justifyContent: 'center',
  },
  unitSelected: {
    textDecorationLine: 'underline',
    fontFamily: 'DMSans_700Bold',
  },
  spaced: {
    marginTop: spacing.sm,
  },
  about: {
    marginTop: spacing.xl,
  },
});
