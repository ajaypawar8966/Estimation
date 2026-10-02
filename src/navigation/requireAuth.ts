import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../store/AuthStore';

// What the user tapped before being sent to sign in; run once they're signed in.
let pendingAction: (() => void) | null = null;

/**
 * Returns a wrapper for feature actions: runs the action straight away when
 * signed in, otherwise opens Sign In and runs it after a successful sign in/up.
 */
export function useRequireAuth() {
  const { status } = useAuth();
  // Works from any nested navigator: `navigate('Login')` bubbles up to the root stack.
  const navigation = useNavigation<{ navigate: (name: 'Login') => void }>();
  return useCallback(
    (action: () => void) => {
      if (status === 'signedIn') {
        action();
        return;
      }
      pendingAction = action;
      navigation.navigate('Login');
    },
    [status, navigation],
  );
}

/** Closes the sign-in screens and continues to whatever the user originally tapped. */
export function finishAuth(navigation: { popTo: (name: 'Main') => void }) {
  navigation.popTo('Main');
  const action = pendingAction;
  pendingAction = null;
  action?.();
}
