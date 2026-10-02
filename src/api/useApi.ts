import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../store/AuthStore';

/**
 * Loads data with the session token and reloads whenever the screen regains
 * focus (e.g. coming back from an edit). Pass `null` to skip loading.
 */
export function useApi<T>(call: ((token: string) => Promise<T>) | null, deps: unknown[]) {
  const { authed } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!call);
  const latest = useRef(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(call ?? (async () => null as T), deps);

  const reload = useCallback(async () => {
    if (!call) {
      return;
    }
    const id = ++latest.current;
    setLoading(true);
    try {
      const result = await authed(run);
      if (id === latest.current) {
        setData(result);
        setError(null);
      }
    } catch (e) {
      if (id === latest.current) {
        setError(e instanceof Error ? e.message : 'Something went wrong.');
      }
    } finally {
      if (id === latest.current) {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, run]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  // Ignore late responses once the screen is gone.
  useEffect(
    () => () => {
      latest.current++;
    },
    [],
  );

  return { data, setData, error, loading, reload };
}
