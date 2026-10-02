export type CalcId =
  | 'brick'
  | 'plaster'
  | 'concrete'
  | 'steel'
  | 'flooring'
  | 'paint'
  | 'shuttering'
  | 'dam'
  | 'stair';

export type Values = Record<string, string>;

export type NumberField = {
  kind: 'number';
  key: string;
  label: string;
  unit?: string;
  default: string;
  optional?: boolean;
  showIf?: (v: Values) => boolean;
};

export type SelectField = {
  kind: 'select';
  key: string;
  label: string;
  default: string;
  options: { label: string; value: string }[];
  showIf?: (v: Values) => boolean;
};

export type FieldDef = NumberField | SelectField;

export type ResultLine = {
  /** Machine key used to aggregate totals in Reports (e.g. "cement_bags"). */
  key: string;
  label: string;
  value: number;
  unit?: string;
  decimals?: number;
  primary?: boolean;
};

export type CalcOutcome = { lines: ResultLine[] } | { error: string };

export type CalcDef = {
  id: CalcId;
  title: string;
  subtitle: string;
  description: string;
  fields: FieldDef[];
  compute: (v: Values) => CalcOutcome;
};

export type SavedEstimate = {
  id: string;
  calcId: CalcId;
  name: string;
  createdAt: number;
  inputs: { label: string; value: string }[];
  results: ResultLine[];
};

export type AppAlert = {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
};

export type DiaryEntry = {
  id: string;
  title: string;
  site: string;
  notes: string;
  createdAt: number;
};

export type SitePhoto = {
  id: string;
  uri: string;
  caption: string;
  site: string;
  createdAt: number;
};
