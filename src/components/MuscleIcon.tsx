import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/theme';

/**
 * Muscle-group silhouettes, the same PNGs the web app ships in
 * `public/icons/`. They are flat black artwork, so they get tinted white to
 * read against the dark plate — the native equivalent of the web's
 * `filter: brightness(0) invert(1)`.
 *
 * React Native resolves `require` at bundle time, so the sources have to be
 * listed statically rather than built from the slug.
 */
const SOURCES: Record<string, number> = {
  back: require('../../assets/muscles/back.png'),
  biceps: require('../../assets/muscles/biceps.png'),
  cardio: require('../../assets/muscles/cardio.png'),
  chest: require('../../assets/muscles/chest.png'),
  core: require('../../assets/muscles/core.png'),
  forearms: require('../../assets/muscles/forearms.png'),
  'full-body': require('../../assets/muscles/full-body.png'),
  glutes: require('../../assets/muscles/glutes.png'),
  legs: require('../../assets/muscles/legs.png'),
  shoulders: require('../../assets/muscles/shoulders.png'),
  traps: require('../../assets/muscles/traps.png'),
  triceps: require('../../assets/muscles/triceps.png'),
};

/** Groups with no artwork (e.g. calves) fall back to their initial. */
function Fallback({ name, size }: { name: string; size: number }) {
  return (
    <Text style={[styles.fallback, { fontSize: size * 0.5 }]}>
      {(name || '?').charAt(0).toUpperCase()}
    </Text>
  );
}

interface MuscleIconProps {
  slug: string;
  name?: string;
  size?: number;
  /** Draw the icon on the rounded plate used by the picker rows. */
  plated?: boolean;
}

export function MuscleIcon({ slug, name = '', size = 32, plated = false }: MuscleIconProps) {
  const source = SOURCES[slug];

  const inner = source ? (
    <Image
      source={source}
      style={{ width: size, height: size, tintColor: colors.text, opacity: 0.95 }}
      resizeMode="contain"
      accessibilityIgnoresInvertColors
    />
  ) : (
    <Fallback name={name || slug} size={size} />
  );

  if (!plated) return inner;

  return (
    <View style={[styles.plate, { width: size * 1.5, height: size * 1.5 }]}>{inner}</View>
  );
}

const styles = StyleSheet.create({
  plate: {
    borderRadius: radius.sm,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallback: {
    color: colors.text,
    fontWeight: '700',
  },
});
