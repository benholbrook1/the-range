import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/src/theme';

type Props = {
  value: number;
  max: number;
};

export function ProgressBar({ value, max }: Props) {
  const pct = max <= 0 ? 0 : Math.min(1, Math.max(0, value / max));
  return (
    <View style={styles.track} accessibilityRole="progressbar">
      <View style={[styles.fill, { width: `${pct * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  fill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
});
