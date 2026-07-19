import React from 'react';
import {
  StyleSheet,
  Text as RNText,
  type TextProps as RNTextProps,
} from 'react-native';

import { colors, typography } from '@/src/theme';

type Variant = 'brand' | 'title' | 'subtitle' | 'body' | 'secondary' | 'button';

type Props = RNTextProps & {
  variant?: Variant;
  muted?: boolean;
  color?: string;
};

export function Text({
  variant = 'body',
  muted,
  color,
  style,
  ...rest
}: Props) {
  return (
    <RNText
      {...rest}
      style={[
        styles.base,
        typography[variant],
        muted ? styles.muted : null,
        color ? { color } : null,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    color: colors.text,
  },
  muted: {
    color: colors.textMuted,
  },
});
