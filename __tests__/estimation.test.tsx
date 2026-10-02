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

const toilet = {
  key: 'toilet',
  title: 'Toilet Block',
  description: 'Load-bearing brick toilet block.',
  fields: [
    {
      key: 'internal_length',
      type: 'decimal',
      label: 'Internal length',
      unit: 'm',
      required: true,
      min: 0,
      group: 'Dimensions',
    },
    {
      key: 'internal_width',
      type: 'decimal',
      label: 'Internal width',
      unit: 'm',
      required: true,
      min: 0,
      group: 'Dimensions',
    },
    {
      key: 'wall_height',
      type: 'decimal',
      label: 'Wall height',
      unit: 'm',
      required: false,
      default: 3.0,
      group: 'Dimensions',
    },
    {
      key: 'septic_tank',
      type: 'boolean',
      label: 'Septic tank',
      required: false,
      default: true,
      group: 'Services',
    },
  ],
};

const estimate = {
  id: 7,
  project_id: 9,
  name: 'Toilet Block',
  work_type: 'toilet',
  work_type_title: 'Toilet Block',
  total_amount: 586959.26,
  calculated_at: '2026-09-28T18:07:29.553Z',
  updated_at: '2026-09-28T18:07:29.553Z',
  inputs: {
    internal_length: 4.5,
    internal_width: 3,
    wall_height: 3,
    septic_tank: true,
  },
  rate_overrides: {},
  contingency_percent: 3,
  gst_percent: 18,
  line_items: [
    {
      sl_no: 1,
      code: 'EXC',
      description: 'Earthwork in excavation in all kinds of soil',
      unit: 'm3',
      quantity: 8.597,
      rate: 260,
      amount: 2235.22,
      measurements: [],
    },
  ],
  materials: [
    {
      key: 'cement_bags',
      name: 'Cement (50 kg bags)',
      unit: 'bags',
      quantity: 77,
    },
  ],
  subtotal: 482935.05,
  contingency_amount: 14488.05,
  gst_amount: 89536.16,
  total_in_words:
    'Five Lakh Eighty Six Thousand Nine Hundred Fifty Nine Rupees and Twenty Six Paise Only',
};

const project = {
  id: 9,
  name: 'Toilet Block',
  location: 'Kolukheri, Phanda, Bhopal',
  client_name: 'Gram Panchayat Kolukheri',
  description: null,
  created_at: '2026-09-28T18:07:29.410Z',
  updated_at: '2026-09-28T18:07:29.410Z',
  estimates_count: 1,
  total_amount: 586959.26,
};

type Call = { method: string; path: string; body: unknown };
let calls: Call[];

/** A fake of the backend in API.md, answering by method + path. */
function fakeApi() {
  calls = [];
  globalThis.fetch = jest.fn(async (url: string, init: RequestInit = {}) => {
    const path = url.replace(/^https?:\/\/[^/]+/, '');
    const method = init.method ?? 'GET';
    const body = init.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ method, path, body });
    const routes: Record<string, unknown> = {
      'GET /api/v1/me': user,
      'GET /api/v1/work_types': [
        { key: 'toilet', title: 'Toilet Block', description: '' },
      ],
      'GET /api/v1/work_types/toilet': toilet,
      'POST /api/v1/projects': project,
      'POST /api/v1/projects/9/estimates': estimate,
      'GET /api/v1/estimates/7': estimate,
      'GET /api/v1/projects': calls.some(
        c => c.method === 'POST' && c.path === '/api/v1/projects',
      )
        ? [project]
        : [],
    };
    const data = routes[`${method} ${path}`];
    return {
      ok: data !== undefined,
      status: data !== undefined ? 200 : 404,
      headers: { get: () => null },
      text: async () => JSON.stringify(data ?? { error: 'Not found' }),
    };
  }) as unknown as typeof fetch;
}

type Node = ReactTestRenderer.ReactTestInstance;
const textOf = (n: Node) =>
  n
    .findAll(c => typeof c.props.children === 'string')
    .map(c => c.props.children)
    .join(' ');
const press = async (root: Node, label: string) => {
  const target = root
    .findAll(
      n =>
        typeof n.props.onPress === 'function' &&
        n.props.accessibilityRole &&
        (n.props.accessibilityLabel === label || textOf(n).includes(label)),
    )
    .pop();
  if (!target) {
    throw new Error(`No button "${label}"`);
  }
  await ReactTestRenderer.act(async () => {
    target.props.onPress();
  });
};
const settle = async () => {
  for (let i = 0; i < 5; i++) {
    await ReactTestRenderer.act(async () => {
      await new Promise<void>(r => setTimeout(r, 0));
    });
  }
};

beforeEach(async () => {
  await AsyncStorage.clear();
  await AsyncStorage.setItem(
    'estimation.auth.v1',
    JSON.stringify({
      token: 'abc',
      user,
      local: {
        1: {
          location: {
            district: 'Bhopal',
            janpad: 'Phanda',
            panchayat: 'Kolukheri',
            village: 'Kolukheri',
          },
        },
      },
    }),
  );
  fakeApi();
});

test('Create New Work creates a project and its estimate, then shows the cost', async () => {
  let tree!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    tree = ReactTestRenderer.create(<App />);
  });
  await press(tree.root, 'Estimation');
  await press(tree.root, 'Create New');
  await settle();

  const workType = tree.root.find(
    n => n.props.label === 'Work Type' && n.props.onChange,
  );
  await ReactTestRenderer.act(async () => {
    workType.props.onChange('Toilet Block');
  });
  await settle();

  const input = (label: string) =>
    tree.root.find(
      n => n.props.accessibilityLabel === label && n.props.onChangeText,
    );
  await ReactTestRenderer.act(async () => {
    input('Internal length (m)').props.onChangeText('4.5');
  });

  // Internal width is required and still blank: nothing is sent.
  await press(tree.root, 'Submit');
  expect(JSON.stringify(tree.toJSON())).toContain('Internal width is required');
  expect(calls.some(c => c.method === 'POST')).toBe(false);

  await ReactTestRenderer.act(async () => {
    input('Internal width (m)').props.onChangeText('3');
  });
  await press(tree.root, 'Submit');
  await settle();

  expect(
    calls.find(c => c.method === 'POST' && c.path === '/api/v1/projects')?.body,
  ).toEqual({
    project: {
      name: 'Toilet Block',
      location: 'Kolukheri, Phanda, Bhopal',
      client_name: 'Gram Panchayat Kolukheri',
      description: null,
    },
  });
  // Blank optional fields are left out so the server applies its defaults;
  // the boolean shows its default (Yes) and is sent as-is.
  expect(
    calls.find(c => c.path === '/api/v1/projects/9/estimates')?.body,
  ).toEqual({
    estimate: {
      work_type: 'toilet',
      name: 'Toilet Block',
      inputs: { internal_length: 4.5, internal_width: 3, septic_tank: true },
    },
  });

  const json = JSON.stringify(tree.toJSON());
  expect(json).toContain('Total Estimated Cost');
  expect(json).toContain('₹5,86,959.26');
  expect(json).toContain('Five Lakh Eighty Six Thousand');
  expect(json).toContain('Contingency @ 3%');

  // The new project is listed under Estimation → Projects.
  await press(tree.root, 'Go back');
  await settle();
  await press(tree.root, 'Projects');
  await settle();
  expect(JSON.stringify(tree.toJSON())).toContain('Kolukheri, Phanda, Bhopal');
});
