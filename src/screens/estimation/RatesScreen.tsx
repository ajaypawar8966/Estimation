import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Search } from 'lucide-react-native';
import { api, Rate } from '../../api/client';
import { useApi } from '../../api/useApi';
import { Button, Card, NumberInput, Screen } from '../../components/ui';
import { EstimationStackParamList } from '../../navigation/types';
import { useAuth } from '../../store/AuthStore';
import { colors, radius } from '../../theme';
import { formatRupees } from '../../utils/money';
import { ErrorView, LoadingView } from './shared';

type Props = NativeStackScreenProps<EstimationStackParamList, 'Rates'>;

const unitText = (u: string) => u.replace(/m3$/, 'm³').replace(/m2$/, 'm²');

function RateEditor({
  rate,
  onClose,
  onSaved,
}: {
  rate: Rate;
  onClose: () => void;
  onSaved: (r: Rate) => void;
}) {
  const { authed } = useAuth();
  const [value, setValue] = useState(String(rate.rate));
  const [busy, setBusy] = useState<'save' | 'reset' | null>(null);

  const save = async () => {
    const n = Number(value);
    if (!(n > 0)) {
      Alert.alert('Invalid rate', 'Enter a rate greater than zero.');
      return;
    }
    setBusy('save');
    try {
      onSaved(await authed(t => api.setRate(t, rate.code, n)));
    } catch (e) {
      Alert.alert('Could not save rate', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const reset = async () => {
    setBusy('reset');
    try {
      await authed(t => api.resetRate(t, rate.code));
      onSaved({ ...rate, rate: rate.default_rate, source: 'global' });
    } catch (e) {
      Alert.alert('Could not reset rate', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}>
        <View style={styles.modal}>
          <Text style={styles.modalCode}>{rate.code}</Text>
          <Text style={styles.modalDesc}>{rate.description}</Text>
          <Text style={styles.modalDefault}>
            SOR rate: {formatRupees(rate.default_rate, 2)} per {unitText(rate.unit)}
          </Text>
          <NumberInput
            label={`Your rate (₹ per ${unitText(rate.unit)})`}
            value={value}
            onChangeText={setValue}
          />
          <View style={styles.modalActions}>
            <View style={styles.flex}>
              <Button label="Cancel" variant="secondary" onPress={onClose} disabled={!!busy} />
            </View>
            <View style={styles.flex}>
              <Button label="Save" variant="gradient" loading={busy === 'save'} disabled={busy === 'reset'} onPress={save} />
            </View>
          </View>
          {rate.source === 'personal' && (
            <Button
              label="Reset to SOR rate"
              variant="danger"
              loading={busy === 'reset'}
              disabled={busy === 'save'}
              onPress={reset}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function RatesScreen({ navigation }: Props) {
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Rate | null>(null);
  // Load everything once and filter locally; `?category=` is used when a chip is picked.
  const all = useApi(t => api.rates(t), []);
  const filtered = useApi(category ? t => api.rates(t, category) : null, [category]);
  const source = category ? filtered : all;

  const categories = useMemo(
    () => [...new Set((all.data ?? []).map(r => r.category))].filter(Boolean),
    [all.data],
  );
  const q = query.trim().toLowerCase();
  const rates = (source.data ?? []).filter(
    r => !q || r.code.toLowerCase().includes(q) || r.description.toLowerCase().includes(q),
  );
  const personalCount = (all.data ?? []).filter(r => r.source === 'personal').length;

  const applySaved = (saved: Rate) => {
    const patch = (list: Rate[] | null) => list?.map(r => (r.code === saved.code ? saved : r)) ?? null;
    all.setData(patch(all.data));
    filtered.setData(patch(filtered.data));
    setEditing(null);
  };

  return (
    <Screen title="Rate/CSR" onBack={navigation.goBack}>
      <Text style={styles.intro}>
        Estimates use these SOR rates. Tap a rate to use your own value; recalculate an estimate to
        apply new rates to it.{personalCount ? ` You have ${personalCount} custom rate${personalCount === 1 ? '' : 's'}.` : ''}
      </Text>

      <View style={styles.search}>
        <Search size={18} color={colors.textFaint} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search code or description"
          placeholderTextColor={colors.textFaint}
          style={styles.searchInput}
        />
      </View>

      {categories.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {[null, ...categories].map(c => {
            const active = c === category;
            return (
              <Pressable
                key={c ?? 'all'}
                onPress={() => setCategory(c)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{c ?? 'All'}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {source.error && !source.data ? (
        <ErrorView message={source.error} onRetry={source.reload} />
      ) : !source.data ? (
        <LoadingView label="Loading rates…" />
      ) : rates.length === 0 ? (
        <Text style={styles.empty}>No rates match your search.</Text>
      ) : (
        rates.map(r => (
          <Pressable key={r.code} onPress={() => setEditing(r)} accessibilityRole="button">
            <Card style={styles.rate}>
              <View style={styles.rateHead}>
                <Text style={styles.code}>{r.code}</Text>
                {r.source === 'personal' && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Custom</Text>
                  </View>
                )}
              </View>
              <Text style={styles.desc} numberOfLines={3}>
                {r.description}
              </Text>
              <View style={styles.rateRow}>
                <Text style={styles.category}>{r.category}</Text>
                <Text style={styles.value}>
                  {formatRupees(r.rate, 2)}
                  <Text style={styles.unit}> / {unitText(r.unit)}</Text>
                </Text>
              </View>
              {r.source === 'personal' && (
                <Text style={styles.default}>SOR rate {formatRupees(r.default_rate, 2)}</Text>
              )}
            </Card>
          </Pressable>
        ))
      )}

      {editing && (
        // Keyed so the input starts from each rate's current value.
        <RateEditor
          key={editing.code}
          rate={editing}
          onClose={() => setEditing(null)}
          onSaved={applySaved}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  intro: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, height: 46, fontSize: 15, color: colors.text, padding: 0 },
  chips: { gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.chip,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  chipTextActive: { color: '#fff' },
  empty: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: 24 },
  rate: { gap: 6 },
  rateHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  code: { fontSize: 12, fontWeight: '800', color: colors.primaryDark },
  badge: { backgroundColor: '#EFF6FF', borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#2563EB' },
  desc: { fontSize: 13, color: colors.text, lineHeight: 19 },
  rateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  category: { fontSize: 12, color: colors.textMuted },
  value: { fontSize: 15, fontWeight: '800', color: colors.text },
  unit: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  default: { fontSize: 12, color: colors.textFaint },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'center', padding: 24 },
  modal: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 20, gap: 10 },
  modalCode: { fontSize: 13, fontWeight: '800', color: colors.primaryDark },
  modalDesc: { fontSize: 14, color: colors.text, lineHeight: 20 },
  modalDefault: { fontSize: 13, color: colors.textMuted, marginBottom: 4 },
  modalActions: { flexDirection: 'row', gap: 10 },
});
