import React, { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { launchCamera, launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { Camera, Image as ImageIcon, Trash2 } from 'lucide-react-native';
import { Button, Card, EmptyState, formatDate, PromptModal, Screen } from '../components/ui';
import { HomeStackParamList } from '../navigation/types';
import { useStore } from '../store/AppStore';
import { colors, radius } from '../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'SitePhotos'>;

export default function SitePhotosScreen({ navigation }: Props) {
  const { photos, addPhoto, deletePhoto } = useStore();
  const [pendingUri, setPendingUri] = useState<string | null>(null);

  const handle = (res: ImagePickerResponse) => {
    if (res.errorCode) {
      Alert.alert('Could not get photo', res.errorMessage ?? res.errorCode);
      return;
    }
    const uri = res.assets?.[0]?.uri;
    if (uri) {
      setPendingUri(uri);
    }
  };

  const confirmDelete = (id: string) =>
    Alert.alert('Delete photo?', 'This removes it from Site Photos.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deletePhoto(id) },
    ]);

  return (
    <Screen title="Site Photos" onBack={navigation.goBack}>
      <View style={styles.actions}>
        <View style={styles.flex}>
          <Button
            label="Camera"
            icon={Camera}
            onPress={() => launchCamera({ mediaType: 'photo', quality: 0.8 }, handle)}
          />
        </View>
        <View style={styles.flex}>
          <Button
            label="Gallery"
            icon={ImageIcon}
            variant="secondary"
            onPress={() => launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, handle)}
          />
        </View>
      </View>

      {photos.length === 0 ? (
        <EmptyState
          icon={Camera}
          title="No site photos"
          body="Capture or pick photos to document your sites."
        />
      ) : (
        photos.map(p => (
          <Card key={p.id} style={styles.photoCard}>
            <Image source={{ uri: p.uri }} style={styles.photo} resizeMode="cover" />
            <View style={styles.row}>
              <View style={styles.flex}>
                <Text style={styles.caption}>{p.caption}</Text>
                <Text style={styles.meta}>{formatDate(p.createdAt)}</Text>
              </View>
              <Pressable
                onPress={() => confirmDelete(p.id)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Delete photo">
                <Trash2 size={18} color={colors.textFaint} />
              </Pressable>
            </View>
          </Card>
        ))
      )}

      <PromptModal
        visible={pendingUri !== null}
        title="Add a caption"
        initial="Site photo"
        onConfirm={caption => {
          if (pendingUri) {
            addPhoto({ uri: pendingUri, caption, site: '' });
          }
          setPendingUri(null);
        }}
        onCancel={() => setPendingUri(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  actions: { flexDirection: 'row', gap: 10 },
  photoCard: { padding: 10, gap: 12 },
  photo: { width: '100%', height: 200, borderRadius: radius.md, backgroundColor: colors.chip },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 6, paddingBottom: 4 },
  caption: { fontSize: 15, fontWeight: '700', color: colors.text },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
