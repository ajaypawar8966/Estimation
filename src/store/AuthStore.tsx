import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, ApiError, ApiUser, ProfileUpdate, SignupInput } from '../api/client';

const STORAGE_KEY = 'estimation.auth.v1';

export type Location = {
  district: string;
  janpad: string;
  panchayat: string;
  village: string;
};

/** Profile details the API has no fields for yet, so they are kept on this device. */
export type LocalProfile = { photoUri?: string; location?: Location };

type Persisted = {
  token: string | null;
  user: ApiUser | null;
  /** Keyed by user id so a second account on the same phone starts clean. */
  local: Record<string, LocalProfile>;
};

type Auth = {
  status: 'loading' | 'signedOut' | 'signedIn';
  user: ApiUser | null;
  local: LocalProfile;
  login: (email: string, password: string) => Promise<void>;
  signup: (input: SignupInput) => Promise<void>;
  logout: () => Promise<void>;
  /** Sends `changes` to the server (skipped when empty) and stores `local` on the device. */
  updateProfile: (changes: ProfileUpdate, local: LocalProfile) => Promise<void>;
  saveLocal: (local: LocalProfile) => void;
  /** Runs an API call with the session token; a 401 signs the user out. */
  authed: <T>(call: (token: string) => Promise<T>) => Promise<T>;
};

const AuthContext = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [data, setData] = useState<Persisted>({ token: null, user: null, local: {} });

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (raw) {
          setData(d => ({ ...d, ...JSON.parse(raw) }));
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {});
    }
  }, [data, loaded]);

  const signOutLocally = useCallback(
    () => setData(d => ({ ...d, token: null, user: null })),
    [],
  );

  // The cached user is shown straight away; refresh it from the server and
  // drop the session if the token has been revoked.
  const token = data.token;
  useEffect(() => {
    if (!loaded || !token) {
      return;
    }
    api
      .me(token)
      .then(user => setData(d => (d.token === token ? { ...d, user } : d)))
      .catch(e => {
        if (e instanceof ApiError && e.status === 401) {
          signOutLocally();
        }
      });
  }, [loaded, token, signOutLocally]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password);
    setData(d => ({ ...d, token: res.token, user: res.user }));
  }, []);

  const signup = useCallback(async (input: SignupInput) => {
    const res = await api.signup(input);
    setData(d => ({ ...d, token: res.token, user: res.user }));
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      // Sign out on this device even if the server call fails (e.g. offline).
      await api.logout(token).catch(() => {});
    }
    signOutLocally();
  }, [token, signOutLocally]);

  const updateProfile = useCallback(
    async (changes: ProfileUpdate, local: LocalProfile) => {
      if (!token) {
        throw new ApiError('You are signed out. Please sign in again.', 401);
      }
      try {
        const user = Object.keys(changes).length ? await api.updateMe(token, changes) : data.user;
        if (!user) {
          throw new ApiError('You are signed out. Please sign in again.', 401);
        }
        setData(d => ({ ...d, user, local: { ...d.local, [user.id]: local } }));
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          signOutLocally();
        }
        throw e;
      }
    },
    [token, data.user, signOutLocally],
  );

  const saveLocal = useCallback(
    (local: LocalProfile) =>
      setData(d => (d.user ? { ...d, local: { ...d.local, [d.user.id]: local } } : d)),
    [],
  );

  const authed = useCallback(
    async <T,>(call: (t: string) => Promise<T>): Promise<T> => {
      if (!token) {
        throw new ApiError('You are signed out. Please sign in again.', 401);
      }
      try {
        return await call(token);
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          signOutLocally();
        }
        throw e;
      }
    },
    [token, signOutLocally],
  );

  const auth = useMemo<Auth>(
    () => ({
      status: !loaded ? 'loading' : data.token && data.user ? 'signedIn' : 'signedOut',
      user: data.user,
      local: (data.user && data.local[data.user.id]) || {},
      login,
      signup,
      logout,
      updateProfile,
      saveLocal,
      authed,
    }),
    [loaded, data, login, signup, logout, updateProfile, saveLocal, authed],
  );

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth(): Auth {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
