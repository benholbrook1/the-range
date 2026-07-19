import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/src/components/ui/Text';
import { colors, spacing } from '@/src/theme';

type Props = {
  title: string;
  meta?: string;
  onPress?: () => void;
  right?: React.ReactNode;
};

export function ListRow({ title, meta, onPress, right }: Props) {
  const content = (
    <View style={styles.row}>
      <View style={styles.textWrap}>
        <Text variant="body">{title}</Text>
        {meta ? (
          <Text variant="secondary" muted>
            {meta}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );

  if (!onPress) {
    return (
      <View>
        {content}
        <View style={styles.divider} />
      </View>
    );
  }

  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      {content}
      <View style={styles.divider} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    paddingVertical: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
