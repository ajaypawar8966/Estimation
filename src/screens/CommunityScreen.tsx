import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  LucideIcon,
  MessageCircle,
  Plus,
  Search,
  Users,
} from 'lucide-react-native';
import { Card, IconTile, Screen, SectionTitle } from '../components/ui';
import { HomeStackParamList } from '../navigation/types';
import { colors, radius } from '../theme';

const green = colors.success;

// Team chat needs a server to sync groups and messages between users, which
// isn't connected yet, so the actions explain that instead of doing nothing.
const notConnected = () =>
  Alert.alert(
    'Coming soon',
    "Team chat needs a server to sync messages between users, which isn't connected yet.",
  );

function EmptyCard({
  icon,
  color,
  background,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  color: string;
  background: string;
  title: string;
  body: string;
  action?: { label: string; onPress: () => void };
}) {
  return (
    <Card style={styles.emptyCard}>
      <IconTile
        icon={icon}
        color={color}
        background={background}
        size={52}
        iconSize={24}
      />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
      {action && (
        <Pressable
          onPress={action.onPress}
          accessibilityRole="button"
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Text style={styles.actionLabel}>{action.label}</Text>
        </Pressable>
      )}
    </Card>
  );
}

export default function CommunityScreen({
  navigation,
}: NativeStackScreenProps<HomeStackParamList, 'Community'>) {
  return (
    <Screen
      title="Community"
      onBack={navigation.goBack}
      centered
      right={
        <View style={styles.headerActions}>
          <Pressable
            onPress={notConnected}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Search chats"
          >
            <Search size={20} color={colors.textMuted} />
          </Pressable>
          <Pressable
            onPress={notConnected}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="New group"
          >
            <Plus size={22} color={green} />
          </Pressable>
        </View>
      }
    >
      <SectionTitle title="My Groups" />
      <EmptyCard
        icon={Users}
        color={green}
        background="#DCFCE7"
        title="No Groups Yet"
        body="Create groups to collaborate with your team"
        action={{ label: 'Create Group', onPress: notConnected }}
      />

      <SectionTitle title="Recent Chats" />
      <EmptyCard
        icon={MessageCircle}
        color="#2563EB"
        background="#DBEAFE"
        title="No Messages Yet"
        body="Start a conversation with your team"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  emptyCard: { alignItems: 'center', paddingVertical: 24, gap: 6 },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginTop: 8,
  },
  emptyBody: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 17,
  },
  action: {
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: radius.sm,
    backgroundColor: green,
  },
  actionLabel: { fontSize: 13, fontWeight: '700', color: '#fff' },
  pressed: { opacity: 0.85 },
});
