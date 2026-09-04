import { useState } from 'react';
import { Link } from 'expo-router';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { BrandMark } from '@/components/BrandMark';
import { Button, Card, Input, Screen } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/types';
import { colors, spacing, typography } from '@/theme';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await signIn({ username: username.trim(), password });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen scroll padded>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.hero}>
          <BrandMark size="lg" showName />
          <Text style={styles.tagline}>Train hard. Track everything.</Text>
        </View>

        <Card accent style={styles.card}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue your streak.</Text>

          <View style={styles.form}>
            <Input
              label="Username"
              autoCapitalize="none"
              autoCorrect={false}
              value={username}
              onChangeText={setUsername}
              error={error && !username ? 'Required' : undefined}
            />
            <Input
              label="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              error={error && !password ? 'Required' : undefined}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button
              title="Sign in"
              onPress={onSubmit}
              loading={loading}
              fullWidth
              disabled={!username.trim() || !password}
            />
          </View>
        </Card>

        <Text style={styles.footer}>
          New here?{' '}
          <Link href="/(auth)/register" style={styles.link}>
            Create account
          </Link>
        </Text>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: {
    alignItems: 'center',
    marginTop: spacing.xxxl,
    marginBottom: spacing.xxl,
    gap: spacing.md,
  },
  tagline: {
    ...typography.bodyMuted,
    textAlign: 'center',
  },
  card: {
    gap: spacing.md,
  },
  title: {
    ...typography.heading,
  },
  subtitle: {
    ...typography.bodyMuted,
    marginBottom: spacing.sm,
  },
  form: {
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
  },
  footer: {
    ...typography.bodyMuted,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  link: {
    color: colors.primaryHover,
    fontWeight: '600',
  },
});
