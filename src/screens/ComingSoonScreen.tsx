import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MessageCircle, Pencil } from 'lucide-react-native';
import { EmptyState, Screen } from '../components/ui';
import { HomeStackParamList } from '../navigation/types';

export function CommunityScreen({
  navigation,
}: NativeStackScreenProps<HomeStackParamList, 'Community'>) {
  return (
    <Screen title="Community" onBack={navigation.goBack}>
      <EmptyState
        icon={MessageCircle}
        title="Team chat is coming soon"
        body="Team chat needs a server to sync messages between users, which isn't connected yet."
      />
    </Screen>
  );
}

export function DesignStudioScreen({
  navigation,
}: NativeStackScreenProps<HomeStackParamList, 'DesignStudio'>) {
  return (
    <Screen title="Design Studio" onBack={navigation.goBack}>
      <EmptyState
        icon={Pencil}
        title="2D/3D design is coming soon"
        body="The civil design tools aren't built yet. Use the Material Calculator to estimate quantities in the meantime."
      />
    </Screen>
  );
}
