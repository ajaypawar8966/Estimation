import React, { useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Save } from 'lucide-react-native';
import { ProfileUpdate } from '../api/client';
import { Avatar, pickProfilePhoto } from '../components/Avatar';
import { Button, Card, SelectField, Screen, TextField } from '../components/ui';
import { DISTRICTS } from '../data/locations';
import { RootStackParamList } from '../navigation/types';
import { Location, useAuth } from '../store/AuthStore';
import { colors, radius } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

const EMPTY_LOCATION: Location = { district: '', janpad: '', panchayat: '', village: '' };

export default function EditProfileScreen({ navigation }: Props) {
  const { user, local, updateProfile } = useAuth();
  const initial = useRef({
    name: user?.name ?? '',
    designation: user?.designation ?? '',
    phone: user?.phone ?? '',
    organization: user?.organization ?? '',
    photoUri: local.photoUri,
    location: local.location ?? EMPTY_LOCATION,
  }).current;
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const saved = useRef(false);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm(f => ({ ...f, [key]: value }));
  // Changing a level clears everything below it, since it may no longer apply.
  const setLocation = (level: keyof Location, value: string) =>
    setForm(f => {
      const loc = { ...f.location, [level]: value };
      const order: (keyof Location)[] = ['district', 'janpad', 'panchayat', 'village'];
      if (f.location[level] !== value) {
        order.slice(order.indexOf(level) + 1).forEach(k => (loc[k] = ''));
      }
      return { ...f, location: loc };
    });

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  useEffect(
    () =>
      navigation.addListener('beforeRemove', e => {
        if (!dirty || saved.current) {
          return;
        }
        e.preventDefault();
        Alert.alert('Discard changes?', 'Your unsaved changes will be lost.', [
          { text: 'Keep editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]);
      }),
    [navigation, dirty],
  );

  const save = async () => {
    const { location } = form;
    const missing = [
      !form.name.trim() && 'Name',
      !form.designation.trim() && 'Post',
      !location.district && 'District',
      !location.janpad && 'Janpad Panchayat',
      !location.panchayat && 'Panchayat',
      !location.village && 'Village',
    ].filter(Boolean);
    if (missing.length) {
      Alert.alert('Required fields missing', `Please fill in: ${missing.join(', ')}.`);
      return;
    }

    // Only send the server fields that actually changed.
    const changes: ProfileUpdate = {};
    const name = form.name.trim();
    const designation = form.designation.trim();
    const phone = form.phone.trim() || null;
    const organization = form.organization.trim() || null;
    if (name !== user?.name) {
      changes.name = name;
    }
    if (designation !== (user?.designation ?? '')) {
      changes.designation = designation;
    }
    if (phone !== (user?.phone || null)) {
      changes.phone = phone;
    }
    if (organization !== (user?.organization || null)) {
      changes.organization = organization;
    }

    Keyboard.dismiss();
    setSaving(true);
    try {
      await updateProfile(changes, { photoUri: form.photoUri, location });
      saved.current = true;
      navigation.goBack();
    } catch (e) {
      setSaving(false);
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Please try again.');
    }
  };

  const { location } = form;
  const janpads = DISTRICTS[location.district] ?? [];

  return (
    <Screen
      title="Edit Profile"
      onBack={() => navigation.goBack()}
      footer={
        <Button
          label="Save Changes"
          variant="gradient"
          icon={Save}
          loading={saving}
          disabled={!dirty}
          onPress={save}
        />
      }>
      <Card style={styles.photoCard}>
        <Text style={styles.photoLabel}>Profile Photo</Text>
        <Avatar
          uri={form.photoUri}
          size={80}
          onCameraPress={() =>
            pickProfilePhoto(!!form.photoUri, photoUri => set('photoUri', photoUri))
          }
        />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Personal Details</Text>
        <TextField
          label="Name"
          required
          value={form.name}
          onChangeText={v => set('name', v)}
          placeholder="Your full name"
          autoCapitalize="words"
        />
        <TextField
          label="Post"
          required
          value={form.designation}
          onChangeText={v => set('designation', v)}
          placeholder="e.g. Junior Engineer"
          autoCapitalize="words"
        />
        <TextField
          label="Phone"
          value={form.phone}
          onChangeText={v => set('phone', v)}
          placeholder="10-digit mobile number"
          keyboardType="phone-pad"
          maxLength={15}
        />
        <TextField
          label="Organization"
          value={form.organization}
          onChangeText={v => set('organization', v)}
          placeholder="e.g. RES Division"
          autoCapitalize="words"
        />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Location Details</Text>
        <SelectField
          label="Select District"
          required
          placeholder="Choose District"
          options={Object.keys(DISTRICTS)}
          value={location.district}
          onChange={v => setLocation('district', v)}
          allowAdd
        />
        <SelectField
          label="Select Janpad Panchayat"
          required
          placeholder="Choose Janpad Panchayat"
          options={janpads}
          value={location.janpad}
          onChange={v => setLocation('janpad', v)}
          disabled={!location.district}
          hint={location.district ? undefined : 'Select district first'}
          allowAdd
        />
        <SelectField
          label="Select Panchayat"
          required
          placeholder="Choose Panchayat"
          options={[]}
          value={location.panchayat}
          onChange={v => setLocation('panchayat', v)}
          disabled={!location.janpad}
          hint={location.janpad ? undefined : 'Select Janpad Panchayat first'}
          allowAdd
        />
        <SelectField
          label="Select or Add Village"
          required
          placeholder="Choose Village"
          options={[]}
          value={location.village}
          onChange={v => setLocation('village', v)}
          disabled={!location.panchayat}
          hint={location.panchayat ? undefined : 'Select Panchayat first'}
          allowAdd
        />
      </Card>

      <View style={styles.note}>
        <Text style={styles.noteText}>
          <Text style={styles.noteBold}>Note: </Text>
          All fields marked with <Text style={styles.required}>*</Text> are required. Location
          selection follows a cascading order.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  photoCard: { alignItems: 'center', gap: 12 },
  photoLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 14 },
  note: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FED7AA',
    borderRadius: radius.md,
    padding: 14,
  },
  noteText: { fontSize: 13, color: '#7C2D12', lineHeight: 19 },
  noteBold: { fontWeight: '800' },
  required: { color: colors.danger },
});
