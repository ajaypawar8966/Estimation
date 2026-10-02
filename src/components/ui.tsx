import React, { ReactNode, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ChevronDown, ChevronLeft, LucideIcon, Plus } from 'lucide-react-native';
import { colors, radius, shadow } from '../theme';

/* ---------- Screen chrome ---------- */

export function Header({
  title,
  subtitle,
  onBack,
  right,
  centered,
  below,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  /** Centre the title between the back button and an equal-width spacer. */
  centered?: boolean;
  /** Shown under the title row inside the header, e.g. a search bar. */
  below?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
      <View style={styles.headerRow}>
        {onBack && (
          <Pressable
            onPress={onBack}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backBtn}>
            <ChevronLeft size={20} color={colors.text} />
          </Pressable>
        )}
        <View style={styles.flex}>
          <Text style={[styles.headerTitle, centered && styles.headerTitleCentered]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.headerSub, centered && styles.centerText]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right ?? (centered && onBack ? <View style={styles.backSpacer} /> : null)}
      </View>
      {below}
    </View>
  );
}

export function Screen({
  title,
  subtitle,
  onBack,
  right,
  centered,
  headerBelow,
  children,
  scroll = true,
  footer,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  centered?: boolean;
  headerBelow?: ReactNode;
  children: ReactNode;
  scroll?: boolean;
  /** Pinned below the scrolling content, e.g. a Save button. */
  footer?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.screen}>
      <Header
        title={title}
        subtitle={subtitle}
        onBack={onBack}
        right={right}
        centered={centered}
        below={headerBelow}
      />
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={styles.content}>{children}</View>
      )}
      {footer ? (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          {footer}
        </View>
      ) : null}
    </View>
  );
}

export const SectionTitle = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <View style={styles.sectionTitle}>
    <Text style={styles.sectionHeading}>{title}</Text>
    {subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}
  </View>
);

/* ---------- Cards & tiles ---------- */

export const Card = ({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) => <View style={[styles.card, style]}>{children}</View>;

export function IconTile({
  icon: Icon,
  color,
  background,
  size = 48,
  iconSize = 22,
}: {
  icon: LucideIcon;
  color: string;
  background: string;
  size?: number;
  iconSize?: number;
}) {
  return (
    <View
      style={[
        styles.tile,
        { width: size, height: size, borderRadius: size * 0.3, backgroundColor: background },
      ]}>
      <Icon size={iconSize} color={color} />
    </View>
  );
}

export function GradientTile({
  icon: Icon,
  colors: gradient,
  size = 44,
  iconSize = 22,
}: {
  icon: LucideIcon;
  colors: [string, string];
  size?: number;
  iconSize?: number;
}) {
  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.tile, { width: size, height: size, borderRadius: size * 0.3 }]}>
      <Icon size={iconSize} color="#fff" />
    </LinearGradient>
  );
}

/* ---------- Form controls ---------- */

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon: Icon,
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'gradient' | 'secondary' | 'danger' | 'outline-danger';
  icon?: LucideIcon;
  disabled?: boolean;
  /** Shows a spinner in place of the icon and blocks presses. */
  loading?: boolean;
}) {
  const filled = variant === 'primary' || variant === 'gradient';
  const fg = filled
    ? '#fff'
    : variant === 'danger' || variant === 'outline-danger'
    ? colors.danger
    : colors.text;
  const inactive = disabled || loading;
  const content = (
    <>
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        Icon && <Icon size={18} color={fg} />
      )}
      <Text style={[styles.buttonLabel, { color: fg }]}>{label}</Text>
    </>
  );
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      style={({ pressed }) => [
        styles.button,
        variant === 'gradient' && styles.buttonGradientWrap,
        variant === 'primary' && { backgroundColor: colors.primary },
        variant === 'secondary' && { backgroundColor: colors.chip },
        variant === 'danger' && { backgroundColor: '#FEF2F2' },
        variant === 'outline-danger' && styles.buttonOutlineDanger,
        (pressed || inactive) && { opacity: inactive ? 0.6 : 0.85 },
      ]}>
      {variant === 'gradient' ? (
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.buttonGradient}>
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </Pressable>
  );
}

export function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <Text style={styles.fieldLabel}>
      {label}
      {required ? <Text style={styles.required}> *</Text> : null}
    </Text>
  );
}

export function TextField({
  label,
  unit,
  required,
  hint,
  right,
  ...props
}: TextInputProps & {
  /** Omit when a shared heading labels the input (e.g. paired inputs). */
  label?: string;
  unit?: string;
  required?: boolean;
  hint?: string;
  /** Element shown at the end of the input, e.g. a show-password toggle. */
  right?: ReactNode;
}) {
  return (
    <View style={styles.field}>
      {label ? <FieldLabel label={label} required={required} /> : null}
      <View style={[styles.inputWrap, props.multiline && styles.inputWrapMultiline]}>
        <TextInput
          placeholderTextColor={colors.textFaint}
          {...props}
          style={[styles.input, props.multiline && styles.inputMultiline]}
        />
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
        {right}
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

/**
 * Dropdown-style picker that opens a bottom sheet of options. With
 * `allowAdd`, the sheet also lets the user type a value that isn't listed.
 */
export function SelectField({
  label,
  placeholder,
  options,
  value,
  onChange,
  required,
  disabled,
  hint,
  allowAdd,
}: {
  label: string;
  placeholder: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  disabled?: boolean;
  hint?: string;
  allowAdd?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState('');
  const insets = useSafeAreaInsets();
  // Keep a previously typed value selectable alongside the built-in options.
  const items = value && !options.includes(value) ? [value, ...options] : options;
  const choose = (v: string) => {
    onChange(v);
    setOpen(false);
    setCustom('');
  };

  return (
    <View style={styles.field}>
      <FieldLabel label={label} required={required} />
      <Pressable
        onPress={() => setOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value || placeholder}`}
        accessibilityState={{ disabled: !!disabled }}
        style={[styles.inputWrap, styles.select, disabled && styles.selectDisabled]}>
        <Text
          style={[styles.selectText, !value && styles.selectPlaceholder]}
          numberOfLines={1}>
          {value || placeholder}
        </Text>
        <ChevronDown size={18} color={colors.textMuted} />
      </Pressable>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetBackdrop}>
          <Pressable style={styles.flex} onPress={() => setOpen(false)} accessibilityLabel="Close" />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={styles.modalTitle}>{label}</Text>
            {allowAdd && (
              <View style={styles.addRow}>
                <View style={[styles.inputWrap, styles.flex]}>
                  <TextInput
                    value={custom}
                    onChangeText={setCustom}
                    placeholder="Type to add new"
                    placeholderTextColor={colors.textFaint}
                    autoFocus={!items.length}
                    style={styles.input}
                    returnKeyType="done"
                    onSubmitEditing={() => custom.trim() && choose(custom.trim())}
                  />
                </View>
                <Pressable
                  onPress={() => choose(custom.trim())}
                  disabled={!custom.trim()}
                  accessibilityRole="button"
                  accessibilityLabel="Add"
                  style={[styles.addBtn, !custom.trim() && styles.addBtnDisabled]}>
                  <Plus size={20} color="#fff" />
                </Pressable>
              </View>
            )}
            <FlatList
              data={items}
              keyExtractor={item => item}
              keyboardShouldPersistTaps="handled"
              style={styles.sheetList}
              ListEmptyComponent={
                <Text style={styles.sheetEmpty}>
                  {allowAdd ? 'Nothing saved yet. Type a name above to add it.' : 'No options'}
                </Text>
              }
              renderItem={({ item }) => {
                const selected = item === value;
                return (
                  <Pressable
                    onPress={() => choose(item)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={[styles.option, selected && styles.optionSelected]}>
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                      {item}
                    </Text>
                    {selected && <Check size={18} color={colors.primary} />}
                  </Pressable>
                );
              }}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

/** Numeric input that only accepts digits and a single decimal point. */
export function NumberInput({
  label,
  unit,
  value,
  onChangeText,
  optional,
  placeholder = '0',
  integer,
  required,
}: {
  label?: string;
  required?: boolean;
  unit?: string;
  value: string;
  onChangeText: (t: string) => void;
  optional?: boolean;
  placeholder?: string;
  /** Whole numbers only (e.g. a count). */
  integer?: boolean;
}) {
  return (
    <TextField
      label={label && optional ? `${label} (optional)` : label}
      required={required}
      accessibilityLabel={label ?? placeholder}
      unit={unit}
      value={value}
      keyboardType={integer ? 'number-pad' : 'decimal-pad'}
      placeholder={placeholder}
      onChangeText={t => {
        if (integer) {
          onChangeText(t.replace(/[^0-9]/g, ''));
          return;
        }
        const cleaned = t.replace(/[^0-9.]/g, '');
        const firstDot = cleaned.indexOf('.');
        onChangeText(
          firstDot === -1
            ? cleaned
            : cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, ''),
        );
      }}
    />
  );
}

export function ChipSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.chips}>
        {options.map(o => {
          const active = o.value === value;
          return (
            <Pressable
              key={o.value}
              onPress={() => onChange(o.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{o.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/* ---------- Misc ---------- */

export function EmptyState({
  icon: Icon,
  title,
  body,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
}) {
  return (
    <View style={styles.empty}>
      <IconTile icon={Icon} color={colors.textFaint} background={colors.chip} size={64} iconSize={28} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

/** Modal with a single text input, used for naming things. */
export function PromptModal({
  visible,
  title,
  initial,
  confirmLabel = 'Save',
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  initial: string;
  confirmLabel?: string;
  onConfirm: (text: string) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState(initial);
  useEffect(() => {
    if (visible) {
      setText(initial);
    }
  }, [visible, initial]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TextField label="Name" value={text} onChangeText={setText} autoFocus />
          <View style={styles.modalActions}>
            <View style={styles.flex}>
              <Button label="Cancel" variant="secondary" onPress={onCancel} />
            </View>
            <View style={styles.flex}>
              <Button
                label={confirmLabel}
                disabled={!text.trim()}
                onPress={() => onConfirm(text.trim())}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export const formatDate = (ts: number) =>
  new Date(ts).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const styles = StyleSheet.create({
  flex: { flex: 1 },
  tile: { alignItems: 'center', justifyContent: 'center' },
  inputWrapMultiline: { alignItems: 'flex-start' },
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    gap: 14,
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  centerText: { textAlign: 'center' },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: colors.text },
  headerTitleCentered: { fontSize: 20, textAlign: 'center' },
  backSpacer: { width: 36 },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  content: { padding: 16, paddingBottom: 32, gap: 14 },
  sectionTitle: { marginBottom: 2, marginTop: 4 },
  sectionHeading: { fontSize: 15, fontWeight: '800', color: colors.text },
  sectionSub: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 16,
    ...shadow,
  },
  button: {
    minHeight: 50,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  buttonLabel: { fontSize: 15, fontWeight: '700' },
  buttonGradientWrap: { paddingHorizontal: 0, overflow: 'hidden' },
  buttonGradient: {
    flex: 1,
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  buttonOutlineDanger: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: '#FECACA',
  },
  required: { color: colors.danger },
  hint: { fontSize: 12, color: colors.textMuted, marginTop: 6 },
  select: { height: 50, justifyContent: 'space-between' },
  selectDisabled: { backgroundColor: colors.chip, opacity: 0.7 },
  selectText: { flex: 1, fontSize: 15, color: colors.text, marginRight: 8 },
  selectPlaceholder: { color: colors.textFaint },
  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '75%',
  },
  sheetList: { flexGrow: 0 },
  sheetEmpty: { fontSize: 13, color: colors.textMuted, paddingVertical: 16, textAlign: 'center' },
  addRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  addBtn: {
    width: 50,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: { opacity: 0.4 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
  },
  optionSelected: { backgroundColor: colors.primarySoft },
  optionText: { fontSize: 15, color: colors.text },
  optionTextSelected: { fontWeight: '700', color: colors.primaryDark },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 6 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
  },
  input: { flex: 1, height: 48, fontSize: 15, color: colors.text, padding: 0 },
  inputMultiline: { height: 110, paddingTop: 12, textAlignVertical: 'top' },
  unit: { fontSize: 13, color: colors.textMuted, fontWeight: '600', marginLeft: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.chip,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  chipTextActive: { color: '#fff' },
  empty: { alignItems: 'center', paddingVertical: 56, paddingHorizontal: 24, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginTop: 6 },
  emptyBody: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 19 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 14 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
});
