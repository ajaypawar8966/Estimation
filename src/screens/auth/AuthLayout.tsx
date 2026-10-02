import React, { ReactNode, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calculator, Eye, EyeOff, X } from 'lucide-react-native';
import { TextField } from '../../components/ui';
import { colors, radius, shadow } from '../../theme';

/** Branded gradient header with a white form card underneath. */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  onClose,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
  /** Dismisses sign in/up and returns to the app. */
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 36 }]}>
          <Pressable
            onPress={onClose}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={[styles.close, { top: insets.top + 12 }]}>
            <X size={22} color="#fff" />
          </Pressable>
          <View style={styles.logo}>
            <Calculator size={30} color={colors.primary} />
          </View>
          <Text style={styles.appName}>Estimation</Text>
          <Text style={styles.tagline}>Field estimates, diary and site records</Text>
        </LinearGradient>

        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <View style={styles.form}>{children}</View>
        </View>

        <View style={styles.footer}>{footer}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Password input with a show/hide toggle. */
export function PasswordField({
  label = 'Password',
  value,
  onChangeText,
  onSubmitEditing,
  required,
  hint,
}: {
  label?: string;
  value: string;
  onChangeText: (t: string) => void;
  onSubmitEditing?: () => void;
  required?: boolean;
  hint?: string;
}) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;
  return (
    <TextField
      label={label}
      required={required}
      hint={hint}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={!visible}
      autoCapitalize="none"
      autoCorrect={false}
      textContentType="password"
      placeholder="Enter password"
      returnKeyType="go"
      onSubmitEditing={onSubmitEditing}
      right={
        <Pressable
          onPress={() => setVisible(v => !v)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}>
          <Icon size={20} color={colors.textMuted} />
        </Pressable>
      }
    />
  );
}

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }
  return (
    <View style={styles.error} accessibilityLiveRegion="polite">
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1 },
  hero: {
    alignItems: 'center',
    paddingBottom: 64,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  close: {
    position: 'absolute',
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  appName: { fontSize: 26, fontWeight: '800', color: '#fff' },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  card: {
    marginTop: -40,
    marginHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 20,
    ...shadow,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  form: { marginTop: 20 },
  footer: { alignItems: 'center', paddingVertical: 20 },
  error: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 14,
  },
  errorText: { fontSize: 13, color: '#B91C1C', lineHeight: 19 },
});
