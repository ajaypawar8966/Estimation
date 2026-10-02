import {
  CALCULATORS,
  calculate,
  defaultValues,
  formatNumber,
} from '../src/calculators';
import { CalcId, ResultLine, Values } from '../src/types';
import { evaluate } from '../src/utils/evaluate';

const run = (id: CalcId, overrides: Values): ResultLine[] => {
  const def = CALCULATORS[id];
  const out = calculate(def, { ...defaultValues(def), wastage: '0', ...overrides });
  if ('error' in out) {
    throw new Error(out.error);
  }
  return out.lines;
};
const get = (lines: ResultLine[], key: string) => lines.find(l => l.key === key)!.value;

describe('calculators', () => {
  it('brick: 1 m × 1 m × 200 mm modular wall needs 100 bricks', () => {
    const lines = run('brick', { length: '1', height: '1' });
    expect(get(lines, 'bricks')).toBe(100);
    expect(get(lines, 'wall_m3')).toBeCloseTo(0.2);
  });

  it('brick: rejects openings larger than the wall', () => {
    const def = CALCULATORS.brick;
    const out = calculate(def, { ...defaultValues(def), length: '1', height: '1', openings: '5' });
    expect(out).toEqual({ error: expect.stringContaining('Openings') });
  });

  it('concrete: 1 m³ of M20 needs about 8 bags of cement', () => {
    const lines = run('concrete', { length: '1', width: '1', depth: '1', grade: 'M20' });
    expect(get(lines, 'cement_bags')).toBe(9); // 8.06 rounded up
    expect(get(lines, 'sand_m3')).toBeCloseTo(0.42, 2);
    expect(get(lines, 'aggregate_m3')).toBeCloseTo(0.84, 2);
  });

  it('plaster: 10 m² × 12 mm at 1:4', () => {
    const lines = run('plaster', { area: '10', thickness: '12', ratio: '4' });
    // wet 0.12 m³ → dry 0.1524 m³ → cement 0.03048 m³ → 0.878 bags
    expect(get(lines, 'cement_bags')).toBe(1);
    expect(get(lines, 'sand_m3')).toBeCloseTo(0.1219, 3);
  });

  it('steel: 12 mm × 10 m uses D²/162', () => {
    const lines = run('steel', { dia: '12', length: '10', count: '1' });
    expect(get(lines, 'steel_kg')).toBeCloseTo(8.889, 3);
  });

  it('flooring: 6 × 4 m with 600 mm tiles', () => {
    const lines = run('flooring', { length: '6', width: '4', tile: '600x600' });
    expect(get(lines, 'tiles')).toBe(67);
  });

  it('flooring: adds cost only when a price is given', () => {
    const noPrice = run('flooring', { length: '6', width: '4' });
    expect(noPrice.find(l => l.key === 'tile_cost')).toBeUndefined();
    const priced = run('flooring', { length: '6', width: '4', price: '50' });
    expect(get(priced, 'tile_cost')).toBe(67 * 50);
  });

  it('paint: 4×3×3 room, 2 coats at 10 m²/L', () => {
    const lines = run('paint', { length: '4', width: '3', height: '3' });
    expect(get(lines, 'paint_area')).toBeCloseTo(42);
    expect(get(lines, 'paint_l')).toBeCloseTo(8.4);
  });

  it('shuttering: only validates fields of the selected member', () => {
    const lines = run('shuttering', { type: 'slab', slabL: '5', slabW: '4' });
    expect(get(lines, 'shutter_m2')).toBe(20);
    expect(get(lines, 'plywood')).toBe(7); // 20 / 2.977 = 6.7
  });

  it('dam: trapezoid volume, and base must not be narrower than crest', () => {
    const lines = run('dam', { height: '10', crest: '2', base: '8', length: '100' });
    expect(get(lines, 'concrete_m3')).toBe(5000);
    const def = CALCULATORS.dam;
    const bad = calculate(def, { ...defaultValues(def), height: '10', crest: '8', base: '2', length: '100' });
    expect('error' in bad).toBe(true);
  });

  it('stair: 10 steps of 150 × 250, 1 m wide', () => {
    const lines = run('stair', { steps: '10' });
    expect(get(lines, 'stair_rise')).toBeCloseTo(1.5);
    // steps 10×½×0.15×0.25 = 0.1875; waist √(2.5²+1.5²)×1×0.15 = 0.4373
    expect(get(lines, 'concrete_m3')).toBeCloseTo(0.6248, 3);
  });

  it('requires mandatory inputs', () => {
    const def = CALCULATORS.concrete;
    expect(calculate(def, defaultValues(def))).toEqual({ error: expect.stringContaining('length') });
  });
});

describe('formatNumber', () => {
  it('groups thousands and fixes decimals', () => {
    expect(formatNumber(1234567.891, 2)).toBe('1,234,567.89');
    expect(formatNumber(9, 0)).toBe('9');
  });
});

describe('evaluate', () => {
  it.each([
    ['2+3×4', 14],
    ['(2+3)×4', 20],
    ['10÷4', 2.5],
    ['−5+8', 3],
    ['50%', 0.5],
    ['200×10%', 20],
    ['0.1+0.2', 0.30000000000000004],
  ])('%s = %s', (expr, expected) => {
    expect(evaluate(expr)).toBeCloseTo(expected as number);
  });

  it.each(['', '2+', '(2+3', '1÷0', '1..2', '×3'])('%p is invalid', expr => {
    expect(evaluate(expr)).toBeNull();
  });
});
