import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { Text } from '@/src/components/ui/Text';
import {
  ALL_CATEGORIES,
  categoryLabel,
} from '@/src/domain/categories';
import type { DrillCategory } from '@/src/domain/types';
import { colors, spacing } from '@/src/theme';

type Props = {
  value: DrillCategory | 'all';
  onChange: (value: DrillCategory | 'all') => void;
};

export function CategoryFilter({ value, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {ALL_CATEGORIES.map((cat) => {
        const selected = cat === value;
        return (
          <Pressable
            key={cat}
            onPress={() => onChange(cat)}
            style={styles.item}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <Text
              variant="secondary"
              color={selected ? colors.accent : colors.textMuted}
              style={selected ? styles.selected : undefined}
            >
              {categoryLabel(cat)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  item: {
    minHeight: 44,
    justifyContent: 'center',
  },
  selected: {
    textDecorationLine: 'underline',
    fontFamily: 'DMSans_700Bold',
  },
});
