import { API_BASE_URL, REQUEST_TIMEOUT_MS } from './config';

/* ---------- Auth ---------- */

export type ApiUser = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  designation: string | null;
  organization: string | null;
  created_at: string;
};

export type AuthResponse = { token: string; user: ApiUser };

export type SignupInput = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  designation?: string;
  organization?: string;
};

export type ProfileUpdate = Partial<
  Pick<ApiUser, 'name' | 'phone' | 'designation' | 'organization'>
>;

/* ---------- Work types ---------- */

export type WorkTypeSummary = { key: string; title: string; description: string };

export type FieldOption = string | number | { value: string | number; label?: string };

/** One input of a work type, as described by `GET /work_types/:key`. */
export type WorkTypeField = {
  key: string;
  /** Seen: "decimal", "integer", "boolean"; anything else is shown as text or a select. */
  type: string;
  label: string;
  unit?: string | null;
  required?: boolean;
  min?: number | null;
  max?: number | null;
  group?: string | null;
  default?: number | string | boolean | null;
  /** The server works the value out when it is left blank. */
  auto_default?: boolean;
  options?: FieldOption[] | null;
  hint?: string | null;
};

export type WorkTypeDetail = WorkTypeSummary & { fields: WorkTypeField[] };

/* ---------- Projects ---------- */

export type Project = {
  id: number;
  name: string;
  location: string | null;
  client_name: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  estimates_count: number;
  total_amount: number;
};

export type ProjectInput = {
  name: string;
  location?: string | null;
  client_name?: string | null;
  description?: string | null;
};

export type EstimateSummary = {
  id: number;
  project_id: number;
  name: string;
  work_type: string;
  work_type_title: string;
  total_amount: number;
  calculated_at: string;
  updated_at: string;
};

export type ProjectDetail = Project & { estimates: EstimateSummary[] };

/* ---------- Estimates ---------- */

export type InputValue = number | string | boolean;

export type Measurement = {
  description: string;
  nos: number | null;
  length: number | null;
  breadth: number | null;
  depth: number | null;
  factor: number | null;
  deduct: boolean;
  quantity: number;
};

export type LineItem = {
  sl_no: number;
  code: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
  measurements: Measurement[];
};

export type Material = { key: string; name: string; unit: string; quantity: number };

/** A calculated estimate: `POST /estimates/preview` returns the same without ids. */
export type EstimateResult = {
  name: string;
  work_type: string;
  work_type_title: string;
  total_amount: number;
  calculated_at: string;
  inputs: Record<string, InputValue>;
  rate_overrides: Record<string, number>;
  contingency_percent: number;
  gst_percent: number;
  line_items: LineItem[];
  materials: Material[];
  subtotal: number;
  contingency_amount: number;
  gst_amount: number;
  total_in_words: string;
};

export type Estimate = EstimateResult & {
  id: number;
  project_id: number;
  updated_at: string;
  downloads?: { excel: string; pdf: string };
};

export type EstimateInput = {
  work_type?: string;
  name?: string;
  inputs?: Record<string, InputValue>;
  contingency_percent?: number;
  gst_percent?: number;
  rate_overrides?: Record<string, number>;
};

/* ---------- Rates ---------- */

export type Rate = {
  code: string;
  description: string;
  unit: string;
  category: string;
  rate: number;
  /** "global" (SOR default) or "personal" (your override). */
  source: string;
  default_rate: number;
};

/* ---------- Errors ---------- */

/** `status` is 0 when the server could not be reached at all. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    /** Validation messages keyed by field, e.g. `{"inputs.rows": ["…"]}`. */
    readonly details: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const humanize = (field: string) => {
  const s = field.replace(/^inputs\./, '').replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const asMessages = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : [String(v)]);

/** Validation details as `{field: [messages]}`, from either `details` or Rails-style `errors`. */
export function errorDetails(body: unknown): Record<string, string[]> {
  if (!body || typeof body !== 'object') {
    return {};
  }
  const { details, errors } = body as Record<string, unknown>;
  const source = details ?? (errors && !Array.isArray(errors) ? errors : null);
  if (!source || typeof source !== 'object') {
    return {};
  }
  return Object.fromEntries(
    Object.entries(source as Record<string, unknown>).map(([k, v]) => [k, asMessages(v)]),
  );
}

/**
 * A readable message from the API's error shapes: `{error, details}` (this
 * backend), plus `{errors: [...]}` / `{errors: {field: [...]}}` for safety.
 */
export function errorMessage(body: unknown, status: number): string {
  if (body && typeof body === 'object') {
    const { error, errors, message } = body as Record<string, unknown>;
    const details = errorDetails(body);
    const detailLines = Object.entries(details).flatMap(([field, msgs]) =>
      // This API sends full sentences ("Email has already been taken"); plain
      // Rails sends fragments ("has already been taken") that need the field name.
      msgs.map(m => (/^[A-Z]/.test(m) ? m : `${humanize(field)} ${m}`)),
    );
    if (detailLines.length) {
      return detailLines.join('\n');
    }
    if (typeof error === 'string') {
      return error;
    }
    if (typeof message === 'string') {
      return message;
    }
    if (Array.isArray(errors) && errors.length) {
      return errors.map(String).join('\n');
    }
  }
  if (status === 401) {
    return 'Your session has expired. Please sign in again.';
  }
  return `Something went wrong (HTTP ${status}). Please try again.`;
}

/* ---------- Transport ---------- */

const headers = (token?: string | null, json = false) => ({
  Accept: 'application/json',
  ...(json && { 'Content-Type': 'application/json' }),
  ...(token && { Authorization: `Bearer ${token}` }),
  // Skips ngrok's browser interstitial page; ignored by every other server.
  'ngrok-skip-browser-warning': 'true',
});

export const apiUrl = (path: string) => `${API_BASE_URL}${path}`;
export const authHeaders = (token: string) => headers(token);

async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  path: string,
  { token, body }: { token?: string | null; body?: unknown } = {},
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(apiUrl(path), {
      method,
      signal: controller.signal,
      headers: headers(token, body !== undefined),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Could not reach the server. Check your internet connection.', 0);
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }
  if (!res.ok) {
    // ngrok answers with its own error page when the tunnel or backend is down.
    if (res.headers?.get('ngrok-error-code')) {
      throw new ApiError('The server is not reachable right now. Please try again shortly.', 0);
    }
    throw new ApiError(errorMessage(data, res.status), res.status, errorDetails(data));
  }
  return data as T;
}

const q = (params: Record<string, string | undefined>) => {
  const s = Object.entries(params)
    .filter(([, v]) => v)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v!)}`)
    .join('&');
  return s ? `?${s}` : '';
};

export const api = {
  // Auth
  signup: (user: SignupInput) =>
    request<AuthResponse>('POST', '/api/v1/auth/signup', { body: { user } }),
  login: (email: string, password: string) =>
    request<AuthResponse>('POST', '/api/v1/auth/login', { body: { email, password } }),
  logout: (token: string) => request<null>('DELETE', '/api/v1/auth/logout', { token }),
  me: (token: string) => request<ApiUser>('GET', '/api/v1/me', { token }),
  updateMe: (token: string, user: ProfileUpdate) =>
    request<ApiUser>('PATCH', '/api/v1/me', { token, body: { user } }),

  // Work types
  workTypes: (token: string) => request<WorkTypeSummary[]>('GET', '/api/v1/work_types', { token }),
  workType: (token: string, key: string) =>
    request<WorkTypeDetail>('GET', `/api/v1/work_types/${encodeURIComponent(key)}`, { token }),

  // Projects
  projects: (token: string) => request<Project[]>('GET', '/api/v1/projects', { token }),
  project: (token: string, id: number) =>
    request<ProjectDetail>('GET', `/api/v1/projects/${id}`, { token }),
  createProject: (token: string, project: ProjectInput) =>
    request<Project>('POST', '/api/v1/projects', { token, body: { project } }),
  updateProject: (token: string, id: number, project: Partial<ProjectInput>) =>
    request<Project>('PATCH', `/api/v1/projects/${id}`, { token, body: { project } }),
  deleteProject: (token: string, id: number) =>
    request<null>('DELETE', `/api/v1/projects/${id}`, { token }),

  // Estimates
  projectEstimates: (token: string, projectId: number) =>
    request<EstimateSummary[]>('GET', `/api/v1/projects/${projectId}/estimates`, { token }),
  createEstimate: (token: string, projectId: number, estimate: EstimateInput) =>
    request<Estimate>('POST', `/api/v1/projects/${projectId}/estimates`, {
      token,
      body: { estimate },
    }),
  estimate: (token: string, id: number) =>
    request<Estimate>('GET', `/api/v1/estimates/${id}`, { token }),
  updateEstimate: (token: string, id: number, estimate: EstimateInput) =>
    request<Estimate>('PATCH', `/api/v1/estimates/${id}`, { token, body: { estimate } }),
  recalculateEstimate: (token: string, id: number) =>
    request<Estimate>('POST', `/api/v1/estimates/${id}/recalculate`, { token }),
  previewEstimate: (token: string, estimate: EstimateInput) =>
    request<EstimateResult>('POST', '/api/v1/estimates/preview', { token, body: { estimate } }),
  deleteEstimate: (token: string, id: number) =>
    request<null>('DELETE', `/api/v1/estimates/${id}`, { token }),
  /** Path of the Excel / PDF file; download it with `downloadEstimate`. */
  estimateFilePath: (id: number, kind: 'excel' | 'pdf') => `/api/v1/estimates/${id}/${kind}`,

  // Rates
  rates: (token: string, category?: string) =>
    request<Rate[]>('GET', `/api/v1/rates${q({ category })}`, { token }),
  setRate: (token: string, code: string, rate: number) =>
    request<Rate>('PUT', `/api/v1/rates/${encodeURIComponent(code)}`, { token, body: { rate } }),
  resetRate: (token: string, code: string) =>
    request<null>('DELETE', `/api/v1/rates/${encodeURIComponent(code)}`, { token }),
};
