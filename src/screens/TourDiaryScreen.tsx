import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Calendar, ChevronRight, FolderOpen, Plus } from 'lucide-react-native';
import { Card, IconTile, Screen, SectionTitle } from '../components/ui';
import { HomeStackParamList } from '../navigation/types';
import { useStore } from '../store/AppStore';
import { colors, radius, shadow } from '../theme';
import { entriesLabel, monthKey, monthLabel } from '../utils/month';

type Props = NativeStackScreenProps<HomeStackParamList, 'TourDiary'>;

export function StatsFooter({
  stats,
}: {
  stats: { label: string; value: number; color: string }[];
}) {
  return (
    <View style={styles.stats}>
      {stats.map((s, i) => (
        <View key={s.label} style={[styles.stat, i > 0 && styles.statDivider]}>
          <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
          <Text style={styles.statLabel}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

export default function TourDiaryScreen({ navigation }: Props) {
  const { diary } = useStore();
  const current = monthKey(Date.now());

  // Newest month first; the current month is always listed so it can be opened.
  const months = useMemo(() => {
    const counts = new Map<string, number>([[current, 0]]);
    diary.forEach(d => {
      const k = monthKey(d.createdAt);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    });
    return [...counts.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [diary, current]);
  const currentCount = months.find(([k]) => k === current)?.[1] ?? 0;

  return (
    <Screen
      title="Tour Diary"
      subtitle="Field work journal"
      onBack={navigation.goBack}
      footer={
        <StatsFooter
          stats={[
            { label: 'Months', value: months.length, color: colors.primary },
            { label: 'Total Entries', value: diary.length, color: '#2563EB' },
          ]}
        />
      }
    >
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroTop}>
          <View style={styles.heroTag}>
            <Calendar size={18} color="#fff" />
            <Text style={styles.heroTagText}>Current Month</Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate('TourDiaryEntry')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
          >
            <Plus size={16} color="#fff" />
            <Text style={styles.addText}>Add Entry</Text>
          </Pressable>
        </View>
        <Text style={styles.heroMonth}>{monthLabel(current)}</Text>
        <Text style={styles.heroCount}>{entriesLabel(currentCount)}</Text>
      </LinearGradient>

      <SectionTitle title="All Months" />
      {months.map(([key, count]) => (
        <Pressable
          key={key}
          onPress={() => navigation.navigate('TourDiaryMonth', { month: key })}
          accessibilityRole="button"
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Card
            style={[styles.monthRow, key === current && styles.monthCurrent]}
          >
            <IconTile
              icon={FolderOpen}
              color={colors.primary}
              background="#FFEDD5"
              size={46}
            />
            <View style={styles.flex}>
              <Text style={styles.monthTitle}>{monthLabel(key)}</Text>
              <Text style={styles.monthCount}>{entriesLabel(count)}</Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.85 },
  hero: { borderRadius: radius.lg, padding: 18, gap: 4, ...shadow },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTag: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroTagText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  addText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  heroMonth: { fontSize: 20, fontWeight: '800', color: '#fff', marginTop: 14 },
  heroCount: { fontSize: 12, color: 'rgba(255,255,255,0.9)' },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
  },
  monthCurrent: { borderWidth: 1.5, borderColor: colors.primary },
  monthTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  monthCount: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  stats: { flexDirection: 'row' },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { borderLeftWidth: 1, borderLeftColor: colors.divider },
  statValue: { fontSize: 17, fontWeight: '800' },
  statLabel: { fontSize: 11, color: colors.textMuted },
});
