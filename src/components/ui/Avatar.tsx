import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/theme';

interface AvatarUser {
  username?: string;
  name?: string;
  profilePhotoUrl?: string;
}

interface AvatarProps {
  user?: AvatarUser | null;
  size?: number;
  photoUrl?: string;
}

const PALETTE: Array<[string, string]> = [
  ['#991b1b', '#dc2626'],
  ['#7f1d1d', '#ef4444'],
  ['#b91c1c', '#f87171'],
  ['#dc2626', '#f59e0b'],
  ['#991b1b', '#6366f1'],
  ['#7f1d1d', '#22d3ee'],
];

function initials(name = ''): string {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function pickGradient(seed = ''): [string, string] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  const idx = Math.abs(hash) % PALETTE.length;
  return PALETTE[idx];
}

export function Avatar({ user, size = 40, photoUrl }: AvatarProps) {
  const url = photoUrl ?? user?.profilePhotoUrl ?? '';
  const seed = user?.username || user?.name || '';
  const [c1, c2] = pickGradient(seed);
  const [failed, setFailed] = useState(false);

  const shell = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  if (url && !failed) {
    return (
      <View style={[styles.shell, shell, { borderColor: colors.borderStrong }]}>
        <Image
          source={{ uri: url }}
          style={[styles.image, shell]}
          accessibilityLabel={user?.name || 'Avatar'}
          onError={() => setFailed(true)}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.shell,
        shell,
        { backgroundColor: c1, borderColor: 'rgba(255,255,255,0.08)' },
      ]}
      accessibilityLabel={user?.name || 'Avatar'}
    >
      <View style={[styles.gradientOverlay, { backgroundColor: c2, opacity: 0.35 }]} />
      <Text style={[styles.initials, { fontSize: Math.round(size * 0.38) }]}>
        {initials(user?.name || user?.username)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  image: {
    resizeMode: 'cover',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFill,
  },
  initials: {
    color: colors.white,
    fontWeight: '700',
  },
});
