import { Tabs } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography } from '@/theme';

/** Clearance kept below the labels even on phones with gesture navigation. */
const MIN_BOTTOM_GAP = 12;
const BAR_CONTENT_HEIGHT = 62;

function TabIcon({ label, active }: { label: string; active: boolean }) {
  return (
    <Text style={[styles.icon, active && styles.iconActive]} accessibilityElementsHidden>
      {label}
    </Text>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  // Android draws edge-to-edge, so without the inset the bar sits underneath
  // the system back/home buttons.
  const bottomGap = Math.max(insets.bottom, MIN_BOTTOM_GAP);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          { height: BAR_CONTENT_HEIGHT + bottomGap, paddingBottom: bottomGap },
        ],
        tabBarActiveTintColor: colors.primaryHover,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon label="⌂" active={focused} />,
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: 'Workout',
          tabBarIcon: ({ focused }) => <TabIcon label="▣" active={focused} />,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Ranks',
          tabBarIcon: ({ focused }) => <TabIcon label="★" active={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon label="◉" active={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.tabBar,
    borderTopColor: colors.borderStrong,
    borderTopWidth: 1,
    paddingTop: 10,
    elevation: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  tabItem: {
    paddingTop: 2,
  },
  tabLabel: {
    ...typography.caption,
    fontSize: 11,
    marginTop: 4,
  },
  icon: {
    fontSize: 20,
    color: colors.textFaint,
  },
  iconActive: {
    color: colors.primaryHover,
  },
});