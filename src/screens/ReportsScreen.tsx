import React, { useMemo } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChartColumn, Share2 } from 'lucide-react-native';
import { Button, Card, EmptyState, Screen, SectionTitle } from '../components/ui';
import { CALCULATORS, formatNumber } from '../calculators';
import { HomeStackParamList } from '../navigation/types';
import { useStore } from '../store/AppStore';
import { colors } from '../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'Reports'>;

/** Material totals worth summing across estimates, in display order. */
const TOTALS: { key: string; label: string; unit: string; decimals: number }[] = [
  { key: 'cement_bags', label: 'Cement', unit: 'bags', decimals: 0 },
  { key: 'sand_m3', label: 'Sand', unit: 'm³', decimals: 2 },
  { key: 'aggregate_m3', label: 'Aggregate', unit: 'm³', decimals: 2 },
  { key: 'bricks', label: 'Bricks', unit: 'nos', decimals: 0 },
  { key: 'steel_kg', label: 'Steel', unit: 'kg', decimals: 0 },
  { key: 'tiles', label: 'Tiles', unit: 'nos', decimals: 0 },
  { key: 'paint_l', label: 'Paint', unit: 'L', decimals: 1 },
  { key: 'shutter_m2', label: 'Shuttering', unit: 'm²', decimals: 1 },
];

export default function ReportsScreen({ navigation }: Props) {
  const { estimates } = useStore();

  const { totals, byType } = useMemo(() => {
    const sums: Record<string, number> = {};
    const counts: Record<string, number> = {};
    for (const e of estimates) {
      counts[e.calcId] = (counts[e.calcId] ?? 0) + 1;
      for (const r of e.results) {
        sums[r.key] = (sums[r.key] ?? 0) + r.value;
      }
    }
    return {
      totals: TOTALS.filter(t => (sums[t.key] ?? 0) > 0).map(t => ({ ...t, value: sums[t.key] })),
      byType: Object.entries(counts),
    };
  }, [estimates]);

  const shareReport = () =>
    Share.share({
      message: [
        'Material summary',
        `${estimates.length} saved estimate(s)`,
        '',
        ...totals.map(t => `• ${t.label}: ${formatNumber(t.value, t.decimals)} ${t.unit}`),
      ].join('\n'),
    });

  return (
    <Screen title="Reports" onBack={navigation.goBack}>
      {estimates.length === 0 ? (
        <EmptyState
          icon={ChartColumn}
          title="Nothing to report yet"
          body="Save estimates from the Material Calculator and their combined totals appear here."
        />
      ) : (
        <>
          <Card style={styles.hero}>
            <Text style={styles.heroValue}>{estimates.length}</Text>
            <Text style={styles.heroLabel}>saved estimates</Text>
          </Card>

          <SectionTitle title="Total materials" subtitle="Summed across all saved estimates" />
          <Card>
            {totals.map((t, i) => (
              <View key={t.key} style={[styles.row, i > 0 && styles.rowBorder]}>
                <Text style={styles.label}>{t.label}</Text>
                <Text style={styles.value}>
                  {formatNumber(t.value, t.decimals)} {t.unit}
                </Text>
              </View>
            ))}
          </Card>

          <SectionTitle title="Estimates by type" />
          <Card>
            {byType.map(([id, count], i) => (
              <View key={id} style={[styles.row, i > 0 && styles.rowBorder]}>
                <Text style={styles.label}>{CALCULATORS[id as keyof typeof CALCULATORS].title}</Text>
                <Text style={styles.value}>{count}</Text>
              </View>
            ))}
          </Card>

          <Button label="Share report" icon={Share2} onPress={shareReport} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingVertical: 22 },
  heroValue: { fontSize: 40, fontWeight: '800', color: colors.primary },
  heroLabel: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.divider },
  label: { fontSize: 14, color: colors.textMuted },
  value: { fontSize: 14, fontWeight: '700', color: colors.text },
});
