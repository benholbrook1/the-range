import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import React from 'react';

import { colors } from '@/src/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<
  string,
  { active: IconName; inactive: IconName }
> = {
  index: { active: 'home', inactive: 'home-outline' },
  drills: { active: 'golf', inactive: 'golf-outline' },
  history: { active: 'time', inactive: 'time-outline' },
  more: { active: 'menu', inactive: 'menu-outline' },
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontFamily: 'DMSans_500Medium',
          fontSize: 12,
        },
        tabBarIcon: ({ color, focused, size }) => {
          const icons = TAB_ICONS[route.name] ?? {
            active: 'ellipse' as IconName,
            inactive: 'ellipse-outline' as IconName,
          };
          return (
            <Ionicons
              name={focused ? icons.active : icons.inactive}
              size={focused ? size + 1 : size}
              color={color}
            />
          );
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="drills" options={{ title: 'Drills' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
      <Tabs.Screen name="more" options={{ title: 'More' }} />
    </Tabs>
  );
}
