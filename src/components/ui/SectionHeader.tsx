import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/src/components/ui/Text';
import { spacing } from '@/src/theme';

type Props = {
  title: string;
  subtitle?: string;
};

export function SectionHeader({ title, subtitle }: Props) {
  return (
    <View style={styles.wrap}>
      <Text variant="subtitle">{title}</Text>
      {subtitle ? (
        <Text muted variant="secondary" style={styles.subtitle}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    gap: 2,
  },
  subtitle: {
    marginTop: 2,
  },
});
