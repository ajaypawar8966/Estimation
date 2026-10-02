import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Bell, CheckCheck, X } from 'lucide-react-native';
import { Card, EmptyState, formatDate, Screen } from '../components/ui';
import { useStore } from '../store/AppStore';
import { colors } from '../theme';

export default function AlertsScreen() {
  const { alerts, unreadCount, readAlert, readAllAlerts, deleteAlert } = useStore();

  return (
    <Screen
      title="Alerts"
      right={
        unreadCount > 0 ? (
          <Pressable
            onPress={readAllAlerts}
            accessibilityRole="button"
            accessibilityLabel="Mark all as read"
            style={styles.markAll}>
            <CheckCheck size={16} color={colors.primary} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        ) : null
      }>
      {alerts.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="You're all caught up"
          body="Activity such as saved estimates will show up here."
        />
      ) : (
        alerts.map(a => (
          <Pressable key={a.id} onPress={() => readAlert(a.id)} accessibilityRole="button">
            <Card style={styles.item}>
              <View style={[styles.dot, a.read && styles.dotRead]} />
              <View style={styles.flex}>
                <Text style={[styles.title, a.read && styles.titleRead]}>{a.title}</Text>
                <Text style={styles.body}>{a.body}</Text>
                <Text style={styles.date}>{formatDate(a.createdAt)}</Text>
              </View>
              <Pressable
                onPress={() => deleteAlert(a.id)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Dismiss alert">
                <X size={18} color={colors.textFaint} />
              </Pressable>
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  markAll: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  markAllText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.danger, marginTop: 6 },
  dotRead: { backgroundColor: colors.border },
  title: { fontSize: 15, fontWeight: '800', color: colors.text },
  titleRead: { fontWeight: '600' },
  body: { fontSize: 13, color: colors.textMuted, marginTop: 4, lineHeight: 19 },
  date: { fontSize: 11, color: colors.textFaint, marginTop: 8 },
});
