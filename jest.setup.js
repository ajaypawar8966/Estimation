/* eslint-env jest */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('react-native-linear-gradient', () => 'LinearGradient');
jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn(),
  launchImageLibrary: jest.fn(),
}));
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  const frame = { x: 0, y: 0, width: 390, height: 844 };
  const Context = React.createContext({ insets, frame });
  return {
    SafeAreaProvider: ({ children }) =>
      React.createElement(
        Context.Provider,
        { value: { insets, frame } },
        children,
      ),
    SafeAreaInsetsContext: Context,
    SafeAreaFrameContext: React.createContext(frame),
    useSafeAreaInsets: () => insets,
    useSafeAreaFrame: () => frame,
    initialWindowMetrics: { insets, frame },
  };
});
// The real icon bundle is huge and slows/OOMs jest; icons don't matter in tests.
jest.mock('lucide-react-native', () => {
  const React = require('react');
  const Icon = props => React.createElement('Icon', props);
  return new Proxy(
    { __esModule: true },
    { get: (target, key) => (key in target ? target[key] : Icon) },
  );
});
jest.mock('react-native-blob-util', () => ({
  __esModule: true,
  default: {
    fs: { dirs: { DownloadDir: '/downloads', DocumentDir: '/documents' } },
    config: jest.fn(() => ({ fetch: jest.fn() })),
    android: { actionViewIntent: jest.fn(() => Promise.resolve()) },
    ios: { openDocument: jest.fn() },
  },
}));
