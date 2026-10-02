import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { CloudOff, RotateCw } from 'lucide-react-native';
import { WorkTypeField } from '../../api/client';
import { Button, ChipSelect, NumberInput, SelectField, TextField } from '../../components/ui';
import { fieldKind, fieldLabel, fieldOptions, fieldPlaceholder } from '../../estimates/fields';
import { colors, radius } from '../../theme';

export function LoadingView({ label = 'Loading…' }: { label?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.center}>
      <CloudOff size={32} color={colors.textFaint} />
      <Text style={styles.errorText}>{message}</Text>
      <Button label="Try again" icon={RotateCw} variant="secondary" onPress={onRetry} />
    </View>
  );
}

export function InlineError({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }
  return (
    <View style={styles.inlineError} accessibilityLiveRegion="polite">
      <Text style={styles.inlineErrorText}>{message}</Text>
    </View>
  );
}

export function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kv}>
      <Text style={styles.kvLabel}>{label}</Text>
      <Text style={styles.kvValue}>{value}</Text>
    </View>
  );
}

/** One work-type input rendered from its API definition. */
export function FieldInput({
  field,
  value,
  onChange,
  error,
}: {
  field: WorkTypeField;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const kind = fieldKind(field);
  const label = fieldLabel(field);
  let control: React.ReactNode;
  if (kind === 'boolean') {
    control = (
      <ChipSelect
        label={label}
        options={[
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ]}
        value={value}
        onChange={onChange}
      />
    );
  } else if (kind === 'select') {
    const options = fieldOptions(field);
    control = (
      <SelectField
        label={label}
        required={field.required}
        placeholder={fieldPlaceholder(field) || 'Select'}
        options={options.map(o => o.label)}
        value={options.find(o => o.value === value)?.label ?? ''}
        onChange={l => onChange(options.find(o => o.label === l)!.value)}
      />
    );
  } else if (kind === 'text') {
    control = (
      <TextField
        label={label}
        required={field.required}
        value={value}
        onChangeText={onChange}
        placeholder={fieldPlaceholder(field)}
      />
    );
  } else {
    control = (
      <NumberInput
        label={label}
        required={field.required}
        value={value}
        onChangeText={onChange}
        placeholder={fieldPlaceholder(field)}
        integer={kind === 'integer'}
      />
    );
  }
  return (
    <View>
      {control}
      {field.hint ? <Text style={styles.hint}>{field.hint}</Text> : null}
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 12 },
  muted: { fontSize: 13, color: colors.textMuted },
  errorText: { fontSize: 14, color: colors.text, textAlign: 'center', lineHeight: 20, paddingHorizontal: 16 },
  inlineError: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radius.md,
    padding: 12,
  },
  inlineErrorText: { fontSize: 13, color: '#B91C1C', lineHeight: 19 },
  kv: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, gap: 12 },
  kvLabel: { flex: 1, fontSize: 14, color: colors.textMuted },
  kvValue: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text, textAlign: 'right' },
  hint: { fontSize: 12, color: colors.textMuted, marginTop: -8, marginBottom: 12 },
  fieldError: { fontSize: 12, color: colors.danger, marginTop: -8, marginBottom: 12 },
});
