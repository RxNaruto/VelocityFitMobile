import { ReactNode } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSegments } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '@/theme';

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function Screen({
  children,
  scroll = false,
  padded = true,
  style,
  contentStyle,
  refreshing = false,
  onRefresh,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  // Inside the tab navigator the tab bar already clears the system nav bar;
  // standalone stack screens have to reserve that space themselves.
  const insideTabs = segments[0] === '(tabs)';
  const bottomPad = { paddingBottom: spacing.xxl + (insideTabs ? 0 : insets.bottom) };

  const inner = scroll ? (
    <ScrollView
      contentContainerStyle={[
        padded && styles.padded,
        bottomPad,
        styles.scrollContent,
        contentStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, padded && styles.padded, bottomPad, contentStyle]}>
      {children}
    </View>
  );

  return (
    <View style={[styles.root, style]}>
      <LinearGradient
        colors={['rgba(220,38,38,0.14)', 'transparent', 'rgba(220,38,38,0.06)']}
        locations={[0, 0.45, 1]}
        start={{ x: 0.9, y: 0 }}
        end={{ x: 0.1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
        {inner}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  flex: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
  },
});