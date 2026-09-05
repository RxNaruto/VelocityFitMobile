import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { BrandMark } from '@/components/BrandMark';
import { Button, Card, Screen } from '@/components/ui';
import { colors, radius, spacing, typography } from '@/theme';

const HIGHLIGHTS = [
    {
        icon: '▣',
        title: 'Log every set',
        body: 'Reps, weight, failure sets and no-rest drops — in a few taps.',
    },
    {
        icon: '⌂',
        title: 'See your streak',
        body: 'A calendar of everything you have trained, day by day.',
    },
    {
        icon: '★',
        title: 'Climb the ranks',
        body: 'Earn points for consistency and compare with everyone else.',
    },
];

export default function WelcomeScreen() {
    const router = useRouter();

    return (
        <Screen scroll>
            <View style={styles.hero}>
                <BrandMark size="lg" />
                <Text style={styles.title}>VELOCITY FIT</Text>
                <Text style={styles.tagline}>Train hard. Track everything.</Text>
            </View>

            <Card accent style={styles.card}>
                {HIGHLIGHTS.map((h) => (
                    <View key={h.title} style={styles.row}>
                        <View style={styles.badge}>
                            <Text style={styles.badgeIcon}>{h.icon}</Text>
                        </View>
                        <View style={styles.rowText}>
                            <Text style={styles.rowTitle}>{h.title}</Text>
                            <Text style={styles.rowBody}>{h.body}</Text>
                        </View>
                    </View>
                ))}
            </Card>

            <View style={styles.actions}>
                <Button
                    title="Sign in"
                    size="lg"
                    fullWidth
                    onPress={() => router.push('/(auth)/login')}
                />
                <Button
                    title="Create account"
                    variant="ghost"
                    size="lg"
                    fullWidth
                    onPress={() => router.push('/(auth)/register')}
                />
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    hero: {
        alignItems: 'center',
        gap: spacing.md,
        marginTop: spacing.xxxl,
        marginBottom: spacing.xxl,
    },
    title: { ...typography.brand, fontSize: 22 },
    tagline: { ...typography.bodyMuted, textAlign: 'center' },
    card: { gap: spacing.lg },
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
    badge: {
        width: 40,
        height: 40,
        borderRadius: radius.sm,
        backgroundColor: colors.primarySoft,
        borderWidth: 1,
        borderColor: colors.primaryEdge,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeIcon: { fontSize: 18, color: colors.primaryHover },
    rowText: { flex: 1, gap: 2 },
    rowTitle: { ...typography.subheading },
    rowBody: { ...typography.caption, lineHeight: 19 },
    actions: { gap: spacing.sm, marginTop: spacing.xxl },
});