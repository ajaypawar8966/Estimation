import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ChevronDown,
  ChevronRight,
  Copy,
  FolderOpen,
  IndianRupee,
  LucideIcon,
  Plus,
} from 'lucide-react-native';
import { api } from '../../api/client';
import { useApi } from '../../api/useApi';
import { Card, IconTile, Screen } from '../../components/ui';
import { EstimationStackParamList } from '../../navigation/types';
import { colors } from '../../theme';

type Props = NativeStackScreenProps<EstimationStackParamList, 'EstimationHome'>;

function MenuRow({
  icon,
  tint,
  background,
  label,
  subtitle,
  onPress,
  open,
}: {
  icon: LucideIcon;
  tint: string;
  background: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
  /** Set for the expandable Template row. */
  open?: boolean;
}) {
  const Chevron = open ? ChevronDown : ChevronRight;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={open === undefined ? undefined : { expanded: open }}
      style={styles.menuRow}>
      <IconTile icon={icon} color={tint} background={background} size={44} iconSize={22} />
      <View style={styles.flex}>
        <Text style={styles.menuLabel}>{label}</Text>
        {subtitle ? <Text style={styles.menuSub}>{subtitle}</Text> : null}
      </View>
      <Chevron size={20} color={open ? colors.primary : colors.textFaint} />
    </Pressable>
  );
}

export default function EstimationHomeScreen({ navigation }: Props) {
  const [templatesOpen, setTemplatesOpen] = useState(false);
  // Only fetched once the Template list is opened.
  const workTypes = useApi(templatesOpen ? t => api.workTypes(t) : null, [templatesOpen]);

  return (
    <Screen title="Estimation">
      <Card style={styles.menuCard}>
        <MenuRow
          icon={IndianRupee}
          tint={colors.primary}
          background="#FFF3E8"
          label="Valuation"
          onPress={() => navigation.navigate('Valuation')}
        />
      </Card>
      <Card style={styles.menuCard}>
        <MenuRow
          icon={Plus}
          tint="#2563EB"
          background="#EFF6FF"
          label="Create New"
          onPress={() => navigation.navigate('CreateWork')}
        />
      </Card>
      <Card style={styles.menuCard}>
        <MenuRow
          icon={Copy}
          tint="#16A34A"
          background="#F0FDF4"
          label="Template"
          open={templatesOpen}
          onPress={() => setTemplatesOpen(o => !o)}
        />
        {templatesOpen && (
          <View style={styles.templateList}>
            {workTypes.loading && !workTypes.data ? (
              <ActivityIndicator color={colors.primary} style={styles.loader} />
            ) : workTypes.error ? (
              <Pressable onPress={workTypes.reload} accessibilityRole="button" style={styles.templateRow}>
                <Text style={styles.errorText}>{workTypes.error} Tap to retry.</Text>
              </Pressable>
            ) : (
              workTypes.data?.map(t => (
                <Pressable
                  key={t.key}
                  onPress={() => navigation.navigate('CreateWork', { workType: t.key })}
                  accessibilityRole="button"
                  accessibilityHint={t.description}
                  style={styles.templateRow}>
                  <View style={styles.dot} />
                  <Text style={styles.templateLabel}>{t.title}</Text>
                  <ChevronRight size={18} color={colors.textFaint} />
                </Pressable>
              ))
            )}
          </View>
        )}
      </Card>
      <Card style={styles.menuCard}>
        <MenuRow
          icon={FolderOpen}
          tint="#9333EA"
          background="#FAF5FF"
          label="Projects"
          subtitle="Works you have created"
          onPress={() => navigation.navigate('Projects')}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  menuCard: { padding: 0, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  menuLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  menuSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  templateList: {
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingVertical: 4,
    backgroundColor: '#FCFCFD',
  },
  templateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingLeft: 40,
    paddingRight: 16,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textFaint },
  templateLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  loader: { paddingVertical: 20 },
  errorText: { flex: 1, fontSize: 13, color: colors.danger },
});
