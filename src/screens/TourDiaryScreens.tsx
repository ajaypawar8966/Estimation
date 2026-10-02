import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Calendar,
  FileText,
  LucideIcon,
  MapPin,
  Search,
  Trash2,
} from 'lucide-react-native';
import {
  Button,
  Card,
  EmptyState,
  Screen,
  SelectField,
  TextField,
} from '../components/ui';
import { HomeStackParamList } from '../navigation/types';
import { useAuth } from '../store/AuthStore';
import { useStore } from '../store/AppStore';
import { colors, radius } from '../theme';
import { DiaryEntry } from '../types';
import {
  dayKey,
  entriesLabel,
  formatDay,
  monthKey,
  monthLabel,
} from '../utils/month';
import { StatsFooter } from './TourDiaryScreen';

const blue = '#2563EB';

const WORK_TYPES = [
  'Inspection',
  'Measurement',
  'Survey',
  'Supervision',
  'Meeting',
];

/** Entries of one month, oldest first, as a diary reads. */
function useMonthEntries(month: string) {
  const { diary } = useStore();
  return useMemo(
    () =>
      diary
        .filter(d => monthKey(d.createdAt) === month)
        .sort((a, b) => a.createdAt - b.createdAt),
    [diary, month],
  );
}

const distinctSites = (entries: DiaryEntry[]) => [
  ...new Set(entries.map(e => e.site.trim()).filter(Boolean)),
];

/* ---------- Month ---------- */

export function TourDiaryMonthScreen({
  navigation,
  route,
}: NativeStackScreenProps<HomeStackParamList, 'TourDiaryMonth'>) {
  const { month } = route.params;
  const { deleteDiary } = useStore();
  const entries = useMonthEntries(month);
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const shown = q
    ? entries.filter(e =>
        [e.title, e.site, e.notes, e.workType ?? ''].some(f =>
          f.toLowerCase().includes(q),
        ),
      )
    : entries;

  const confirmDelete = (e: DiaryEntry) =>
    Alert.alert('Delete entry?', `"${e.title}" will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteDiary(e.id),
      },
    ]);

  return (
    <Screen
      title={monthLabel(month)}
      subtitle={entriesLabel(entries.length)}
      centered
      onBack={navigation.goBack}
      right={
        <Pressable
          onPress={() => navigation.navigate('TourDiaryReport', { month })}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Monthly report"
          style={styles.headerIcon}
        >
          <FileText size={22} color={colors.primary} />
        </Pressable>
      }
      headerBelow={
        <View style={styles.search}>
          <Search size={18} color={colors.textFaint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search entries..."
            placeholderTextColor={colors.textFaint}
            style={styles.searchInput}
            returnKeyType="search"
          />
        </View>
      }
      footer={
        <StatsFooter
          stats={[
            {
              label: 'Total Visits',
              value: entries.length,
              color: colors.primary,
            },
            {
              label: 'Locations',
              value: distinctSites(entries).length,
              color: blue,
            },
          ]}
        />
      }
    >
      {shown.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={entries.length ? 'No Matches' : 'No Entries Yet'}
          body={
            entries.length
              ? 'No entries match your search.'
              : 'Add your first field visit entry for this month.'
          }
        />
      ) : (
        shown.map(e => (
          <Card key={e.id}>
            <View style={styles.entryRow}>
              <View style={styles.flex}>
                <Text style={styles.entryDate}>{formatDay(e.createdAt)}</Text>
                <Text style={styles.entryTitle}>{e.title}</Text>
                <View style={styles.meta}>
                  {e.site ? (
                    <>
                      <MapPin size={12} color={colors.textMuted} />
                      <Text style={styles.metaText}>{e.site}</Text>
                    </>
                  ) : null}
                  {e.workType ? (
                    <Text style={styles.badge}>{e.workType}</Text>
                  ) : null}
                </View>
              </View>
              <Pressable
                onPress={() => confirmDelete(e)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Delete entry"
              >
                <Trash2 size={18} color={colors.textFaint} />
              </Pressable>
            </View>
            {e.notes ? <Text style={styles.notes}>{e.notes}</Text> : null}
          </Card>
        ))
      )}
    </Screen>
  );
}

/* ---------- Monthly report ---------- */

function ReportHeading({ title }: { title: string }) {
  return <Text style={styles.reportHeading}>{title}</Text>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function SummaryTile({
  icon: Icon,
  value,
  label,
  color,
  background,
  border,
}: {
  icon: LucideIcon;
  value: number;
  label: string;
  color: string;
  background: string;
  border: string;
}) {
  return (
    <View
      style={[
        styles.tile,
        { backgroundColor: background, borderColor: border },
      ]}
    >
      <View style={[styles.tileIcon, { backgroundColor: color }]}>
        <Icon size={20} color="#fff" />
      </View>
      <Text style={[styles.tileValue, { color }]}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

export function TourDiaryReportScreen({
  navigation,
  route,
}: NativeStackScreenProps<HomeStackParamList, 'TourDiaryReport'>) {
  const { month } = route.params;
  const { user } = useAuth();
  const entries = useMonthEntries(month);
  const today = formatDay(Date.now());
  const designation = user?.designation || '—';

  const sites = distinctSites(entries);
  const workingDays = new Set(entries.map(e => dayKey(e.createdAt))).size;
  const workTypes = useMemo(() => {
    const counts = new Map<string, number>();
    entries.forEach(e => {
      const t = e.workType?.trim() || 'Other';
      counts.set(t, (counts.get(t) ?? 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [entries]);

  return (
    <Screen title="Monthly Report" onBack={navigation.goBack}>
      <Card style={styles.reportCard}>
        <Text style={styles.reportKicker}>TOUR DIARY REPORT</Text>
        <Text style={styles.reportMonth}>{monthLabel(month)}</Text>
        <View style={styles.rule} />
        <InfoRow label="Generated On:" value={today} />
        <InfoRow label="Officer:" value={user?.name || '—'} />
        <InfoRow label="Designation:" value={designation} />
      </Card>

      <ReportHeading title="Summary" />
      <View style={styles.tiles}>
        <SummaryTile
          icon={Calendar}
          value={workingDays}
          label="Working Days"
          color={colors.primary}
          background="#FFF4EA"
          border="#FED7AA"
        />
        <SummaryTile
          icon={MapPin}
          value={sites.length}
          label="Locations"
          color={blue}
          background="#EAF2FF"
          border="#BFDBFE"
        />
      </View>

      <ReportHeading title="Work Type Summary" />
      {workTypes.map(([type, count]) => (
        <View key={type} style={styles.listRow}>
          <Text style={styles.listText}>{type}</Text>
          <Text style={styles.listCount}>{count}</Text>
        </View>
      ))}

      <ReportHeading title="Locations Visited" />
      <View style={styles.chipBox}>
        {sites.map(s => (
          <Text key={s} style={styles.siteChip}>
            {s}
          </Text>
        ))}
      </View>

      <ReportHeading title="Daily Entries" />
      {entries.map(e => (
        <View key={e.id} style={styles.dailyRow}>
          <Text style={styles.dailyDate}>{formatDay(e.createdAt)}</Text>
          <View style={styles.flex}>
            <Text style={styles.listText}>{e.title}</Text>
            {e.site || e.workType ? (
              <Text style={styles.metaText}>
                {[e.site, e.workType].filter(Boolean).join(' · ')}
              </Text>
            ) : null}
          </View>
        </View>
      ))}

      <View style={styles.reportFooter}>
        <View>
          <Text style={styles.footerText}>Report ID: TD-{month}</Text>
          <Text style={styles.footerText}>Generated: {today}</Text>
        </View>
        <View style={styles.signature}>
          <Text style={styles.signatureTitle}>Officer's Signature</Text>
          <Text style={styles.signatureSub}>{designation}</Text>
        </View>
      </View>
    </Screen>
  );
}

/* ---------- New entry ---------- */

export function TourDiaryEntryScreen({
  navigation,
}: NativeStackScreenProps<HomeStackParamList, 'TourDiaryEntry'>) {
  const { addDiary } = useStore();
  const [title, setTitle] = useState('');
  const [site, setSite] = useState('');
  const [workType, setWorkType] = useState('');
  const [notes, setNotes] = useState('');

  const save = () => {
    addDiary({
      title: title.trim(),
      site: site.trim(),
      notes: notes.trim(),
      workType: workType || undefined,
    });
    navigation.goBack();
  };

  return (
    <Screen
      title="New Entry"
      subtitle={formatDay(Date.now())}
      onBack={navigation.goBack}
      footer={
        <Button label="Save Entry" disabled={!title.trim()} onPress={save} />
      }
    >
      <Card>
        <TextField
          label="Title"
          required
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Foundation inspection"
        />
        <TextField
          label="Site / location"
          value={site}
          onChangeText={setSite}
          placeholder="e.g. Plot 14, Pune"
        />
        <SelectField
          label="Work type"
          placeholder="Select work type"
          options={WORK_TYPES}
          value={workType}
          onChange={setWorkType}
          allowAdd
        />
        <TextField
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          multiline
          placeholder="What did you observe?"
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerIcon: { width: 36, alignItems: 'center' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 46,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#F8FAFC',
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.text, padding: 0 },
  entryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  entryDate: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 2,
  },
  entryTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  metaText: { fontSize: 12, color: colors.textMuted },
  badge: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primaryDark,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    marginLeft: 4,
    overflow: 'hidden',
  },
  notes: { fontSize: 13, color: colors.text, lineHeight: 19, marginTop: 10 },
  reportCard: { borderWidth: 1, borderColor: colors.border, gap: 8 },
  reportKicker: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.textMuted,
    textAlign: 'center',
  },
  reportMonth: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  rule: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  infoRow: { flexDirection: 'row' },
  infoLabel: {
    width: 110,
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  infoValue: { flex: 1, fontSize: 12, color: colors.text },
  reportHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    paddingBottom: 8,
    marginTop: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tiles: { flexDirection: 'row', gap: 12 },
  tile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 4,
  },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  tileValue: { fontSize: 20, fontWeight: '800' },
  tileLabel: { fontSize: 12, color: colors.text },
  listRow: { flexDirection: 'row', justifyContent: 'space-between' },
  listText: { fontSize: 13, color: colors.text, fontWeight: '600' },
  listCount: { fontSize: 13, fontWeight: '800', color: colors.primary },
  chipBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    minHeight: 40,
    padding: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#F8FAFC',
  },
  siteChip: {
    fontSize: 12,
    color: blue,
    backgroundColor: '#EAF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  dailyRow: { flexDirection: 'row', gap: 12 },
  dailyDate: { width: 80, fontSize: 12, color: colors.textMuted },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 12,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: { fontSize: 11, color: colors.textMuted, lineHeight: 18 },
  signature: {
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.textMuted,
    paddingTop: 4,
    paddingLeft: 24,
  },
  signatureTitle: { fontSize: 12, fontWeight: '700', color: colors.text },
  signatureSub: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
});
