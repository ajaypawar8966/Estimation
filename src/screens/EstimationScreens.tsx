import React, { useState } from 'react';
import { Alert, Share, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FileText, Pencil, Share2, Trash2 } from 'lucide-react-native';
import {
  Button,
  Card,
  EmptyState,
  formatDate,
  PromptModal,
  Screen,
} from '../components/ui';
import { ResultCard } from '../components/ResultCard';
import { CALCULATORS, formatLine } from '../calculators';
import { EstimationStackParamList } from '../navigation/types';
import { useStore } from '../store/AppStore';
import { colors } from '../theme';
import { SavedEstimate } from '../types';

export const estimateToText = (e: SavedEstimate) =>
  [
    `${e.name} (${CALCULATORS[e.calcId].title})`,
    formatDate(e.createdAt),
    '',
    'Inputs',
    ...e.inputs.map(i => `• ${i.label}: ${i.value}`),
    '',
    'Results',
    ...e.results.map(r => `• ${r.label}: ${formatLine(r)}`),
  ].join('\n');

type DetailProps = NativeStackScreenProps<EstimationStackParamList, 'EstimationDetail'>;

export function EstimationDetailScreen({ navigation, route }: DetailProps) {
  const { estimates, renameEstimate, deleteEstimate } = useStore();
  const [renaming, setRenaming] = useState(false);
  const estimate = estimates.find(e => e.id === route.params.id);

  if (!estimate) {
    return (
      <Screen title="Estimate" onBack={navigation.goBack}>
        <EmptyState icon={FileText} title="Estimate not found" body="It may have been deleted." />
      </Screen>
    );
  }

  const confirmDelete = () =>
    Alert.alert('Delete estimate?', `"${estimate.name}" will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          navigation.goBack();
          deleteEstimate(estimate.id);
        },
      },
    ]);

  return (
    <Screen title={estimate.name} onBack={navigation.goBack}>
      <Text style={styles.meta}>
        {CALCULATORS[estimate.calcId].title} · {formatDate(estimate.createdAt)}
      </Text>

      <Card>
        <Text style={styles.cardTitle}>Inputs</Text>
        {estimate.inputs.map((i, idx) => (
          <View key={i.label + idx} style={styles.row}>
            <Text style={styles.rowLabel}>{i.label}</Text>
            <Text style={styles.rowValue}>{i.value}</Text>
          </View>
        ))}
      </Card>

      <ResultCard lines={estimate.results} />

      <View style={styles.actions}>
        <View style={styles.flex}>
          <Button
            label="Share"
            icon={Share2}
            variant="secondary"
            onPress={() => Share.share({ message: estimateToText(estimate) })}
          />
        </View>
        <View style={styles.flex}>
          <Button label="Rename" icon={Pencil} variant="secondary" onPress={() => setRenaming(true)} />
        </View>
      </View>
      <Button label="Delete estimate" icon={Trash2} variant="danger" onPress={confirmDelete} />

      <PromptModal
        visible={renaming}
        title="Rename estimate"
        initial={estimate.name}
        onConfirm={name => {
          renameEstimate(estimate.id, name);
          setRenaming(false);
        }}
        onCancel={() => setRenaming(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 8 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    gap: 12,
  },
  rowLabel: { flex: 1, fontSize: 14, color: colors.textMuted },
  rowValue: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text, textAlign: 'right' },
  actions: { flexDirection: 'row', gap: 10 },
});
