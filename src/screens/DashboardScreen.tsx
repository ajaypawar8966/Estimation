import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  BookOpen,
  Calculator,
  Camera,
  ChartColumn,
  ClipboardList,
  LucideIcon,
  MessageCircle,
  Pencil,
} from 'lucide-react-native';
import { Card, GradientTile, Header } from '../components/ui';
import { useRequireAuth } from '../navigation/requireAuth';
import { HomeStackParamList } from '../navigation/types';
import { useAuth } from '../store/AuthStore';
import { colors, radius, shadow } from '../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'Dashboard'>;

type QuickAction = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  gradient: [string, string];
  go: (nav: Props['navigation']) => void;
};

const ACTIONS: QuickAction[] = [
  {
    title: 'Estimation',
    subtitle: 'View estimates',
    icon: ClipboardList,
    gradient: ['#2563EB', '#3B82F6'],
    go: nav => nav.getParent()?.navigate('Estimation' as never),
  },
  {
    title: 'Tour Diary',
    subtitle: 'Field visits',
    icon: BookOpen,
    gradient: ['#9333EA', '#A855F7'],
    go: nav => nav.navigate('TourDiary'),
  },
  {
    title: 'Site Photos',
    subtitle: 'Document sites',
    icon: Camera,
    gradient: ['#0891B2', '#06B6D4'],
    go: nav => nav.navigate('SitePhotos'),
  },
  {
    title: 'Reports',
    subtitle: 'Manage reports',
    icon: ChartColumn,
    gradient: ['#16A34A', '#22C55E'],
    go: nav => nav.navigate('Reports'),
  },
  {
    title: 'Calculator',
    subtitle: 'Quick calc',
    icon: Calculator,
    gradient: ['#4F46E5', '#6366F1'],
    go: nav => nav.navigate('QuickCalculator'),
  },
  {
    title: 'Community',
    subtitle: 'Team chat',
    icon: MessageCircle,
    gradient: ['#059669', '#10B981'],
    go: nav => nav.navigate('Community'),
  },
];

export default function DashboardScreen({ navigation }: Props) {
  const { user } = useAuth();
  const requireAuth = useRequireAuth();
  const firstName = user?.name.trim().split(/\s+/)[0];
  return (
    <View style={styles.screen}>
      <Header title="Dashboard" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#FF7A00', '#F0490A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.welcome}>
          <Text style={styles.welcomeTitle}>
            {firstName ? `Welcome back, ${firstName}` : 'Welcome'}
          </Text>
          <Text style={styles.welcomeSub}>Quickly estimate construction materials</Text>
        </LinearGradient>

        <Pressable
          accessibilityRole="button"
          onPress={() => requireAuth(() => navigation.navigate('DesignStudio'))}>
          <LinearGradient
            colors={['#3B82F6', '#1D5BFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.studio}>
            <View style={styles.studioIcon}>
              <Pencil size={24} color="#fff" />
            </View>
            <View style={styles.flex}>
              <Text style={styles.studioTitle}>Design Studio</Text>
              <Text style={styles.studioSub}>Create 2D/3D civil designs</Text>
            </View>
          </LinearGradient>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => requireAuth(() => navigation.navigate('MaterialCalculator'))}>
          <Card style={styles.calcCard}>
            <View style={styles.calcIcon}>
              <Calculator size={26} color="#fff" />
            </View>
            <View style={styles.flex}>
              <Text style={styles.calcTitle}>Material Calculator</Text>
              <Text style={styles.calcSub}>Calculate required materials</Text>
            </View>
          </Card>
        </Pressable>

        <Text style={styles.quick}>Quick Actions</Text>
        <View style={styles.grid}>
          {ACTIONS.map(a => (
            <Pressable
              key={a.title}
              accessibilityRole="button"
              onPress={() => requireAuth(() => a.go(navigation))}
              style={styles.gridItem}>
              <Card style={styles.actionCard}>
                <GradientTile icon={a.icon} colors={a.gradient} size={48} />
                <View>
                  <Text style={styles.actionTitle}>{a.title}</Text>
                  <Text style={styles.actionSub}>{a.subtitle}</Text>
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 28, gap: 14 },
  welcome: { borderRadius: radius.lg, padding: 22, gap: 8, ...shadow },
  welcomeTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  welcomeSub: { fontSize: 14, color: 'rgba(255,255,255,0.92)', lineHeight: 20 },
  studio: {
    borderRadius: radius.lg,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    ...shadow,
  },
  studioIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studioTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  studioSub: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 3 },
  calcCard: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18 },
  calcIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calcTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  calcSub: { fontSize: 13, color: colors.textMuted, marginTop: 3 },
  quick: { fontSize: 15, fontWeight: '800', color: colors.text, marginTop: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  gridItem: { width: '47.5%', flexGrow: 1 },
  actionCard: { gap: 22, minHeight: 128, justifyContent: 'space-between' },
  actionTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  actionSub: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
});
