import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AppAlert,
  DiaryEntry,
  SavedEstimate,
  SitePhoto,
} from '../types';

const STORAGE_KEY = 'estimation.app.v1';

type State = {
  estimates: SavedEstimate[];
  alerts: AppAlert[];
  diary: DiaryEntry[];
  photos: SitePhoto[];
};

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

const welcomeAlerts = (): AppAlert[] => [
  {
    id: uid(),
    title: 'Welcome to Estimation',
    body: 'Use the Material Calculator to work out quantities, then save them under Estimation.',
    createdAt: Date.now(),
    read: false,
  },
];

const initialState = (): State => ({
  estimates: [],
  alerts: welcomeAlerts(),
  diary: [],
  photos: [],
});

type Action =
  | { type: 'hydrate'; state: State }
  | { type: 'addEstimate'; estimate: SavedEstimate }
  | { type: 'renameEstimate'; id: string; name: string }
  | { type: 'deleteEstimate'; id: string }
  | { type: 'addAlert'; alert: AppAlert }
  | { type: 'readAlert'; id: string }
  | { type: 'readAllAlerts' }
  | { type: 'deleteAlert'; id: string }
  | { type: 'addDiary'; entry: DiaryEntry }
  | { type: 'deleteDiary'; id: string }
  | { type: 'addPhoto'; photo: SitePhoto }
  | { type: 'deletePhoto'; id: string }
  | { type: 'reset' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'hydrate':
      return action.state;
    case 'addEstimate':
      return { ...state, estimates: [action.estimate, ...state.estimates] };
    case 'renameEstimate':
      return {
        ...state,
        estimates: state.estimates.map(e =>
          e.id === action.id ? { ...e, name: action.name } : e,
        ),
      };
    case 'deleteEstimate':
      return { ...state, estimates: state.estimates.filter(e => e.id !== action.id) };
    case 'addAlert':
      return { ...state, alerts: [action.alert, ...state.alerts] };
    case 'readAlert':
      return {
        ...state,
        alerts: state.alerts.map(a => (a.id === action.id ? { ...a, read: true } : a)),
      };
    case 'readAllAlerts':
      return { ...state, alerts: state.alerts.map(a => ({ ...a, read: true })) };
    case 'deleteAlert':
      return { ...state, alerts: state.alerts.filter(a => a.id !== action.id) };
    case 'addDiary':
      return { ...state, diary: [action.entry, ...state.diary] };
    case 'deleteDiary':
      return { ...state, diary: state.diary.filter(d => d.id !== action.id) };
    case 'addPhoto':
      return { ...state, photos: [action.photo, ...state.photos] };
    case 'deletePhoto':
      return { ...state, photos: state.photos.filter(p => p.id !== action.id) };
    case 'reset':
      return initialState();
  }
}

type Store = State & {
  unreadCount: number;
  addEstimate: (e: Omit<SavedEstimate, 'id' | 'createdAt'>) => SavedEstimate;
  renameEstimate: (id: string, name: string) => void;
  deleteEstimate: (id: string) => void;
  readAlert: (id: string) => void;
  readAllAlerts: () => void;
  deleteAlert: (id: string) => void;
  addDiary: (e: Omit<DiaryEntry, 'id' | 'createdAt'>) => void;
  deleteDiary: (id: string) => void;
  addPhoto: (p: Omit<SitePhoto, 'id' | 'createdAt'>) => void;
  deletePhoto: (id: string) => void;
  resetAll: () => void;
};

const StoreContext = createContext<Store | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [hydrated, setHydrated] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (raw) {
          dispatch({ type: 'hydrate', state: { ...initialState(), ...JSON.parse(raw) } });
        }
      })
      .catch(() => {})
      .finally(() => {
        loaded.current = true;
        setHydrated(true);
      });
  }, []);

  useEffect(() => {
    if (loaded.current) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
    }
  }, [state]);

  const addEstimate = useCallback((e: Omit<SavedEstimate, 'id' | 'createdAt'>) => {
    const estimate: SavedEstimate = { ...e, id: uid(), createdAt: Date.now() };
    dispatch({ type: 'addEstimate', estimate });
    dispatch({
      type: 'addAlert',
      alert: {
        id: uid(),
        title: 'Estimate saved',
        body: `"${estimate.name}" was added to your estimations.`,
        createdAt: Date.now(),
        read: false,
      },
    });
    return estimate;
  }, []);

  const store = useMemo<Store>(
    () => ({
      ...state,
      unreadCount: state.alerts.filter(a => !a.read).length,
      addEstimate,
      renameEstimate: (id, name) => dispatch({ type: 'renameEstimate', id, name }),
      deleteEstimate: id => dispatch({ type: 'deleteEstimate', id }),
      readAlert: id => dispatch({ type: 'readAlert', id }),
      readAllAlerts: () => dispatch({ type: 'readAllAlerts' }),
      deleteAlert: id => dispatch({ type: 'deleteAlert', id }),
      addDiary: entry =>
        dispatch({ type: 'addDiary', entry: { ...entry, id: uid(), createdAt: Date.now() } }),
      deleteDiary: id => dispatch({ type: 'deleteDiary', id }),
      addPhoto: photo =>
        dispatch({ type: 'addPhoto', photo: { ...photo, id: uid(), createdAt: Date.now() } }),
      deletePhoto: id => dispatch({ type: 'deletePhoto', id }),
      resetAll: () => dispatch({ type: 'reset' }),
    }),
    [state, addEstimate],
  );

  if (!hydrated) {
    return null;
  }
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used inside AppStoreProvider');
  }
  return ctx;
}
