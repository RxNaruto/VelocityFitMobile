import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography } from '@/theme';

interface BrandSplashProps {
    message?: string;
}

/**
 * Full-screen brand panel shown while the app boots. Visually continues the
 * native splash (same artwork, same background) so the handover is seamless.
 */
export function BrandSplash({ message = 'Loading Velocity Fit…' }: BrandSplashProps) {
    return (
        <View style={styles.root}>
            <LinearGradient
                colors={['rgba(220,38,38,0.18)', 'transparent', 'rgba(220,38,38,0.08)']}
                locations={[0, 0.5, 1]}
                start={{ x: 0.9, y: 0 }}
                end={{ x: 0.1, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
            />
            <Image
                source={require('../../assets/splash-icon.png')}
                style={styles.logo}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
            />
            <Text style={styles.name}>VELOCITY FIT</Text>
            <Text style={styles.tag}>TRAIN HARD. STAY CONSISTENT.</Text>
            <ActivityIndicator size="small" color={colors.primary} style={styles.spinner} />
            <Text style={styles.message}>{message}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: colors.bg,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xxl,
    },
    logo: {
        width: 140,
        height: 140,
    },
    name: {
        ...typography.brand,
        fontSize: 20,
        marginTop: spacing.lg,
    },
    tag: {
        ...typography.caption,
        letterSpacing: 1.4,
        marginTop: spacing.xs,
    },
    spinner: {
        marginTop: spacing.xxxl,
    },
    message: {
        ...typography.caption,
        marginTop: spacing.md,
        textAlign: 'center',
    },
});