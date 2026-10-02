import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppStoreProvider } from './src/store/AppStore';
import { AuthProvider } from './src/store/AuthStore';
import RootNavigator from './src/navigation';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <AuthProvider>
        <AppStoreProvider>
          <RootNavigator />
        </AppStoreProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
