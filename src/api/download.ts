import { Platform } from 'react-native';
import type ReactNativeBlobUtilType from 'react-native-blob-util';
import { api, apiUrl, authHeaders } from './client';

/**
 * Loaded on first download rather than at startup: it is a native module, so
 * an app binary built before it was added would otherwise crash on launch.
 */
function blobUtil(): typeof ReactNativeBlobUtilType {
  try {
    return require('react-native-blob-util').default;
  } catch {
    throw new Error('Downloads need the latest app build. Please reinstall the app.');
  }
}

const MIME = {
  pdf: 'application/pdf',
  excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
} as const;

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'estimate';

/**
 * Downloads an estimate's PDF or Excel file (the endpoints need the auth
 * header, so a plain link can't be used) and opens it in a viewer app.
 * Android saves it to Downloads with a notification; iOS opens a preview.
 */
export async function downloadEstimate(
  token: string,
  estimate: { id: number; name: string },
  kind: 'pdf' | 'excel',
) {
  const fileName = `${slug(estimate.name)}-estimate.${kind === 'pdf' ? 'pdf' : 'xlsx'}`;
  const url = apiUrl(api.estimateFilePath(estimate.id, kind));
  const ReactNativeBlobUtil = blobUtil();
  const { dirs } = ReactNativeBlobUtil.fs;

  if (Platform.OS === 'android') {
    const path = `${dirs.DownloadDir}/${fileName}`;
    const res = await ReactNativeBlobUtil.config({
      addAndroidDownloads: {
        useDownloadManager: true,
        notification: true,
        mediaScannable: true,
        title: fileName,
        mime: MIME[kind],
        path,
      },
    }).fetch('GET', url, authHeaders(token));
    const saved = res.path();
    // Opening fails when no app handles the file type; the download itself succeeded.
    await ReactNativeBlobUtil.android.actionViewIntent(saved, MIME[kind]).catch(() => {});
    return saved;
  }

  const res = await ReactNativeBlobUtil.config({
    fileCache: true,
    path: `${dirs.DocumentDir}/${fileName}`,
  }).fetch('GET', url, authHeaders(token));
  if (res.info().status >= 400) {
    throw new Error(`Download failed (HTTP ${res.info().status}).`);
  }
  ReactNativeBlobUtil.ios.openDocument(res.path());
  return res.path();
}
