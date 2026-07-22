import React, { useEffect, useRef } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/src/theme';

type Props = {
  scroll?: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  footer?: React.ReactNode;
};

export function Screen({ scroll, children, style, footer }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  const animatedStyle = { opacity, transform: [{ translateY }] };

  const body = scroll ? (
    <Animated.View style={[styles.flex, animatedStyle]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          footer ? styles.contentWithFooter : null,
          style,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </Animated.View>
  ) : (
    <Animated.View style={[styles.content, styles.flex, animatedStyle, style]}>
      {children}
    </Animated.View>
  );

  return (
    <SafeAreaView
      style={styles.safe}
      edges={footer ? ['top', 'left', 'right'] : ['top', 'left', 'right']}
    >
      <View style={styles.flex}>
        {body}
        {footer ? (
          <SafeAreaView edges={['bottom']} style={styles.footerSafe}>
            <View style={styles.footer}>{footer}</View>
          </SafeAreaView>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.pageX,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  contentWithFooter: {
    paddingBottom: spacing.md,
  },
  footerSafe: {
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  footer: {
    paddingHorizontal: spacing.pageX,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
    backgroundColor: colors.bg,
  },
});
