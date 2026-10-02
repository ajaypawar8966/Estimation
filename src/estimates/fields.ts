import { InputValue, WorkTypeField } from '../api/client';

export type FieldKind = 'decimal' | 'integer' | 'boolean' | 'select' | 'text';

/** Form state: numbers and text as typed, booleans as 'true' / 'false', '' = blank. */
export type RawInputs = Record<string, string>;

const NUMBER_TYPES = ['decimal', 'float', 'number', 'numeric'];
const INTEGER_TYPES = ['integer', 'int', 'count'];
const BOOLEAN_TYPES = ['boolean', 'bool', 'checkbox'];

export function fieldKind(f: WorkTypeField): FieldKind {
  const t = (f.type ?? '').toLowerCase();
  if (f.options?.length) {
    return 'select';
  }
  if (BOOLEAN_TYPES.includes(t)) {
    return 'boolean';
  }
  if (INTEGER_TYPES.includes(t)) {
    return 'integer';
  }
  if (NUMBER_TYPES.includes(t)) {
    return 'decimal';
  }
  return 'text';
}

export const fieldOptions = (f: WorkTypeField) =>
  (f.options ?? []).map(o =>
    typeof o === 'object'
      ? { value: String(o.value), label: o.label ?? String(o.value) }
      : { value: String(o), label: String(o) },
  );

export const fieldLabel = (f: WorkTypeField) => (f.unit ? `${f.label} (${f.unit})` : f.label);

/** Placeholder that tells the user what happens when the field is left blank. */
export function fieldPlaceholder(f: WorkTypeField): string {
  if (f.auto_default) {
    return 'Auto';
  }
  if (f.default !== undefined && f.default !== null && f.default !== '') {
    return `Default ${f.default}`;
  }
  return fieldKind(f) === 'integer' ? '0' : fieldKind(f) === 'text' ? '' : '0.00';
}

/** Booleans start from their default so the toggle shows what the server will use. */
export function initialRaw(fields: WorkTypeField[], inputs?: Record<string, InputValue>): RawInputs {
  return Object.fromEntries(
    fields.map(f => {
      const v = inputs?.[f.key];
      if (v !== undefined && v !== null) {
        return [f.key, String(v)];
      }
      if (fieldKind(f) === 'boolean' && typeof f.default === 'boolean') {
        return [f.key, String(f.default)];
      }
      return [f.key, ''];
    }),
  );
}

/**
 * Converts form state to API `inputs`, leaving blanks out so the server
 * applies its defaults. Returns per-field errors for required/min/max.
 */
export function buildInputs(
  fields: WorkTypeField[],
  raw: RawInputs,
): { inputs: Record<string, InputValue>; errors: Record<string, string> } {
  const inputs: Record<string, InputValue> = {};
  const errors: Record<string, string> = {};
  for (const f of fields) {
    const value = (raw[f.key] ?? '').trim();
    if (!value) {
      if (f.required) {
        errors[f.key] = `${f.label} is required`;
      }
      continue;
    }
    const kind = fieldKind(f);
    if (kind === 'boolean') {
      inputs[f.key] = value === 'true';
    } else if (kind === 'decimal' || kind === 'integer') {
      const n = Number(value);
      if (!Number.isFinite(n)) {
        errors[f.key] = `${f.label} must be a number`;
      } else if (f.min !== undefined && f.min !== null && n < f.min) {
        errors[f.key] = `${f.label} must be at least ${f.min}`;
      } else if (f.max !== undefined && f.max !== null && n > f.max) {
        errors[f.key] = `${f.label} must be at most ${f.max}`;
      } else {
        inputs[f.key] = kind === 'integer' ? Math.round(n) : n;
      }
    } else if (kind === 'select') {
      const option = (f.options ?? []).find(
        o => String(typeof o === 'object' ? o.value : o) === value,
      );
      const original = typeof option === 'object' ? option?.value : option;
      inputs[f.key] = typeof original === 'number' ? original : value;
    } else {
      inputs[f.key] = value;
    }
  }
  return { inputs, errors };
}

/** Maps server validation details (`inputs.<key>`) onto form fields. */
export function fieldErrorsFromDetails(details: Record<string, string[]>) {
  const errors: Record<string, string> = {};
  const other: string[] = [];
  for (const [key, msgs] of Object.entries(details)) {
    if (key.startsWith('inputs.')) {
      errors[key.slice('inputs.'.length)] = msgs.join(', ');
    } else {
      other.push(...msgs);
    }
  }
  return { errors, other };
}

/** Required fields first, then optional ones, each kept in their groups' order. */
export function splitFields(fields: WorkTypeField[]) {
  return {
    required: fields.filter(f => f.required),
    optional: fields.filter(f => !f.required),
  };
}

export function groupFields(fields: WorkTypeField[]) {
  const groups: { title: string | null; fields: WorkTypeField[] }[] = [];
  for (const f of fields) {
    const title = f.group ?? null;
    const last = groups[groups.length - 1];
    if (last && last.title === title) {
      last.fields.push(f);
    } else {
      groups.push({ title, fields: [f] });
    }
  }
  return groups;
}
