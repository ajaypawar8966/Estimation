import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Boxes,
  Droplet,
  Grid3x3,
  Hammer,
  Layers,
  LayoutGrid,
  LucideIcon,
  Mountain,
  PaintBucket,
  Square,
  Wrench,
} from 'lucide-react-native';
import { Card, IconTile, Screen, SectionTitle } from '../components/ui';
import { HomeStackParamList } from '../navigation/types';
import { CalcId } from '../types';
import { CALCULATORS } from '../calculators';
import { colors } from '../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'MaterialCalculator'>;

type Tile = {
  key: CalcId | 'quick';
  title: string;
  subtitle: string;
  icon: LucideIcon;
  color: string;
  background: string;
};

const TILES: Tile[] = [
  { key: 'quick', title: 'Calculator', subtitle: 'Quick calculations', icon: Grid3x3, color: '#F97316', background: '#FFF3E8' },
  { key: 'brick', title: 'Brick', subtitle: CALCULATORS.brick.subtitle, icon: Boxes, color: '#EF4444', background: '#FEF2F2' },
  { key: 'plaster', title: 'Plaster', subtitle: CALCULATORS.plaster.subtitle, icon: PaintBucket, color: '#3B82F6', background: '#EFF6FF' },
  { key: 'concrete', title: 'Concrete', subtitle: CALCULATORS.concrete.subtitle, icon: Square, color: '#475569', background: '#F8FAFC' },
  { key: 'steel', title: 'Steel', subtitle: CALCULATORS.steel.subtitle, icon: Wrench, color: '#475569', background: '#F8FAFC' },
  { key: 'flooring', title: 'Flooring', subtitle: CALCULATORS.flooring.subtitle, icon: LayoutGrid, color: '#F59E0B', background: '#FEF9E1' },
  { key: 'paint', title: 'Paint', subtitle: CALCULATORS.paint.subtitle, icon: Droplet, color: '#A855F7', background: '#FAF5FF' },
  { key: 'shuttering', title: 'Shuttering', subtitle: CALCULATORS.shuttering.subtitle, icon: Layers, color: '#F97316', background: '#FFF3E8' },
  { key: 'dam', title: 'Dam', subtitle: CALCULATORS.dam.subtitle, icon: Mountain, color: '#06B6D4', background: '#ECFEFF' },
  { key: 'stair', title: 'Stair', subtitle: CALCULATORS.stair.subtitle, icon: Hammer, color: '#22C55E', background: '#F0FDF4' },
];

export default function MaterialCalculatorScreen({ navigation }: Props) {
  return (
    <Screen title="Material Calculator" onBack={navigation.goBack}>
      <SectionTitle
        title="Select Material Type"
        subtitle="Choose a material to calculate quantity"
      />
      <View style={styles.grid}>
        {TILES.map(t => (
          <Pressable
            key={t.key}
            accessibilityRole="button"
            accessibilityLabel={`${t.title}. ${t.subtitle}`}
            style={styles.item}
            onPress={() =>
              t.key === 'quick'
                ? navigation.navigate('QuickCalculator')
                : navigation.navigate('Calculator', { id: t.key })
            }>
            <Card style={styles.card}>
              <IconTile icon={t.icon} color={t.color} background={t.background} />
              <View>
                <Text style={styles.title}>{t.title}</Text>
                <Text style={styles.subtitle}>{t.subtitle}</Text>
              </View>
            </Card>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  item: { width: '47.5%', flexGrow: 1 },
  card: { minHeight: 132, justifyContent: 'space-between', gap: 20 },
  title: { fontSize: 15, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 11.5, color: colors.textMuted, marginTop: 3 },
});
