import React, { useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { UserPlus } from 'lucide-react-native';
import { Button, TextField } from '../../components/ui';
import { finishAuth } from '../../navigation/requireAuth';
import { RootStackParamList } from '../../navigation/types';
import { useAuth } from '../../store/AuthStore';
import { colors } from '../../theme';
import { AuthLayout, ErrorBanner, isEmail, PasswordField } from './AuthLayout';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

const MIN_PASSWORD = 6;

export default function SignupScreen({ navigation }: Props) {
  const { signup } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    designation: '',
    organization: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (key: keyof typeof form) => (value: string) => setForm(f => ({ ...f, [key]: value }));

  const submit = async () => {
    if (!form.name.trim()) {
      setError('Enter your full name.');
      return;
    }
    if (!isEmail(form.email)) {
      setError('Enter a valid email address.');
      return;
    }
    if (form.password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters.`);
      return;
    }
    Keyboard.dismiss();
    setError(null);
    setBusy(true);
    try {
      await signup({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        // Optional fields are left out rather than sent as empty strings.
        ...(form.phone.trim() && { phone: form.phone.trim() }),
        ...(form.designation.trim() && { designation: form.designation.trim() }),
        ...(form.organization.trim() && { organization: form.organization.trim() }),
      });
      finishAuth(navigation);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign up failed. Please try again.');
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Create account"
      subtitle="Sign up to save your work to your account"
      onClose={() => navigation.popTo('Main')}
      footer={
        <Pressable onPress={() => navigation.goBack()} accessibilityRole="link" hitSlop={8}>
          <Text style={styles.switchText}>
            Already have an account? <Text style={styles.switchLink}>Sign in</Text>
          </Text>
        </Pressable>
      }>
      <ErrorBanner message={error} />
      <TextField
        label="Full name"
        required
        value={form.name}
        onChangeText={set('name')}
        placeholder="e.g. Ravi Sharma"
        autoCapitalize="words"
        textContentType="name"
      />
      <TextField
        label="Email"
        required
        value={form.email}
        onChangeText={set('email')}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="emailAddress"
        autoComplete="email"
      />
      <PasswordField
        required
        value={form.password}
        onChangeText={set('password')}
        hint={`At least ${MIN_PASSWORD} characters`}
      />
      <TextField
        label="Phone"
        value={form.phone}
        onChangeText={set('phone')}
        placeholder="10-digit mobile number"
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        maxLength={15}
      />
      <TextField
        label="Designation"
        value={form.designation}
        onChangeText={set('designation')}
        placeholder="e.g. Sub Engineer"
        autoCapitalize="words"
      />
      <TextField
        label="Organization"
        value={form.organization}
        onChangeText={set('organization')}
        placeholder="e.g. Gram Panchayat Rampur"
        autoCapitalize="words"
      />
      <Button
        label="Create Account"
        variant="gradient"
        icon={UserPlus}
        loading={busy}
        onPress={submit}
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  switchText: { fontSize: 14, color: colors.textMuted },
  switchLink: { color: colors.primary, fontWeight: '700' },
});
