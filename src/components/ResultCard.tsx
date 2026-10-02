import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from './ui';
import { formatLine } from '../calculators';
import { colors, radius } from '../theme';
import { ResultLine } from '../types';

export function ResultCard({ lines, title = 'Result' }: { lines: ResultLine[]; title?: string }) {
  const primary = lines.find(l => l.primary);
  const rest = lines.filter(l => l !== primary);
  return (
    <Card>
      <Text style={styles.title}>{title}</Text>
      {primary && (
        <View style={styles.hero}>
          <Text style={styles.heroLabel}>{primary.label}</Text>
          <Text style={styles.heroValue}>{formatLine(primary)}</Text>
        </View>
      )}
      {rest.map((l, i) => (
        <View key={l.key + i} style={[styles.row, i === 0 && styles.rowFirst]}>
          <Text style={styles.rowLabel}>{l.label}</Text>
          <Text style={styles.rowValue}>{formatLine(l)}</Text>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 12 },
  hero: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 6,
  },
  heroLabel: { fontSize: 12, fontWeight: '600', color: colors.primaryDark },
  heroValue: { fontSize: 26, fontWeight: '800', color: colors.primary, marginTop: 4 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    gap: 12,
  },
  rowFirst: { borderTopWidth: 0 },
  rowLabel: { flex: 1, fontSize: 14, color: colors.textMuted },
  rowValue: { fontSize: 14, fontWeight: '700', color: colors.text },
});
