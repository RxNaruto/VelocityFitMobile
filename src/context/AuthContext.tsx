import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { api, getAuthToken, setAuthToken, setOnUnauthorized } from '@/services/api';
import type { LoginPayload, RegisterPayload, User } from '@/types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  bootstrapping: boolean;
  signIn: (payload: LoginPayload) => Promise<User>;
  signUp: (payload: RegisterPayload) => Promise<User>;
  signOut: (opts?: { silent?: boolean }) => Promise<void>;
  refreshUser: () => Promise<User>;
  updateUser: (patch: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const TOKEN_KEY = 'velocityfit_token';

async function readStoredToken(): Promise<string | null> {
  try {
    return (await SecureStore.getItemAsync(TOKEN_KEY)) || null;
  } catch {
    return null;
  }
}

async function persistToken(token: string | null): Promise<void> {
  try {
    if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    /* storage may be unavailable in some environments */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Seed from the API module so a remount while signed in keeps the token
  // instead of dropping back to null and logging the user out.
  const [token, setToken] = useState<string | null>(() => getAuthToken());
  const [user, setUser] = useState<User | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  const signOut = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) {
      try {
        await api.logout();
      } catch {
        /* ignore — token may already be invalid */
      }
    }
    await persistToken(null);
    setAuthToken(null);
    setToken(null);
    setUser(null);
  }, []);

  // NOTE: deliberately no `useEffect(..., [token])` mirroring the token into
  // the API module. On mount that effect runs with `token === null` and wipes
  // a token that sign-in had just set, sending the first authenticated
  // requests out with no header. Every transition below sets the API token
  // and storage explicitly instead.

  useEffect(() => {
    setOnUnauthorized(() => {
      void signOut({ silent: true });
    });
    return () => setOnUnauthorized(null);
  }, [signOut]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // A token already in memory means this provider remounted mid-session;
      // trust it over storage, which may not have been written yet.
      const stored = getAuthToken() ?? (await readStoredToken());
      if (cancelled) return;

      if (!stored) {
        setBootstrapping(false);
        return;
      }

      setAuthToken(stored);
      setToken(stored);
      void persistToken(stored);

      try {
        const me = await api.me();
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) {
          await persistToken(null);
          setAuthToken(null);
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async ({ username, password }: LoginPayload) => {
    const res = await api.login({ username, password });
    setAuthToken(res.token);
    await persistToken(res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const signUp = useCallback(async (payload: RegisterPayload) => {
    const res = await api.register(payload);
    setAuthToken(res.token);
    await persistToken(res.token);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const refreshUser = useCallback(async () => {
    const me = await api.me();
    setUser(me);
    return me;
  }, []);

  const updateUser = useCallback((patch: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const value: AuthContextValue = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    bootstrapping,
    signIn,
    signUp,
    signOut,
    refreshUser,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
