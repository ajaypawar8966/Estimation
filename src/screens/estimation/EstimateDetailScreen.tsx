import React, { useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  FileText,
  Pencil,
  RefreshCw,
  Share2,
  Trash2,
} from 'lucide-react-native';
import { api, Estimate, InputValue, LineItem, Measurement, WorkTypeField } from '../../api/client';
import { downloadEstimate } from '../../api/download';
import { useApi } from '../../api/useApi';
import { Button, Card, formatDate, Screen } from '../../components/ui';
import { fieldLabel } from '../../estimates/fields';
import { EstimationStackParamList } from '../../navigation/types';
import { useAuth } from '../../store/AuthStore';
import { colors, radius } from '../../theme';
import { formatQty, formatRupees } from '../../utils/money';
import { ErrorView, KeyValue, LoadingView } from './shared';

type Props = NativeStackScreenProps<EstimationStackParamList, 'EstimateDetail'>;

const unitText = (u: string) => u.replace(/m3$/, 'm³').replace(/m2$/, 'm²');

const measurementText = (m: Measurement) => {
  const parts = [m.nos, m.length, m.breadth, m.depth, m.factor]
    .filter((n): n is number => n !== null && n !== undefined)
    .map(n => formatQty(n));
  return `${parts.join(' × ')} = ${formatQty(m.quantity)}`;
};

const inputText = (v: InputValue) => (typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v));

export const estimateToText = (e: Estimate) =>
  [
    e.name,
    `${e.work_type_title} · ${formatDate(Date.parse(e.calculated_at))}`,
    '',
    'Abstract of cost',
    ...e.line_items.map(
      l =>
        `${l.sl_no}. ${l.description} — ${formatQty(l.quantity)} ${unitText(l.unit)} × ${formatRupees(l.rate, 2)} = ${formatRupees(l.amount, 2)}`,
    ),
    '',
    `Subtotal: ${formatRupees(e.subtotal, 2)}`,
    `Contingency @ ${e.contingency_percent}%: ${formatRupees(e.contingency_amount, 2)}`,
    `GST @ ${e.gst_percent}%: ${formatRupees(e.gst_amount, 2)}`,
    `Total: ${formatRupees(e.total_amount, 2)}`,
    e.total_in_words,
  ].join('\n');

function LineItemRow({ item, first }: { item: LineItem; first: boolean }) {
  const [open, setOpen] = useState(false);
  const Chevron = open ? ChevronUp : ChevronDown;
  return (
    <View style={[styles.line, !first && styles.lineDivider]}>
      <Pressable
        onPress={() => setOpen(o => !o)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityHint="Shows the measurement details">
        <View style={styles.lineHead}>
          <Text style={styles.lineCode}>
            {item.sl_no}. {item.code}
          </Text>
          <Chevron size={16} color={colors.textFaint} />
        </View>
        <Text style={styles.lineDesc} numberOfLines={open ? undefined : 2}>
          {item.description}
        </Text>
        <View style={styles.lineRow}>
          <Text style={styles.lineQty}>
            {formatQty(item.quantity)} {unitText(item.unit)} × {formatRupees(item.rate, 2)}
          </Text>
          <Text style={styles.lineAmount}>{formatRupees(item.amount, 2)}</Text>
        </View>
      </Pressable>
      {open && item.measurements.length > 0 && (
        <View style={styles.measurements}>
          {item.measurements.map((m, i) => (
            <View key={i} style={styles.measurement}>
              <Text style={[styles.mDesc, m.deduct && styles.deduct]}>
                {m.deduct ? 'Deduct: ' : ''}
                {m.description}
              </Text>
              <Text style={[styles.mCalc, m.deduct && styles.deduct]}>{measurementText(m)}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={[styles.sumRow, strong && styles.sumTotal]}>
      <Text style={strong ? styles.sumTotalLabel : styles.sumLabel}>{label}</Text>
      <Text style={strong ? styles.sumTotalValue : styles.sumValue}>{value}</Text>
    </View>
  );
}

export default function EstimateDetailScreen({ navigation, route }: Props) {
  const { id } = route.params;
  const { authed } = useAuth();
  const { data: estimate, setData, error, reload } = useApi(t => api.estimate(t, id), [id]);
  // Field labels for the inputs list; the estimate only has keys.
  const workType = useApi(
    estimate ? t => api.workType(t, estimate.work_type) : null,
    [estimate?.work_type],
  );
  const [busy, setBusy] = useState<'recalc' | 'pdf' | 'excel' | 'delete' | null>(null);
  const [showInputs, setShowInputs] = useState(false);

  if (!estimate) {
    return (
      <Screen title="Estimate" onBack={navigation.goBack}>
        {error ? <ErrorView message={error} onRetry={reload} /> : <LoadingView />}
      </Screen>
    );
  }

  const fieldsByKey = new Map<string, WorkTypeField>(
    (workType.data?.fields ?? []).map(f => [f.key, f]),
  );

  const recalculate = async () => {
    setBusy('recalc');
    try {
      setData(await authed(t => api.recalculateEstimate(t, id)));
    } catch (e) {
      Alert.alert('Could not recalculate', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const download = async (kind: 'pdf' | 'excel') => {
    setBusy(kind);
    try {
      await authed(t => downloadEstimate(t, estimate, kind));
    } catch (e) {
      Alert.alert('Download failed', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(null);
    }
  };

  const confirmDelete = () =>
    Alert.alert('Delete estimate?', `"${estimate.name}" will be deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setBusy('delete');
          try {
            await authed(t => api.deleteEstimate(t, id));
            navigation.goBack();
          } catch (e) {
            setBusy(null);
            Alert.alert('Could not delete', e instanceof Error ? e.message : 'Please try again.');
          }
        },
      },
    ]);

  const overrides = Object.entries(estimate.rate_overrides ?? {});

  return (
    <Screen
      title={estimate.name}
      onBack={navigation.goBack}
      right={
        <Pressable
          onPress={() => navigation.navigate('CreateWork', { estimateId: id })}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Edit estimate"
          style={styles.headerBtn}>
          <Pencil size={18} color={colors.primary} />
        </Pressable>
      }>
      <Card style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Estimated Cost</Text>
        <Text style={styles.totalValue}>{formatRupees(estimate.total_amount, 2)}</Text>
        <Text style={styles.words}>{estimate.total_in_words}</Text>
        <Text style={styles.totalMeta}>
          {estimate.work_type_title} · calculated {formatDate(Date.parse(estimate.calculated_at))}
        </Text>
      </Card>

      <View style={styles.actions}>
        <View style={styles.flex}>
          <Button
            label="PDF"
            icon={FileText}
            variant="secondary"
            loading={busy === 'pdf'}
            disabled={!!busy && busy !== 'pdf'}
            onPress={() => download('pdf')}
          />
        </View>
        <View style={styles.flex}>
          <Button
            label="Excel"
            icon={FileSpreadsheet}
            variant="secondary"
            loading={busy === 'excel'}
            disabled={!!busy && busy !== 'excel'}
            onPress={() => download('excel')}
          />
        </View>
      </View>

      <Card>
        <Text style={styles.cardTitle}>Abstract of Cost</Text>
        <SummaryRow label="Subtotal" value={formatRupees(estimate.subtotal, 2)} />
        <SummaryRow
          label={`Contingency @ ${estimate.contingency_percent}%`}
          value={formatRupees(estimate.contingency_amount, 2)}
        />
        <SummaryRow
          label={`GST @ ${estimate.gst_percent}%`}
          value={formatRupees(estimate.gst_amount, 2)}
        />
        <SummaryRow label="Total" value={formatRupees(estimate.total_amount, 2)} strong />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Items ({estimate.line_items.length})</Text>
        <Text style={styles.tapHint}>Tap an item to see its measurements.</Text>
        {estimate.line_items.map((l, i) => (
          <LineItemRow key={`${l.sl_no}-${l.code}`} item={l} first={i === 0} />
        ))}
      </Card>

      {estimate.materials.length > 0 && (
        <Card>
          <Text style={styles.cardTitle}>Materials Required</Text>
          {estimate.materials.map(m => (
            <KeyValue key={m.key} label={m.name} value={`${formatQty(m.quantity, 2)} ${unitText(m.unit)}`} />
          ))}
        </Card>
      )}

      <Card>
        <Pressable
          onPress={() => setShowInputs(s => !s)}
          accessibilityRole="button"
          accessibilityState={{ expanded: showInputs }}
          style={styles.inputsHead}>
          <Text style={[styles.cardTitle, styles.flex]}>Inputs Used</Text>
          {showInputs ? (
            <ChevronUp size={18} color={colors.textFaint} />
          ) : (
            <ChevronDown size={18} color={colors.textFaint} />
          )}
        </Pressable>
        {showInputs &&
          Object.entries(estimate.inputs).map(([key, v]) => {
            const f = fieldsByKey.get(key);
            return (
              <KeyValue
                key={key}
                label={f ? fieldLabel(f) : key.replace(/_/g, ' ')}
                value={inputText(v)}
              />
            );
          })}
        {overrides.length > 0 && (
          <>
            <Text style={styles.subTitle}>Rate overrides</Text>
            {overrides.map(([code, rate]) => (
              <KeyValue key={code} label={code} value={formatRupees(rate, 2)} />
            ))}
          </>
        )}
      </Card>

      <Button
        label="Recalculate with Current Rates"
        icon={RefreshCw}
        variant="secondary"
        loading={busy === 'recalc'}
        disabled={!!busy && busy !== 'recalc'}
        onPress={recalculate}
      />
      <Button
        label="Share Summary"
        icon={Share2}
        variant="secondary"
        onPress={() => Share.share({ message: estimateToText(estimate) })}
      />
      <Button
        label="Delete Estimate"
        icon={Trash2}
        variant="danger"
        loading={busy === 'delete'}
        disabled={!!busy && busy !== 'delete'}
        onPress={confirmDelete}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalCard: { backgroundColor: colors.primarySoft, alignItems: 'center', paddingVertical: 20 },
  totalLabel: { fontSize: 13, fontWeight: '600', color: colors.primaryDark },
  totalValue: { fontSize: 28, fontWeight: '800', color: colors.primaryDark, marginTop: 4 },
  words: { fontSize: 12, color: colors.textMuted, marginTop: 6, textAlign: 'center', fontStyle: 'italic' },
  totalMeta: { fontSize: 12, color: colors.textMuted, marginTop: 6 },
  actions: { flexDirection: 'row', gap: 10 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 8 },
  subTitle: { fontSize: 13, fontWeight: '800', color: colors.text, marginTop: 10 },
  tapHint: { fontSize: 12, color: colors.textFaint, marginTop: -4, marginBottom: 4 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  sumLabel: { fontSize: 14, color: colors.textMuted },
  sumValue: { fontSize: 14, fontWeight: '600', color: colors.text },
  sumTotal: { borderTopWidth: 2, borderTopColor: colors.border, marginTop: 6, paddingTop: 10 },
  sumTotalLabel: { fontSize: 15, fontWeight: '800', color: colors.text },
  sumTotalValue: { fontSize: 17, fontWeight: '800', color: colors.primaryDark },
  line: { paddingVertical: 12 },
  lineDivider: { borderTopWidth: 1, borderTopColor: colors.divider },
  lineHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lineCode: { fontSize: 12, fontWeight: '800', color: colors.primaryDark },
  lineDesc: { fontSize: 13, color: colors.text, lineHeight: 19, marginTop: 4 },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, gap: 8 },
  lineQty: { flex: 1, fontSize: 13, color: colors.textMuted },
  lineAmount: { fontSize: 14, fontWeight: '800', color: colors.text },
  measurements: {
    marginTop: 10,
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    padding: 10,
    gap: 8,
  },
  measurement: { gap: 2 },
  mDesc: { fontSize: 12, fontWeight: '600', color: colors.text },
  mCalc: { fontSize: 12, color: colors.textMuted },
  deduct: { color: colors.danger },
  inputsHead: { flexDirection: 'row', alignItems: 'center' },
});
