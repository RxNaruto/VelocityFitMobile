import { useState } from 'react';
import { Link } from 'expo-router';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { BrandMark } from '@/components/BrandMark';
import { Button, Card, Input, Screen } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/types';
import { colors, spacing, typography } from '@/theme';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await signUp({
        username: username.trim(),
        name: name.trim(),
        password,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = username.trim().length >= 2 && name.trim().length >= 1 && password.length >= 6;

  return (
    <Screen scroll padded>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.hero}>
          <BrandMark size="lg" showName />
          <Text style={styles.tagline}>Join the leaderboard. Own your progress.</Text>
        </View>

        <Card accent style={styles.card}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Set up your Velocity Fit profile.</Text>

          <View style={styles.form}>
            <Input
              label="Username"
              autoCapitalize="none"
              autoCorrect={false}
              value={username}
              onChangeText={setUsername}
            />
            <Input label="Display name" value={name} onChangeText={setName} />
            <Input
              label="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button
              title="Create account"
              onPress={onSubmit}
              loading={loading}
              fullWidth
              disabled={!canSubmit}
            />
          </View>
        </Card>

        <Text style={styles.footer}>
          Already training?{' '}
          <Link href="/(auth)/login" style={styles.link}>
            Sign in
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
    marginTop: spacing.xl,
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
