import React, { useEffect, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, FileText, House, LucideIcon, User } from 'lucide-react-native';
import { colors } from '../theme';
import { useStore } from '../store/AppStore';
// TODO(auth): re-enable with the sign-in gate below.
// import { useRequireAuth } from './requireAuth';

const TABS: Record<string, { label: string; icon: LucideIcon }> = {
  Home: { label: 'Home', icon: House },
  Estimation: { label: 'Estimation', icon: FileText },
  Alerts: { label: 'Alerts', icon: Bell },
  Profile: { label: 'Profile', icon: User },
};

const ROOT_SCREEN: Record<string, string> = {
  Home: 'Dashboard',
  Estimation: 'EstimationHome',
};

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { unreadCount } = useStore();
  // const requireAuth = useRequireAuth();
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  // The tab names are dynamic here, so bypass the per-route navigate typings.
  const navigate = navigation.navigate as (name: string, params?: object) => void;

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (keyboardOpen) {
    return null;
  }

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route, index) => {
        const tab = TABS[route.name];
        const focused = state.index === index;
        // As in the design, Home is not highlighted while a sub-page (e.g.
        // Material Calculator) is open inside it; Estimation stays highlighted.
        const nestedIndex = (route.state as { index?: number } | undefined)?.index ?? 0;
        const active = focused && (nestedIndex === 0 || route.name === 'Estimation');
        const color = active ? colors.primary : colors.textFaint;
        const Icon = tab.icon;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (event.defaultPrevented) {
            return;
          }
          if (focused && nestedIndex > 0) {
            // Tapping the current tab pops back to its root screen.
            navigate(route.name, { screen: ROOT_SCREEN[route.name] });
          } else if (!focused) {
            navigate(route.name);
            // TODO(auth): sign-in is switched off for now. To turn it back on,
            // replace the line above with:
            // // Home is open to everyone; every other tab needs an account.
            // if (route.name === 'Home') {
            //   navigate(route.name);
            // } else {
            //   requireAuth(() => navigate(route.name));
            // }
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.label}
            style={styles.item}>
            <View style={[styles.pill, active && styles.pillActive]}>
              <View>
                <Icon size={22} color={color} />
                {route.name === 'Alerts' && unreadCount > 0 && <View style={styles.dot} />}
              </View>
              <Text style={[styles.label, { color }, active && styles.labelActive]}>
                {tab.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  item: { flex: 1, alignItems: 'center' },
  pill: {
    minWidth: 68,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  pillActive: { backgroundColor: colors.primarySoft },
  label: { fontSize: 11, fontWeight: '500' },
  labelActive: { fontWeight: '700' },
  dot: {
    position: 'absolute',
    top: -1,
    right: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
});
