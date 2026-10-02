import {
  CalcDef,
  CalcId,
  CalcOutcome,
  FieldDef,
  ResultLine,
  Values,
} from '../types';

/** 1 bag of cement = 50 kg; cement density 1440 kg/m³ → 28.8 bags per m³. */
export const BAGS_PER_M3 = 28.8;
const CONCRETE_DRY_FACTOR = 1.54;
const PLASTER_DRY_FACTOR = 1.27;
const MASONRY_DRY_FACTOR = 1.33;
const STEEL_DENSITY = 7850;
/** Standard 8 ft × 4 ft plywood sheet, m². */
const PLYWOOD_SHEET_M2 = 1.22 * 2.44;

/** Cement : sand : aggregate by volume. */
export const CONCRETE_MIXES: Record<string, [number, number, number]> = {
  M5: [1, 5, 10],
  'M7.5': [1, 4, 8],
  M10: [1, 3, 6],
  M15: [1, 2, 4],
  M20: [1, 1.5, 3],
  M25: [1, 1, 2],
};

const GRADE_OPTIONS = Object.keys(CONCRETE_MIXES).map(g => ({
  label: `${g} (${CONCRETE_MIXES[g].join(':')})`,
  value: g,
}));

const MORTAR_OPTIONS = ['3', '4', '5', '6', '8'].map(r => ({
  label: `1:${r}`,
  value: r,
}));

export const num = (v: Values, key: string): number => {
  const n = parseFloat(v[key] ?? '');
  return Number.isFinite(n) ? n : 0;
};

const wastageField = (def = '5'): FieldDef => ({
  kind: 'number',
  key: 'wastage',
  label: 'Wastage',
  unit: '%',
  default: def,
  optional: true,
});

const withWastage = (n: number, v: Values) => n * (1 + num(v, 'wastage') / 100);

const cementLines = (cementM3: number): ResultLine[] => [
  {
    key: 'cement_bags',
    label: 'Cement',
    value: Math.ceil(cementM3 * BAGS_PER_M3),
    unit: 'bags',
    decimals: 0,
    primary: true,
  },
  {
    key: 'cement_kg',
    label: 'Cement weight',
    value: Math.ceil(cementM3 * BAGS_PER_M3) * 50,
    unit: 'kg',
    decimals: 0,
  },
];

/** Splits a dry volume into cement / sand / aggregate lines for a mix. */
const mixLines = (dryVol: number, mix: number[]): ResultLine[] => {
  const total = mix.reduce((a, b) => a + b, 0);
  const lines: ResultLine[] = [
    ...cementLines((dryVol * mix[0]) / total),
    {
      key: 'sand_m3',
      label: 'Sand',
      value: (dryVol * mix[1]) / total,
      unit: 'm³',
    },
  ];
  if (mix.length > 2) {
    lines.push({
      key: 'aggregate_m3',
      label: 'Aggregate',
      value: (dryVol * mix[2]) / total,
      unit: 'm³',
    });
  }
  return lines;
};

const BRICK_SIZES: Record<string, { nominal: number; actual: number }> = {
  // [L × B × H] in metres; nominal includes 10 mm mortar joint.
  modular: { nominal: 0.2 * 0.1 * 0.1, actual: 0.19 * 0.09 * 0.09 },
  traditional: { nominal: 0.24 * 0.12 * 0.08, actual: 0.23 * 0.11 * 0.07 },
};

const brick: CalcDef = {
  id: 'brick',
  title: 'Brick',
  subtitle: 'Calculate brick',
  description: 'Bricks, cement and sand for a brick masonry wall.',
  fields: [
    { kind: 'number', key: 'length', label: 'Wall length', unit: 'm', default: '' },
    { kind: 'number', key: 'height', label: 'Wall height', unit: 'm', default: '' },
    {
      kind: 'select',
      key: 'thickness',
      label: 'Wall thickness',
      default: '0.2',
      options: [
        { label: '100 mm (4")', value: '0.1' },
        { label: '200 mm (9")', value: '0.2' },
        { label: '300 mm (13.5")', value: '0.3' },
      ],
    },
    {
      kind: 'select',
      key: 'size',
      label: 'Brick size',
      default: 'modular',
      options: [
        { label: 'Modular 190×90×90', value: 'modular' },
        { label: 'Traditional 230×110×70', value: 'traditional' },
      ],
    },
    {
      kind: 'select',
      key: 'ratio',
      label: 'Mortar ratio (cement : sand)',
      default: '6',
      options: MORTAR_OPTIONS,
    },
    {
      kind: 'number',
      key: 'openings',
      label: 'Openings (doors / windows)',
      unit: 'm²',
      default: '0',
      optional: true,
    },
    wastageField(),
  ],
  compute: v => {
    const t = num(v, 'thickness');
    const net = (num(v, 'length') * num(v, 'height') - num(v, 'openings')) * t;
    if (net <= 0) {
      return { error: 'Openings area is larger than the wall area.' };
    }
    const size = BRICK_SIZES[v.size];
    const bricks = net / size.nominal;
    const mortarWet = net - bricks * size.actual;
    const mortarDry = mortarWet * MASONRY_DRY_FACTOR;
    const r = num(v, 'ratio');
    return {
      lines: [
        {
          key: 'bricks',
          label: 'Bricks',
          value: Math.ceil(withWastage(bricks, v)),
          unit: 'nos',
          decimals: 0,
          primary: true,
        },
        { key: 'wall_m3', label: 'Masonry volume', value: net, unit: 'm³' },
        { key: 'mortar_m3', label: 'Wet mortar', value: mortarWet, unit: 'm³' },
        ...cementLines(withWastage(mortarDry / (1 + r), v)),
        {
          key: 'sand_m3',
          label: 'Sand',
          value: withWastage((mortarDry * r) / (1 + r), v),
          unit: 'm³',
        },
      ],
    };
  },
};

const plaster: CalcDef = {
  id: 'plaster',
  title: 'Plaster',
  subtitle: 'Calculate plaster',
  description: 'Cement and sand for wall or ceiling plastering.',
  fields: [
    { kind: 'number', key: 'area', label: 'Plaster area', unit: 'm²', default: '' },
    { kind: 'number', key: 'thickness', label: 'Thickness', unit: 'mm', default: '12' },
    {
      kind: 'select',
      key: 'ratio',
      label: 'Mortar ratio (cement : sand)',
      default: '4',
      options: MORTAR_OPTIONS,
    },
    {
      kind: 'number',
      key: 'openings',
      label: 'Deduct openings',
      unit: 'm²',
      default: '0',
      optional: true,
    },
    wastageField(),
  ],
  compute: v => {
    const area = num(v, 'area') - num(v, 'openings');
    if (area <= 0) {
      return { error: 'Openings area is larger than the plaster area.' };
    }
    const wet = (area * num(v, 'thickness')) / 1000;
    const dry = wet * PLASTER_DRY_FACTOR;
    const r = num(v, 'ratio');
    return {
      lines: [
        ...cementLines(withWastage(dry / (1 + r), v)),
        {
          key: 'sand_m3',
          label: 'Sand',
          value: withWastage((dry * r) / (1 + r), v),
          unit: 'm³',
        },
        { key: 'plaster_area', label: 'Net plaster area', value: area, unit: 'm²' },
        { key: 'mortar_m3', label: 'Wet mortar', value: wet, unit: 'm³' },
      ],
    };
  },
};

const concrete: CalcDef = {
  id: 'concrete',
  title: 'Concrete',
  subtitle: 'Calculate concrete',
  description: 'Cement, sand and aggregate for a concrete member.',
  fields: [
    { kind: 'number', key: 'length', label: 'Length', unit: 'm', default: '' },
    { kind: 'number', key: 'width', label: 'Width', unit: 'm', default: '' },
    { kind: 'number', key: 'depth', label: 'Depth / thickness', unit: 'm', default: '' },
    { kind: 'number', key: 'count', label: 'Number of members', default: '1' },
    {
      kind: 'select',
      key: 'grade',
      label: 'Concrete grade (cement : sand : aggregate)',
      default: 'M20',
      options: GRADE_OPTIONS,
    },
    wastageField(),
  ],
  compute: v => {
    const wet = num(v, 'length') * num(v, 'width') * num(v, 'depth') * num(v, 'count');
    const dry = withWastage(wet * CONCRETE_DRY_FACTOR, v);
    return {
      lines: [
        {
          key: 'concrete_m3',
          label: 'Concrete volume',
          value: wet,
          unit: 'm³',
          primary: true,
        },
        ...mixLines(dry, CONCRETE_MIXES[v.grade]),
      ],
    };
  },
};

const BAR_DIAMETERS = ['6', '8', '10', '12', '16', '20', '25', '32'];

const steel: CalcDef = {
  id: 'steel',
  title: 'Steel',
  subtitle: 'Calculate steel',
  description: 'Weight of reinforcement bars (D²/162 kg per metre).',
  fields: [
    {
      kind: 'select',
      key: 'dia',
      label: 'Bar diameter',
      default: '12',
      options: BAR_DIAMETERS.map(d => ({ label: `${d} mm`, value: d })),
    },
    { kind: 'number', key: 'length', label: 'Length of one bar', unit: 'm', default: '' },
    { kind: 'number', key: 'count', label: 'Number of bars', default: '' },
    wastageField('3'),
  ],
  compute: v => {
    const d = num(v, 'dia');
    const perMetre = (d * d) / 162;
    const totalLen = withWastage(num(v, 'length') * num(v, 'count'), v);
    const kg = perMetre * totalLen;
    return {
      lines: [
        {
          key: 'steel_kg',
          label: 'Total steel weight',
          value: kg,
          unit: 'kg',
          primary: true,
        },
        { key: 'steel_t', label: 'In tonnes', value: kg / 1000, unit: 't', decimals: 3 },
        { key: 'steel_len', label: 'Total length', value: totalLen, unit: 'm' },
        { key: 'unit_wt', label: 'Unit weight', value: perMetre, unit: 'kg/m', decimals: 3 },
        {
          key: 'steel_bars12',
          label: '12 m bars required',
          value: Math.ceil(totalLen / 12),
          unit: 'nos',
          decimals: 0,
        },
      ],
    };
  },
};

const flooring: CalcDef = {
  id: 'flooring',
  title: 'Flooring',
  subtitle: 'Calculate flooring',
  description: 'Number of tiles and cost for a floor.',
  fields: [
    { kind: 'number', key: 'length', label: 'Room length', unit: 'm', default: '' },
    { kind: 'number', key: 'width', label: 'Room width', unit: 'm', default: '' },
    {
      kind: 'select',
      key: 'tile',
      label: 'Tile size',
      default: '600x600',
      options: [
        { label: '300×300 mm', value: '300x300' },
        { label: '600×600 mm', value: '600x600' },
        { label: '600×1200 mm', value: '600x1200' },
        { label: '800×800 mm', value: '800x800' },
        { label: '1200×1200 mm', value: '1200x1200' },
      ],
    },
    wastageField('10'),
    {
      kind: 'number',
      key: 'price',
      label: 'Price per tile',
      unit: '₹',
      default: '',
      optional: true,
    },
  ],
  compute: v => {
    const [tw, th] = v.tile.split('x').map(Number);
    const area = num(v, 'length') * num(v, 'width');
    const tiles = Math.ceil(withWastage(area / ((tw / 1000) * (th / 1000)), v));
    const lines: ResultLine[] = [
      { key: 'tiles', label: 'Tiles required', value: tiles, unit: 'nos', decimals: 0, primary: true },
      { key: 'floor_area', label: 'Floor area', value: area, unit: 'm²' },
      { key: 'tile_area', label: 'Tile area (with wastage)', value: (tiles * tw * th) / 1e6, unit: 'm²' },
    ];
    if (num(v, 'price') > 0) {
      lines.push({
        key: 'tile_cost',
        label: 'Estimated cost',
        value: tiles * num(v, 'price'),
        unit: '₹',
        decimals: 0,
      });
    }
    return { lines };
  },
};

const paint: CalcDef = {
  id: 'paint',
  title: 'Paint',
  subtitle: 'Calculate paint',
  description: 'Paint and primer quantity for a room.',
  fields: [
    { kind: 'number', key: 'length', label: 'Room length', unit: 'm', default: '' },
    { kind: 'number', key: 'width', label: 'Room width', unit: 'm', default: '' },
    { kind: 'number', key: 'height', label: 'Room height', unit: 'm', default: '' },
    {
      kind: 'number',
      key: 'openings',
      label: 'Openings (doors / windows)',
      unit: 'm²',
      default: '0',
      optional: true,
    },
    {
      kind: 'select',
      key: 'ceiling',
      label: 'Paint the ceiling too?',
      default: 'no',
      options: [
        { label: 'No', value: 'no' },
        { label: 'Yes', value: 'yes' },
      ],
    },
    { kind: 'number', key: 'coats', label: 'Number of coats', default: '2' },
    { kind: 'number', key: 'coverage', label: 'Coverage per litre', unit: 'm²/L', default: '10' },
  ],
  compute: v => {
    const l = num(v, 'length');
    const w = num(v, 'width');
    const walls = 2 * (l + w) * num(v, 'height');
    const area = walls - num(v, 'openings') + (v.ceiling === 'yes' ? l * w : 0);
    if (area <= 0) {
      return { error: 'Openings area is larger than the paintable area.' };
    }
    const litres = (area * num(v, 'coats')) / num(v, 'coverage');
    return {
      lines: [
        { key: 'paint_l', label: 'Paint required', value: Math.ceil(litres * 10) / 10, unit: 'L', primary: true },
        { key: 'primer_l', label: 'Primer (1 coat)', value: Math.ceil((area / 12) * 10) / 10, unit: 'L' },
        { key: 'paint_area', label: 'Paintable area', value: area, unit: 'm²' },
      ],
    };
  },
};

const isType = (t: string) => (v: Values) => v.type === t;

const shuttering: CalcDef = {
  id: 'shuttering',
  title: 'Shuttering',
  subtitle: 'Calculate shuttering',
  description: 'Formwork contact area and plywood sheets.',
  fields: [
    {
      kind: 'select',
      key: 'type',
      label: 'Member',
      default: 'slab',
      options: [
        { label: 'Slab', value: 'slab' },
        { label: 'Beam', value: 'beam' },
        { label: 'Column', value: 'column' },
        { label: 'Wall', value: 'wall' },
      ],
    },
    { kind: 'number', key: 'slabL', label: 'Slab length', unit: 'm', default: '', showIf: isType('slab') },
    { kind: 'number', key: 'slabW', label: 'Slab width', unit: 'm', default: '', showIf: isType('slab') },
    { kind: 'number', key: 'beamL', label: 'Beam length', unit: 'm', default: '', showIf: isType('beam') },
    { kind: 'number', key: 'beamB', label: 'Beam width', unit: 'm', default: '', showIf: isType('beam') },
    { kind: 'number', key: 'beamD', label: 'Beam depth', unit: 'm', default: '', showIf: isType('beam') },
    { kind: 'number', key: 'beamN', label: 'Number of beams', default: '1', showIf: isType('beam') },
    { kind: 'number', key: 'colB', label: 'Column width', unit: 'm', default: '', showIf: isType('column') },
    { kind: 'number', key: 'colD', label: 'Column depth', unit: 'm', default: '', showIf: isType('column') },
    { kind: 'number', key: 'colH', label: 'Column height', unit: 'm', default: '', showIf: isType('column') },
    { kind: 'number', key: 'colN', label: 'Number of columns', default: '1', showIf: isType('column') },
    { kind: 'number', key: 'wallL', label: 'Wall length', unit: 'm', default: '', showIf: isType('wall') },
    { kind: 'number', key: 'wallH', label: 'Wall height', unit: 'm', default: '', showIf: isType('wall') },
    wastageField(),
  ],
  compute: v => {
    let area = 0;
    switch (v.type) {
      case 'slab':
        area = num(v, 'slabL') * num(v, 'slabW');
        break;
      case 'beam':
        // soffit + two sides
        area = num(v, 'beamL') * (num(v, 'beamB') + 2 * num(v, 'beamD')) * num(v, 'beamN');
        break;
      case 'column':
        area = 2 * (num(v, 'colB') + num(v, 'colD')) * num(v, 'colH') * num(v, 'colN');
        break;
      case 'wall':
        // both faces
        area = 2 * num(v, 'wallL') * num(v, 'wallH');
        break;
    }
    const total = withWastage(area, v);
    return {
      lines: [
        { key: 'shutter_m2', label: 'Shuttering area', value: total, unit: 'm²', primary: true },
        {
          key: 'plywood',
          label: 'Plywood sheets (8×4 ft)',
          value: Math.ceil(total / PLYWOOD_SHEET_M2),
          unit: 'nos',
          decimals: 0,
        },
      ],
    };
  },
};

const dam: CalcDef = {
  id: 'dam',
  title: 'Dam',
  subtitle: 'Calculate dam',
  description: 'Concrete for a gravity dam with a trapezoidal section.',
  fields: [
    { kind: 'number', key: 'height', label: 'Dam height', unit: 'm', default: '' },
    { kind: 'number', key: 'crest', label: 'Crest (top) width', unit: 'm', default: '' },
    { kind: 'number', key: 'base', label: 'Base width', unit: 'm', default: '' },
    { kind: 'number', key: 'length', label: 'Dam length', unit: 'm', default: '' },
    {
      kind: 'select',
      key: 'grade',
      label: 'Concrete grade (cement : sand : aggregate)',
      default: 'M15',
      options: GRADE_OPTIONS,
    },
    wastageField('3'),
  ],
  compute: v => {
    const crest = num(v, 'crest');
    const base = num(v, 'base');
    if (base < crest) {
      return { error: 'Base width must be at least the crest width.' };
    }
    const vol = 0.5 * (crest + base) * num(v, 'height') * num(v, 'length');
    return {
      lines: [
        { key: 'concrete_m3', label: 'Concrete volume', value: vol, unit: 'm³', primary: true },
        { key: 'dam_t', label: 'Approx. dead weight', value: vol * 2.4, unit: 't', decimals: 0 },
        ...mixLines(withWastage(vol * CONCRETE_DRY_FACTOR, v), CONCRETE_MIXES[v.grade]),
      ],
    };
  },
};

const stair: CalcDef = {
  id: 'stair',
  title: 'Stair',
  subtitle: 'Calculate stair',
  description: 'Concrete and steel for a dog-legged / straight RCC stair.',
  fields: [
    { kind: 'number', key: 'steps', label: 'Number of steps', default: '' },
    { kind: 'number', key: 'riser', label: 'Riser height', unit: 'mm', default: '150' },
    { kind: 'number', key: 'tread', label: 'Tread (going)', unit: 'mm', default: '250' },
    { kind: 'number', key: 'width', label: 'Stair width', unit: 'm', default: '1' },
    { kind: 'number', key: 'waist', label: 'Waist slab thickness', unit: 'mm', default: '150' },
    {
      kind: 'number',
      key: 'landing',
      label: 'Landing length',
      unit: 'm',
      default: '0',
      optional: true,
    },
    {
      kind: 'select',
      key: 'grade',
      label: 'Concrete grade (cement : sand : aggregate)',
      default: 'M20',
      options: GRADE_OPTIONS,
    },
    wastageField(),
  ],
  compute: v => {
    const n = num(v, 'steps');
    const riser = num(v, 'riser') / 1000;
    const tread = num(v, 'tread') / 1000;
    const width = num(v, 'width');
    const waist = num(v, 'waist') / 1000;
    const stepsVol = n * 0.5 * riser * tread * width;
    const slope = Math.hypot(n * tread, n * riser);
    const waistVol = slope * width * waist;
    const landingVol = num(v, 'landing') * width * waist;
    const vol = stepsVol + waistVol + landingVol;
    return {
      lines: [
        { key: 'concrete_m3', label: 'Concrete volume', value: vol, unit: 'm³', primary: true },
        { key: 'stair_rise', label: 'Total rise', value: n * riser, unit: 'm' },
        { key: 'stair_going', label: 'Total going', value: n * tread, unit: 'm' },
        ...mixLines(withWastage(vol * CONCRETE_DRY_FACTOR, v), CONCRETE_MIXES[v.grade]),
        {
          key: 'steel_kg',
          label: 'Steel (approx. 1% of volume)',
          value: withWastage(vol * 0.01 * STEEL_DENSITY, v),
          unit: 'kg',
          decimals: 0,
        },
      ],
    };
  },
};

export const CALCULATORS: Record<CalcId, CalcDef> = {
  brick,
  plaster,
  concrete,
  steel,
  flooring,
  paint,
  shuttering,
  dam,
  stair,
};

export const defaultValues = (def: CalcDef): Values =>
  Object.fromEntries(def.fields.map(f => [f.key, f.default]));

export const visibleFields = (def: CalcDef, v: Values): FieldDef[] =>
  def.fields.filter(f => !f.showIf || f.showIf(v));

/** Returns an error message, or null when every visible input is valid. */
export const validate = (def: CalcDef, v: Values): string | null => {
  for (const f of visibleFields(def, v)) {
    if (f.kind !== 'number') {
      continue;
    }
    const raw = (v[f.key] ?? '').trim();
    if (raw === '') {
      if (!f.optional) {
        return `Enter ${f.label.toLowerCase()}.`;
      }
      continue;
    }
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0 || (!f.optional && n === 0)) {
      return `${f.label} must be ${f.optional ? 'zero or more' : 'greater than zero'}.`;
    }
  }
  return null;
};

export const calculate = (def: CalcDef, v: Values): CalcOutcome => {
  const problem = validate(def, v);
  return problem ? { error: problem } : def.compute(v);
};

/** Human-readable list of the inputs used, for saved estimates. */
export const describeInputs = (def: CalcDef, v: Values) =>
  visibleFields(def, v)
    .filter(f => (v[f.key] ?? '') !== '')
    .map(f => {
      if (f.kind === 'select') {
        return {
          label: f.label.replace(/ \(.*\)$/, ''),
          value: f.options.find(o => o.value === v[f.key])?.label ?? v[f.key],
        };
      }
      return { label: f.label, value: `${v[f.key]}${f.unit ? ` ${f.unit}` : ''}` };
    });

export const formatNumber = (n: number, decimals = 2): string => {
  const fixed = Number(n.toFixed(decimals)).toFixed(decimals);
  const [int, frac] = fixed.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return frac ? `${grouped}.${frac}` : grouped;
};

export const formatLine = (l: ResultLine): string =>
  `${formatNumber(l.value, l.decimals ?? 2)}${l.unit ? ` ${l.unit}` : ''}`;
