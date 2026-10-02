import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChevronRight, ClipboardList, FileText, Plus } from 'lucide-react-native';
import { api, EstimateSummary, Project } from '../../api/client';
import { useApi } from '../../api/useApi';
import { CALCULATORS, formatLine } from '../../calculators';
import {
  Button,
  Card,
  EmptyState,
  formatDate,
  IconTile,
  Screen,
  SectionTitle,
} from '../../components/ui';
import { EstimationStackParamList } from '../../navigation/types';
import { useStore } from '../../store/AppStore';
import { colors } from '../../theme';
import { formatRupees } from '../../utils/money';
import { ErrorView, LoadingView } from './shared';

type Props = NativeStackScreenProps<EstimationStackParamList, 'Valuation'>;

type Row = EstimateSummary & { projectName: string };

/** Every estimate across projects, newest first; only projects with estimates are opened. */
async function loadValuation(token: string) {
  const projects: Project[] = await api.projects(token);
  const details = await Promise.all(
    projects.filter(p => p.estimates_count > 0).map(p => api.project(token, p.id)),
  );
  const rows: Row[] = details
    .flatMap(p => p.estimates.map(e => ({ ...e, projectName: p.name })))
    .sort((a, b) => Date.parse(b.calculated_at) - Date.parse(a.calculated_at));
  return { projects, rows, total: projects.reduce((s, p) => s + (p.total_amount ?? 0), 0) };
}

export default function ValuationScreen({ navigation }: Props) {
  const { estimates: materialEstimates } = useStore();
  const { data, error, reload } = useApi(loadValuation, []);

  const materials = materialEstimates.length > 0 && (
    <>
      <SectionTitle title="Material Estimates" subtitle="Saved from the Material Calculator on this phone" />
      {materialEstimates.map(e => {
        const primary = e.results.find(r => r.primary) ?? e.results[0];
        return (
          <Pressable
            key={e.id}
            accessibilityRole="button"
            onPress={() => navigation.navigate('EstimationDetail', { id: e.id })}>
            <Card style={styles.item}>
              <IconTile icon={FileText} color="#2563EB" background="#EFF6FF" />
              <View style={styles.flex}>
                <Text style={styles.name} numberOfLines={1}>
                  {e.name}
                </Text>
                <Text style={styles.meta}>
                  {CALCULATORS[e.calcId].title} · {formatDate(e.createdAt)}
                </Text>
                {primary && (
                  <Text style={[styles.amount, styles.amountBlue]}>
                    {primary.label}: {formatLine(primary)}
                  </Text>
                )}
              </View>
              <ChevronRight size={18} color={colors.textFaint} />
            </Card>
          </Pressable>
        );
      })}
    </>
  );

  return (
    <Screen title="Valuation" onBack={navigation.goBack}>
      {error && !data ? (
        <ErrorView message={error} onRetry={reload} />
      ) : !data ? (
        <LoadingView label="Loading estimates…" />
      ) : data.rows.length === 0 ? (
        <>
          <EmptyState
            icon={ClipboardList}
            title="No estimates yet"
            body="Create a new work or start from a template. Its estimated cost will appear here."
          />
          <Button
            label="Create New Work"
            icon={Plus}
            variant="gradient"
            onPress={() => navigation.navigate('CreateWork')}
          />
        </>
      ) : (
        <>
          <Card style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total Valuation</Text>
            <Text style={styles.totalValue}>{formatRupees(data.total, 2)}</Text>
            <Text style={styles.totalMeta}>
              {data.rows.length} estimate{data.rows.length === 1 ? '' : 's'} in {data.projects.length}{' '}
              project{data.projects.length === 1 ? '' : 's'}
            </Text>
          </Card>
          {data.rows.map(e => (
            <Pressable
              key={e.id}
              accessibilityRole="button"
              onPress={() => navigation.navigate('EstimateDetail', { id: e.id })}>
              <Card style={styles.item}>
                <IconTile icon={ClipboardList} color={colors.primary} background="#FFF3E8" />
                <View style={styles.flex}>
                  <Text style={styles.name} numberOfLines={2}>
                    {e.name}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {e.work_type_title} · {e.projectName}
                  </Text>
                  <Text style={styles.amount}>{formatRupees(e.total_amount)}</Text>
                </View>
                <ChevronRight size={18} color={colors.textFaint} />
              </Card>
            </Pressable>
          ))}
        </>
      )}
      {materials}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  name: { fontSize: 15, fontWeight: '800', color: colors.text },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  amount: { fontSize: 14, color: colors.primary, fontWeight: '800', marginTop: 6 },
  amountBlue: { color: '#2563EB', fontSize: 13 },
  totalCard: { backgroundColor: colors.primarySoft, alignItems: 'center', paddingVertical: 20 },
  totalLabel: { fontSize: 13, fontWeight: '600', color: colors.primaryDark },
  totalValue: { fontSize: 28, fontWeight: '800', color: colors.primaryDark, marginTop: 4 },
  totalMeta: { fontSize: 12, color: colors.textMuted, marginTop: 6 },
});
