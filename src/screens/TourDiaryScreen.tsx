import React, { useState } from 'react';
import { Alert, Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BookOpen, MapPin, Plus, Trash2 } from 'lucide-react-native';
import { Button, Card, EmptyState, formatDate, Screen, TextField } from '../components/ui';
import { HomeStackParamList } from '../navigation/types';
import { useStore } from '../store/AppStore';
import { colors } from '../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'TourDiary'>;

export default function TourDiaryScreen({ navigation }: Props) {
  const { diary, addDiary, deleteDiary } = useStore();
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [site, setSite] = useState('');
  const [notes, setNotes] = useState('');

  const save = () => {
    Keyboard.dismiss();
    addDiary({ title: title.trim(), site: site.trim(), notes: notes.trim() });
    setTitle('');
    setSite('');
    setNotes('');
    setAdding(false);
  };

  const confirmDelete = (id: string, name: string) =>
    Alert.alert('Delete entry?', `"${name}" will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteDiary(id) },
    ]);

  return (
    <Screen title="Tour Diary" onBack={navigation.goBack}>
      {adding ? (
        <Card>
          <TextField label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Foundation inspection" />
          <TextField label="Site / location" value={site} onChangeText={setSite} placeholder="e.g. Plot 14, Pune" />
          <TextField
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="What did you observe?"
          />
          <View style={styles.actions}>
            <View style={styles.flex}>
              <Button label="Cancel" variant="secondary" onPress={() => setAdding(false)} />
            </View>
            <View style={styles.flex}>
              <Button label="Save entry" disabled={!title.trim()} onPress={save} />
            </View>
          </View>
        </Card>
      ) : (
        <Button label="New visit entry" icon={Plus} onPress={() => setAdding(true)} />
      )}

      {diary.length === 0 && !adding ? (
        <EmptyState
          icon={BookOpen}
          title="No visits logged"
          body="Record your field visits and observations here."
        />
      ) : (
        diary.map(d => (
          <Card key={d.id}>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Text style={styles.title}>{d.title}</Text>
                <View style={styles.meta}>
                  {d.site ? (
                    <>
                      <MapPin size={12} color={colors.textMuted} />
                      <Text style={styles.metaText}>{d.site} · </Text>
                    </>
                  ) : null}
                  <Text style={styles.metaText}>{formatDate(d.createdAt)}</Text>
                </View>
              </View>
              <Pressable
                onPress={() => confirmDelete(d.id, d.title)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Delete entry">
                <Trash2 size={18} color={colors.textFaint} />
              </Pressable>
            </View>
            {d.notes ? <Text style={styles.notes}>{d.notes}</Text> : null}
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  actions: { flexDirection: 'row', gap: 10 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { fontSize: 15, fontWeight: '800', color: colors.text },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 3 },
  metaText: { fontSize: 12, color: colors.textMuted },
  notes: { fontSize: 13, color: colors.text, lineHeight: 19, marginTop: 10 },
});
