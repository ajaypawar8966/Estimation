import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Building2, LogOut, LucideIcon, Map, MapPin, Pencil } from 'lucide-react-native';
import { Avatar, pickProfilePhoto } from '../components/Avatar';
import { Button, Card, formatDate, Screen } from '../components/ui';
import { RootStackParamList, TabParamList } from '../navigation/types';
import { useAuth } from '../store/AuthStore';
import { colors, radius } from '../theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Profile'>,
  NativeStackScreenProps<RootStackParamList>
>;

function DetailRow({
  icon: Icon,
  tint,
  background,
  label,
  value,
}: {
  icon: LucideIcon;
  tint: string;
  background: string;
  label: string;
  value?: string | null;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={[styles.detailIcon, { backgroundColor: background }]}>
        <Icon size={18} color={tint} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={[styles.detailValue, !value && styles.notSet]} numberOfLines={2}>
          {value || 'Not set'}
        </Text>
      </View>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export default function ProfileScreen({ navigation }: Props) {
  const { user, local, logout, saveLocal } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  if (!user) {
    return null;
  }

  const location = local.location;
  const editProfile = () => navigation.navigate('EditProfile');

  const confirmLogout = () =>
    Alert.alert('Log out?', 'You will need to sign in again to use the app.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          await logout();
          navigation.navigate('Home');
        },
      },
    ]);

  return (
    <Screen title="Profile" centered onBack={() => navigation.navigate('Home')}>
      <Card style={styles.profileCard}>
        <Pressable
          onPress={editProfile}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Edit profile"
          style={styles.editIcon}>
          <Pencil size={16} color={colors.primary} />
        </Pressable>

        <Avatar
          uri={local.photoUri}
          onCameraPress={() =>
            pickProfilePhoto(!!local.photoUri, photoUri => saveLocal({ ...local, photoUri }))
          }
        />
        <Text style={styles.name}>{user.name}</Text>
        <Text style={[styles.designation, !user.designation && styles.notSet]}>
          {user.designation || 'Add your post'}
        </Text>

        <View style={styles.divider} />

        <View style={styles.details}>
          <DetailRow
            icon={Building2}
            tint="#2563EB"
            background="#EFF6FF"
            label="Organization"
            value={user.organization}
          />
          <DetailRow
            icon={MapPin}
            tint="#16A34A"
            background="#F0FDF4"
            label="Janpad Panchayat"
            value={location?.janpad}
          />
          <DetailRow
            icon={Map}
            tint="#9333EA"
            background="#FAF5FF"
            label="District"
            value={location?.district}
          />
        </View>
      </Card>

      <Button label="Edit Profile" variant="gradient" icon={Pencil} onPress={editProfile} />
      <Button
        label="Logout"
        variant="outline-danger"
        icon={LogOut}
        loading={loggingOut}
        onPress={confirmLogout}
      />

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Account Information</Text>
        <InfoRow label="Email" value={user.email} />
        <InfoRow label="Phone" value={user.phone || 'Not set'} />
        {location?.panchayat ? <InfoRow label="Panchayat" value={location.panchayat} /> : null}
        {location?.village ? <InfoRow label="Village" value={location.village} /> : null}
        <InfoRow label="Joined Date" value={formatDate(Date.parse(user.created_at))} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  profileCard: { alignItems: 'center', paddingTop: 24 },
  editIcon: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 14 },
  designation: { fontSize: 14, fontWeight: '600', color: colors.primary, marginTop: 4 },
  notSet: { color: colors.textFaint, fontStyle: 'italic' },
  divider: {
    alignSelf: 'stretch',
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 16,
  },
  details: { alignSelf: 'stretch', gap: 14 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  detailIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: { fontSize: 12, color: colors.textMuted },
  detailValue: { fontSize: 15, fontWeight: '600', color: colors.text, marginTop: 1 },
  infoCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: radius.lg,
    padding: 16,
    gap: 10,
  },
  infoTitle: { fontSize: 15, fontWeight: '800', color: '#1E3A8A', marginBottom: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  infoLabel: { fontSize: 13, color: '#2563EB' },
  infoValue: { flexShrink: 1, fontSize: 13, fontWeight: '700', color: '#1E293B' },
});
