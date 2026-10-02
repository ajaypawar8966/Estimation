import { useCallback } from 'react';
// TODO(auth): re-enable with the sign-in gate below.
// import { useNavigation } from '@react-navigation/native';
// import { useAuth } from '../store/AuthStore';

// What the user tapped before being sent to sign in; run once they're signed in.
let pendingAction: (() => void) | null = null;

/**
 * Returns a wrapper for feature actions.
 *
 * TODO(auth): sign-in is switched off for now, so this runs the action straight
 * away. To turn it back on, delete the pass-through below and uncomment the
 * original body: it runs the action when signed in, otherwise opens Sign In
 * and runs it after a successful sign in/up.
 */
export function useRequireAuth() {
  return useCallback((action: () => void) => action(), []);

  // const { status } = useAuth();
  // // Works from any nested navigator: `navigate('Login')` bubbles up to the root stack.
  // const navigation = useNavigation<{ navigate: (name: 'Login') => void }>();
  // return useCallback(
  //   (action: () => void) => {
  //     if (status === 'signedIn') {
  //       action();
  //       return;
  //     }
  //     pendingAction = action;
  //     navigation.navigate('Login');
  //   },
  //   [status, navigation],
  // );
}

/** Closes the sign-in screens and continues to whatever the user originally tapped. */
export function finishAuth(navigation: { popTo: (name: 'Main') => void }) {
  navigation.popTo('Main');
  const action = pendingAction;
  pendingAction = null;
  action?.();
}
