import React, { useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LogIn } from 'lucide-react-native';
import { Button, TextField } from '../../components/ui';
import { finishAuth } from '../../navigation/requireAuth';
import { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../store/AuthStore';
import { colors } from '../../theme';
import { AuthLayout, ErrorBanner, isEmail, PasswordField } from './AuthLayout';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!isEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Enter your password.');
      return;
    }
    Keyboard.dismiss();
    setError(null);
    setBusy(true);
    try {
      await login(email.trim().toLowerCase(), password);
      finishAuth(navigation);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed. Please try again.');
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue to your account"
      onClose={() => navigation.goBack()}
      footer={
        <Pressable
          onPress={() => navigation.navigate('Signup')}
          accessibilityRole="link"
          hitSlop={8}>
          <Text style={styles.switchText}>
            Don't have an account? <Text style={styles.switchLink}>Sign up</Text>
          </Text>
        </Pressable>
      }>
      <ErrorBanner message={error} />
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="emailAddress"
        autoComplete="email"
        returnKeyType="next"
      />
      <PasswordField value={password} onChangeText={setPassword} onSubmitEditing={submit} />
      <Button label="Sign In" variant="gradient" icon={LogIn} loading={busy} onPress={submit} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  switchText: { fontSize: 14, color: colors.textMuted },
  switchLink: { color: colors.primary, fontWeight: '700' },
});
