import { api, ApiError, errorDetails, errorMessage } from '../src/api/client';
import { API_BASE_URL } from '../src/api/config';

const respond = (status: number, body?: unknown) =>
  (globalThis.fetch = jest.fn(async () => ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
  })) as unknown as typeof fetch);

describe('errorMessage', () => {
  test('reads the common Rails error shapes', () => {
    expect(errorMessage({ error: 'Invalid email or password' }, 401)).toBe(
      'Invalid email or password',
    );
    expect(errorMessage({ errors: ["Name can't be blank"] }, 422)).toBe(
      "Name can't be blank",
    );
    expect(
      errorMessage({ errors: { email: ['has already been taken'] } }, 422),
    ).toBe('Email has already been taken');
  });

  test("reads this API's {error, details} validation shape", () => {
    const body = {
      error: 'Validation failed',
      details: {
        'inputs.rows': ['Inputs rows must be at most 6'],
        'inputs.pipe_length': ['Inputs pipe length is required'],
      },
    };
    expect(errorMessage(body, 422)).toBe(
      'Inputs rows must be at most 6\nInputs pipe length is required',
    );
    expect(errorDetails(body)).toEqual(body.details);
    expect(
      errorMessage(
        {
          error: 'Validation failed',
          details: { email: ['Email has already been taken'] },
        },
        422,
      ),
    ).toBe('Email has already been taken');
  });

  test('falls back to a status-based message', () => {
    expect(errorMessage(null, 500)).toMatch(/HTTP 500/);
    expect(errorMessage(null, 401)).toMatch(/sign in again/);
  });
});

describe('api', () => {
  test('login posts credentials and returns the session', async () => {
    const session = { token: 't0k', user: { id: 1 } };
    const fetchMock = respond(200, session);
    await expect(api.login('a@b.co', 'secret')).resolves.toEqual(session);
    const [url, init] = (fetchMock as jest.Mock).mock.calls[0];
    expect(url).toBe(`${API_BASE_URL}/api/v1/auth/login`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({
      email: 'a@b.co',
      password: 'secret',
    });
  });

  test('signup wraps fields in a user object', async () => {
    const fetchMock = respond(201, { token: 't', user: {} });
    await api.signup({ name: 'Ravi', email: 'r@x.co', password: 'pw1234' });
    const init = (fetchMock as jest.Mock).mock.calls[0][1];
    expect(JSON.parse(init.body)).toEqual({
      user: { name: 'Ravi', email: 'r@x.co', password: 'pw1234' },
    });
  });

  test('authenticated calls send the bearer token', async () => {
    const fetchMock = respond(200, { id: 1 });
    await api.updateMe('t0k', { designation: 'Assistant Engineer' });
    const [url, init] = (fetchMock as jest.Mock).mock.calls[0];
    expect(url).toBe(`${API_BASE_URL}/api/v1/me`);
    expect(init.method).toBe('PATCH');
    expect(init.headers.Authorization).toBe('Bearer t0k');
    expect(JSON.parse(init.body)).toEqual({
      user: { designation: 'Assistant Engineer' },
    });
  });

  test('logout accepts an empty 204 response', async () => {
    respond(204);
    await expect(api.logout('t0k')).resolves.toBeNull();
  });

  // Every project/estimate/rate endpoint in API.md: [name, call, method, path, body].
  const T = 't0k';
  const cases: [string, () => Promise<unknown>, string, string, unknown][] = [
    [
      'workTypes',
      () => api.workTypes(T),
      'GET',
      '/api/v1/work_types',
      undefined,
    ],
    [
      'workType',
      () => api.workType(T, 'toilet'),
      'GET',
      '/api/v1/work_types/toilet',
      undefined,
    ],
    ['projects', () => api.projects(T), 'GET', '/api/v1/projects', undefined],
    [
      'project',
      () => api.project(T, 2),
      'GET',
      '/api/v1/projects/2',
      undefined,
    ],
    [
      'createProject',
      () =>
        api.createProject(T, {
          name: 'Rampur works',
          location: 'Rampur, Sehore',
        }),
      'POST',
      '/api/v1/projects',
      { project: { name: 'Rampur works', location: 'Rampur, Sehore' } },
    ],
    [
      'updateProject',
      () => api.updateProject(T, 2, { location: 'Rampur, Dist. Sehore' }),
      'PATCH',
      '/api/v1/projects/2',
      { project: { location: 'Rampur, Dist. Sehore' } },
    ],
    [
      'deleteProject',
      () => api.deleteProject(T, 2),
      'DELETE',
      '/api/v1/projects/2',
      undefined,
    ],
    [
      'projectEstimates',
      () => api.projectEstimates(T, 2),
      'GET',
      '/api/v1/projects/2/estimates',
      undefined,
    ],
    [
      'createEstimate',
      () =>
        api.createEstimate(T, 2, {
          work_type: 'toilet',
          name: 'WC',
          inputs: { wc_count: 3 },
        }),
      'POST',
      '/api/v1/projects/2/estimates',
      {
        estimate: { work_type: 'toilet', name: 'WC', inputs: { wc_count: 3 } },
      },
    ],
    [
      'estimate',
      () => api.estimate(T, 5),
      'GET',
      '/api/v1/estimates/5',
      undefined,
    ],
    [
      'updateEstimate',
      () => api.updateEstimate(T, 5, { gst_percent: 12 }),
      'PATCH',
      '/api/v1/estimates/5',
      { estimate: { gst_percent: 12 } },
    ],
    [
      'recalculateEstimate',
      () => api.recalculateEstimate(T, 5),
      'POST',
      '/api/v1/estimates/5/recalculate',
      undefined,
    ],
    [
      'previewEstimate',
      () =>
        api.previewEstimate(T, {
          work_type: 'cement_concrete',
          inputs: { length: 100 },
        }),
      'POST',
      '/api/v1/estimates/preview',
      { estimate: { work_type: 'cement_concrete', inputs: { length: 100 } } },
    ],
    [
      'deleteEstimate',
      () => api.deleteEstimate(T, 5),
      'DELETE',
      '/api/v1/estimates/5',
      undefined,
    ],
    ['rates', () => api.rates(T), 'GET', '/api/v1/rates', undefined],
    [
      'rates by category',
      () => api.rates(T, 'Earthwork'),
      'GET',
      '/api/v1/rates?category=Earthwork',
      undefined,
    ],
    [
      'setRate',
      () => api.setRate(T, 'EXC', 280),
      'PUT',
      '/api/v1/rates/EXC',
      { rate: 280 },
    ],
    [
      'resetRate',
      () => api.resetRate(T, 'EXC'),
      'DELETE',
      '/api/v1/rates/EXC',
      undefined,
    ],
  ];
  test.each(cases)('%s', async (_name, call, method, path, body) => {
    const fetchMock = respond(200, {});
    await call();
    const [url, init] = (fetchMock as jest.Mock).mock.calls[0];
    expect(url).toBe(`${API_BASE_URL}${path}`);
    expect(init.method).toBe(method);
    expect(init.headers.Authorization).toBe('Bearer t0k');
    expect(init.body === undefined ? undefined : JSON.parse(init.body)).toEqual(
      body,
    );
  });

  test('validation errors keep their field details', async () => {
    respond(422, {
      error: 'Validation failed',
      details: { 'inputs.rows': ['Inputs rows must be at most 6'] },
    });
    await expect(
      api.previewEstimate(T, { work_type: 'pipe_culvert' }),
    ).rejects.toMatchObject({
      status: 422,
      details: { 'inputs.rows': ['Inputs rows must be at most 6'] },
    });
  });

  test('errors carry the status and server message', async () => {
    respond(401, { error: 'Invalid email or password' });
    await expect(api.login('a@b.co', 'bad')).rejects.toEqual(
      new ApiError('Invalid email or password', 401),
    );
  });

  test('ngrok tunnel errors read as an unreachable server', async () => {
    globalThis.fetch = jest.fn(async () => ({
      ok: false,
      status: 400,
      headers: {
        get: (h: string) =>
          h === 'ngrok-error-code' ? 'ERR_NGROK_8012' : null,
      },
      text: async () =>
        'Traffic was successfully tunneled to the ngrok agent, but...',
    })) as unknown as typeof fetch;
    await expect(api.login('a@b.co', 'pw')).rejects.toMatchObject({
      status: 0,
      message: expect.stringMatching(/not reachable/),
    });
  });

  test('network failures become status 0', async () => {
    globalThis.fetch = jest.fn(async () => {
      throw new TypeError('Network request failed');
    }) as unknown as typeof fetch;
    await expect(api.me('t0k')).rejects.toMatchObject({ status: 0 });
  });
});
