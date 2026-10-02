/**
 * Backend base URL. Point this at the current ngrok tunnel while developing
 * (e.g. 'https://abcd-1234.ngrok-free.app') and at the real server later.
 * No trailing slash; the `/api/v1/...` paths are added by the client.
 */
export const API_BASE_URL = 'https://c84f-2401-4900-88f1-a7a2-cef4-3edf-7eef-d1e9.ngrok-free.app'; // TEMP: local mock

/** Requests that take longer than this are aborted and reported as a network error. */
export const REQUEST_TIMEOUT_MS = 15000;
