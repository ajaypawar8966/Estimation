/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from '../App';

const user = {
  id: 1,
  name: 'Demo Engineer',
  email: 'engineer@example.com',
  phone: null,
  designation: 'Sub Engineer',
  organization: null,
  created_at: '2026-09-26T06:42:15.962Z',
};

type Node = ReactTestRenderer.ReactTestInstance;
const textOf = (n: Node) =>
  n
    .findAll(c => typeof c.props.children === 'string')
    .map(c => c.props.children)
    .join(' ');
const button = (root: Node, label: string) =>
  root
    .findAll(
      n =>
        typeof n.props.onPress === 'function' &&
        n.props.accessibilityRole &&
        textOf(n).includes(label),
    )
    .pop()!;

async function render() {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<App />);
  });
  return JSON.stringify(tree.toJSON());
}

beforeEach(async () => {
  await AsyncStorage.clear();
  globalThis.fetch = jest.fn(async (url: string) => ({
    ok: true,
    status: 200,
    text: async () =>
      JSON.stringify(url.endsWith('/me') ? user : { token: 'abc', user }),
  })) as unknown as typeof fetch;
});

test('opens on the dashboard when signed out, and features ask to sign in', async () => {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<App />);
  });
  expect(JSON.stringify(tree.toJSON())).toContain('Quick Actions');
  expect(JSON.stringify(tree.toJSON())).not.toContain('Sign In');

  const profileTab = tree.root.find(
    n => n.props.accessibilityLabel === 'Profile' && n.props.onPress,
  );
  await ReactTestRenderer.act(async () => {
    profileTab.props.onPress();
  });
  const json = JSON.stringify(tree.toJSON());
  expect(json).toContain('Sign in to continue to your account');
  expect(json).not.toContain('Account Information');
});

test('renders the dashboard for a signed-in user', async () => {
  await AsyncStorage.setItem(
    'estimation.auth.v1',
    JSON.stringify({ token: 'abc', user, local: {} }),
  );
  const json = await render();
  expect(json).toContain('Dashboard');
  expect(json).toContain('Material Calculator');
  expect(json).toContain('Quick Actions');
});

test('signing in continues to the feature the user tapped', async () => {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<App />);
  });
  await ReactTestRenderer.act(async () => {
    button(tree.root, 'Material Calculator').props.onPress();
  });
  const field = (placeholder: string) =>
    tree.root.findAll(
      n => n.props.placeholder === placeholder && n.props.onChangeText,
    )[0];
  await ReactTestRenderer.act(async () => {
    field('you@example.com').props.onChangeText('engineer@example.com');
    field('Enter password').props.onChangeText('password123');
  });
  await ReactTestRenderer.act(async () => {
    button(tree.root, 'Sign In').props.onPress();
  });
  const json = JSON.stringify(tree.toJSON());
  expect(json).toContain('Select Material Type');
  expect(json).not.toContain('Sign in to continue to your account');
});
