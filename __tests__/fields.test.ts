import { WorkTypeField } from '../src/api/client';
import {
  buildInputs,
  fieldErrorsFromDetails,
  fieldKind,
  fieldPlaceholder,
  groupFields,
  initialRaw,
} from '../src/estimates/fields';
import { formatQty, formatRupees } from '../src/utils/money';

const f = (over: Partial<WorkTypeField>): WorkTypeField => ({
  key: 'x',
  type: 'decimal',
  label: 'X',
  ...over,
});

const length = f({
  key: 'internal_length',
  label: 'Internal length',
  unit: 'm',
  required: true,
  min: 0,
  group: 'Dimensions',
});
const height = f({ key: 'wall_height', label: 'Wall height', default: 3.0, group: 'Dimensions' });
const wc = f({ key: 'wc_count', type: 'integer', label: 'WCs', max: 6, group: 'Fittings' });
const tank = f({ key: 'septic_tank', type: 'boolean', label: 'Septic tank', default: true, group: 'Fittings' });
const dia = f({
  key: 'pipe_dia',
  type: 'string',
  label: 'Pipe dia',
  options: [600, 900, { value: 1200, label: '1200 mm' }],
});

test('field kinds and placeholders', () => {
  expect([length, wc, tank, dia, f({ type: 'string' })].map(fieldKind)).toEqual([
    'decimal',
    'integer',
    'boolean',
    'select',
    'text',
  ]);
  expect(fieldPlaceholder(height)).toBe('Default 3');
  expect(fieldPlaceholder(f({ auto_default: true }))).toBe('Auto');
});

test('booleans start from their default; existing inputs win', () => {
  expect(initialRaw([length, tank])).toEqual({ internal_length: '', septic_tank: 'true' });
  expect(initialRaw([length, tank], { internal_length: 4.5, septic_tank: false })).toEqual({
    internal_length: '4.5',
    septic_tank: 'false',
  });
});

test('buildInputs types values, drops blanks and validates', () => {
  const fields = [length, height, wc, tank, dia];
  expect(
    buildInputs(fields, {
      internal_length: '4.5',
      wall_height: '',
      wc_count: '3',
      septic_tank: 'false',
      pipe_dia: '900',
    }),
  ).toEqual({
    inputs: { internal_length: 4.5, wc_count: 3, septic_tank: false, pipe_dia: 900 },
    errors: {},
  });
  expect(buildInputs(fields, { internal_length: '', wc_count: '9' }).errors).toEqual({
    internal_length: 'Internal length is required',
    wc_count: 'WCs must be at most 6',
  });
  expect(buildInputs([length], { internal_length: '-1' }).errors).toEqual({
    internal_length: 'Internal length must be at least 0',
  });
});

test('server details map onto fields', () => {
  expect(
    fieldErrorsFromDetails({
      'inputs.rows': ['Inputs rows must be at most 6'],
      name: ['Name is required'],
    }),
  ).toEqual({ errors: { rows: 'Inputs rows must be at most 6' }, other: ['Name is required'] });
});

test('consecutive fields are grouped', () => {
  expect(groupFields([length, height, wc, tank]).map(g => [g.title, g.fields.length])).toEqual([
    ['Dimensions', 2],
    ['Fittings', 2],
  ]);
});

test('money and quantity formatting', () => {
  expect(formatRupees(586959.26, 2)).toBe('₹5,86,959.26');
  expect(formatRupees(12885)).toBe('₹12,885');
  expect(formatRupees(0, 2)).toBe('₹0.00');
  expect(formatQty(8.597)).toBe('8.597');
  expect(formatQty(75)).toBe('75');
});
