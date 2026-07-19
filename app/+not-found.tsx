import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/src/components/ui/Text';
import { colors, spacing } from '@/src/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View style={styles.container}>
        <Text variant="title">This screen doesn’t exist.</Text>
        <Link href="/" style={styles.link}>
          <Text color={colors.accent}>Go home</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    backgroundColor: colors.bg,
    gap: spacing.sm,
  },
  link: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
  },
});
