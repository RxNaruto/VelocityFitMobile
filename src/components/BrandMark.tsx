import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, radius, typography } from '@/theme';

type BrandMarkSize = 'sm' | 'md' | 'lg';

interface BrandMarkProps {
  size?: BrandMarkSize;
  showName?: boolean;
}

const SIZES: Record<BrandMarkSize, number> = {
  sm: 36,
  md: 48,
  lg: 72,
};

export function BrandMark({ size = 'md', showName = false }: BrandMarkProps) {
  const plate = SIZES[size];

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.plate,
          {
            width: plate,
            height: plate,
            borderRadius: radius.md,
          },
        ]}
      >
        {/* Same panther mark as the web header, tinted white against the
            red plate (web does this with `filter: brightness(0) invert(1)`). */}
        <Image
          source={require('../../assets/brand/logo.png')}
          style={{ width: plate * 0.72, height: plate * 0.72, tintColor: '#fff' }}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      </View>
      {showName ? <Text style={styles.name}>VELOCITY FIT</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  plate: {
    backgroundColor: colors.primaryDeep,
    borderWidth: 1,
    borderColor: colors.primaryEdge,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  name: {
    ...typography.brand,
  },
});
