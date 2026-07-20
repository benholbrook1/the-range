import React from 'react';
import {
  Pressable,
  StyleSheet,
  ViewStyle,
  type PressableProps,
} from 'react-native';

import { Text } from '@/src/components/ui/Text';
import { colors, radii, spacing } from '@/src/theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

type Props = PressableProps & {
  label: string;
  variant?: Variant;
  style?: ViewStyle;
};

export function Button({
  label,
  variant = 'primary',
  style,
  disabled,
  ...rest
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'danger' && styles.danger,
        variant === 'ghost' && styles.ghost,
        pressed && styles.pressed,
        pressed && variant === 'primary' && styles.primaryPressed,
        disabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      <Text
        variant="button"
        color={
          variant === 'primary' || variant === 'danger'
            ? colors.surface
            : variant === 'ghost'
              ? colors.accent
              : colors.text
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  primary: {
    backgroundColor: colors.accent,
  },
  primaryPressed: {
    backgroundColor: colors.accentPressed,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  danger: {
    backgroundColor: colors.danger,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
});
