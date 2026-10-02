import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Calendar,
  ChevronRight,
  Filter,
  FolderOpen,
  LucideIcon,
  Search,
  Tag,
} from 'lucide-react-native';
import {
  Card,
  EmptyState,
  formatDate,
  IconTile,
  Screen,
  SelectField,
} from '../components/ui';
import { CALCULATORS, formatNumber } from '../calculators';
import { HomeStackParamList } from '../navigation/types';
import { useStore } from '../store/AppStore';
import { colors, radius } from '../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'Reports'>;

type SortBy = 'date' | 'name';

const ALL = 'All Categories';

function SortButton({
  icon: Icon,
  label,
  active,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const fg = active ? '#fff' : colors.text;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.sortBtn, active && styles.sortBtnActive]}
    >
      <Icon size={14} color={fg} />
      <Text style={[styles.sortText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export default function ReportsScreen({ navigation }: Props) {
  const { estimates } = useStore();
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [category, setCategory] = useState(ALL);
  const [sortBy, setSortBy] = useState<SortBy>('date');

  // Only offer categories that have at least one saved estimate.
  const categories = useMemo(
    () => [ALL, ...new Set(estimates.map(e => CALCULATORS[e.calcId].title))],
    [estimates],
  );

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return estimates
      .filter(e => category === ALL || CALCULATORS[e.calcId].title === category)
      .filter(
        e =>
          !q ||
          e.name.toLowerCase().includes(q) ||
          CALCULATORS[e.calcId].title.toLowerCase().includes(q),
      )
      .sort((a, b) =>
        sortBy === 'name'
          ? a.name.localeCompare(b.name)
          : b.createdAt - a.createdAt,
      );
  }, [estimates, query, category, sortBy]);

  const filtered = category !== ALL || sortBy !== 'date';
  // Saved estimates live in the Estimation tab's stack.
  const openEstimate = (id: string) =>
    navigation.getParent()?.navigate('Estimation', {
      screen: 'EstimationDetail',
      params: { id },
      initial: false,
    });

  return (
    <Screen
      title="Reports"
      centered
      onBack={navigation.goBack}
      right={
        <Pressable
          onPress={() => setShowFilters(v => !v)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Filters"
          accessibilityState={{ expanded: showFilters }}
          style={styles.headerIcon}
        >
          <Filter
            size={20}
            color={showFilters || filtered ? colors.primary : colors.text}
          />
        </Pressable>
      }
      headerBelow={
        <>
          <View style={styles.search}>
            <Search size={18} color={colors.textFaint} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search villages or reports..."
              placeholderTextColor={colors.textFaint}
              style={styles.searchInput}
              returnKeyType="search"
            />
          </View>
          {showFilters && (
            <View style={styles.filters}>
              <SelectField
                label="Category"
                placeholder={ALL}
                options={categories}
                value={category}
                onChange={setCategory}
              />
              <Text style={styles.filterLabel}>Sort By</Text>
              <View style={styles.sortRow}>
                <SortButton
                  icon={Calendar}
                  label="Date"
                  active={sortBy === 'date'}
                  onPress={() => setSortBy('date')}
                />
                <SortButton
                  icon={Tag}
                  label="Name"
                  active={sortBy === 'name'}
                  onPress={() => setSortBy('name')}
                />
              </View>
            </View>
          )}
        </>
      }
    >
      {shown.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={estimates.length ? 'No Matching Reports' : 'No Reports Yet'}
          body={
            estimates.length
              ? 'Try a different search or category.'
              : 'Save an estimate from the Material Calculator to see it here.'
          }
        />
      ) : (
        shown.map(e => {
          const def = CALCULATORS[e.calcId];
          const main = e.results.find(r => r.primary) ?? e.results[0];
          return (
            <Pressable
              key={e.id}
              onPress={() => openEstimate(e.id)}
              accessibilityRole="button"
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Card style={styles.row}>
                <IconTile
                  icon={FolderOpen}
                  color={colors.primary}
                  background={colors.primarySoft}
                  size={44}
                  iconSize={20}
                />
                <View style={styles.flex}>
                  <Text style={styles.name} numberOfLines={1}>
                    {e.name}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {def.title} · {formatDate(e.createdAt)}
                  </Text>
                  {main ? (
                    <Text style={styles.result} numberOfLines={1}>
                      {main.label}: {formatNumber(main.value, main.decimals)}{' '}
                      {main.unit ?? ''}
                    </Text>
                  ) : null}
                </View>
                <ChevronRight size={18} color={colors.textMuted} />
              </Card>
            </Pressable>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.85 },
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
  filters: {
    padding: 14,
    paddingBottom: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FED7AA',
    backgroundColor: '#FFF7ED',
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  sortRow: { flexDirection: 'row', gap: 10 },
  sortBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  sortBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sortText: { fontSize: 13, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  name: { fontSize: 15, fontWeight: '800', color: colors.text },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  result: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryDark,
    marginTop: 4,
  },
});
