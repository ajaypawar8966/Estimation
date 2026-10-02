import React from 'react';
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { launchCamera, launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { Camera, User } from 'lucide-react-native';
import { colors } from '../theme';

/** Asks camera vs gallery, then reports the picked image URI (or undefined to remove it). */
export function pickProfilePhoto(hasPhoto: boolean, onPicked: (uri: string | undefined) => void) {
  const handle = (res: ImagePickerResponse) => {
    const uri = res.assets?.[0]?.uri;
    if (res.errorCode) {
      Alert.alert('Could not open photo', res.errorMessage ?? res.errorCode);
    } else if (uri) {
      onPicked(uri);
    }
  };
  const options = { mediaType: 'photo', quality: 0.7, maxWidth: 800, maxHeight: 800 } as const;
  Alert.alert('Profile photo', undefined, [
    { text: 'Take photo', onPress: () => launchCamera(options, handle) },
    { text: 'Choose from gallery', onPress: () => launchImageLibrary(options, handle) },
    ...(hasPhoto
      ? [{ text: 'Remove photo', style: 'destructive' as const, onPress: () => onPicked(undefined) }]
      : []),
    { text: 'Cancel', style: 'cancel' },
  ]);
}

export function Avatar({
  uri,
  size = 88,
  onCameraPress,
}: {
  uri?: string;
  size?: number;
  onCameraPress?: () => void;
}) {
  const circle = { width: size, height: size, borderRadius: size / 2 };
  return (
    <View style={[styles.ring, { borderRadius: size / 2 + 4 }]}>
      {uri ? (
        <Image source={{ uri }} style={circle} accessibilityLabel="Profile photo" />
      ) : (
        <LinearGradient colors={['#FFEDD5', '#FED7AA']} style={[styles.placeholder, circle]}>
          <User size={size * 0.42} color={colors.primary} />
        </LinearGradient>
      )}
      {onCameraPress && (
        <Pressable
          onPress={onCameraPress}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Change profile photo"
          style={styles.badge}>
          <Camera size={15} color="#fff" />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { padding: 4, backgroundColor: colors.surface, elevation: 2 },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
