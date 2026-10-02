import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pencil } from 'lucide-react-native';
import { EmptyState, Screen } from '../components/ui';
import { HomeStackParamList } from '../navigation/types';

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
