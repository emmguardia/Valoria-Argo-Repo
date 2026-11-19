import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';

export interface UserProfile {
  pseudo: string;
  email: string;
  role?: 'user' | 'admin';
  /** Compte Minecraft lié (/lier) ; false : pastille rouge sur le profil pour inviter à le faire */
  linked?: boolean;
  /** Adresse e-mail confirmée (lien reçu à l'inscription) ; obligatoire pour acheter des Écus */
  emailVerified?: boolean;
}

interface UserContextType {
  isLoggedIn: boolean;
  ecus: number;
  profile: UserProfile | null;
  token: string | null;
  register: (data: { pseudo: string; email: string; password: string }) => Promise<void>;
  login: (data: { identifier: { pseudo?: string; email?: string }; password: string; rememberMe?: boolean }) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  /** Supprime le compte (mot de passe redemandé) ; erreur levée si le serveur refuse, la session reste alors ouverte */
  deleteAccount: (password: string) => Promise<void>;
  /** renonceRetractation : case des CGV cochée (livraison immédiate, plus de droit de rétractation) */
  createEcusCheckout: (ecus: number, renonceRetractation: boolean) => Promise<string>;
  confirmEcusCheckout: (sessionId: string) => Promise<{ credited: number; ecus: number; duplicated?: boolean }>;
  refreshUserData: () => Promise<void>;
}

const UserContext = createContext<UserContextType | null>(null);

const STORAGE_KEY = 'valoria_user';

interface StoredUserState {
  isLoggedIn: boolean;
  token: string | null;
  ecus: number;
  profile: UserProfile | null;
}

const LOGGED_OUT: StoredUserState = { isLoggedIn: false, token: null, ecus: 0, profile: null };

function readStoredUser(): StoredUserState {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (!data?.loggedIn) return LOGGED_OUT;
    return { isLoggedIn: true, token: data.token ?? null, ecus: data.ecus ?? 0, profile: data.profile ?? null };
  } catch {
    return LOGGED_OUT;
  }
}

/** Profil tel que renvoyé par l'API (inscription, connexion, /api/auth/me). */
function profileFrom(user: Record<string, unknown> | undefined): UserProfile {
  return {
    pseudo: String(user?.pseudo || ''),
    email: String(user?.email || ''),
    role: user?.role === 'admin' ? 'admin' : 'user',
    linked: Boolean(user?.linked),
    emailVerified: Boolean(user?.emailVerified),
  };
}

/** Erreur d'une requête de l'API, avec son statut HTTP. */
class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

async function api(path: string, init: RequestInit & { token?: string | null } = {}) {
  const { token, ...rest } = init;
  const response = await fetch(path, {
    ...rest,
    headers: {
      ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(payload?.error || `Erreur ${response.status}`, response.status);
  return payload;
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [initial] = useState(readStoredUser);
  const [isLoggedIn, setIsLoggedIn] = useState(initial.isLoggedIn);
  const [token, setToken] = useState<string | null>(initial.token);
  const [ecus, setEcus] = useState(initial.ecus);
  const [profile, setProfile] = useState<UserProfile | null>(initial.profile);

  // Session ouverte ou mise à jour : état et copie dans le navigateur
  const open = useCallback((tokenValue: string, ecusAmount: number, prof: UserProfile) => {
    setToken(tokenValue);
    setIsLoggedIn(true);
    setEcus(ecusAmount);
    setProfile(prof);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ loggedIn: true, token: tokenValue, ecus: ecusAmount, profile: prof }));
    } catch {
      // stockage indisponible (navigation privée) : la session dure le temps de l'onglet
    }
  }, []);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    setEcus(0);
    setProfile(null);
    setToken(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* stockage indisponible */ }
  }, []);

  const refreshUserData = useCallback(async () => {
    if (!token) return;
    const payload = await api('/api/auth/me', { token });
    open(token, Number(payload.ecus ?? 0), profileFrom(payload));
  }, [token, open]);

  const register = useCallback(async (data: { pseudo: string; email: string; password: string }) => {
    const payload = await api('/api/auth/register', { method: 'POST', body: JSON.stringify(data) });
    if (!payload?.token || !payload?.user) throw new Error('Réponse d’inscription invalide');
    open(payload.token, Number(payload.user.ecus ?? 0), profileFrom(payload.user));
  }, [open]);

  const login = useCallback(
    async (data: { identifier: { pseudo?: string; email?: string }; password: string; rememberMe?: boolean }) => {
      const payload = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ ...data.identifier, password: data.password, rememberMe: Boolean(data.rememberMe) }),
      });
      if (!payload?.token || !payload?.user) throw new Error('Réponse de connexion invalide');
      open(payload.token, Number(payload.user.ecus ?? 0), profileFrom(payload.user));
    },
    [open]
  );

  const updateProfile = useCallback(
    (data: Partial<UserProfile>) => {
      if (!token) return;
      api('/api/auth/me', { method: 'PUT', token, body: JSON.stringify({ pseudo: data.pseudo, email: data.email }) })
        .then((payload) => open(token, Number(payload?.ecus ?? 0), profileFrom(payload)))
        .catch((err) => window.alert(err instanceof Error ? err.message : 'Erreur lors de la mise à jour'));
    },
    [token, open]
  );

  const deleteAccount = useCallback(async (password: string) => {
    if (!token) return logout();
    await api('/api/auth/me', { method: 'DELETE', token, body: JSON.stringify({ password }) });
    logout();
  }, [logout, token]);

  const createEcusCheckout = useCallback(
    async (ecusAmount: number, renonceRetractation: boolean) => {
      if (!token) throw new Error('Connecte-toi pour acheter des Écus');
      const payload = await api('/api/payments/create-checkout-session', {
        method: 'POST', token, body: JSON.stringify({ ecus: ecusAmount, renonceRetractation }),
      });
      if (!payload?.url) throw new Error('URL de paiement introuvable');
      return String(payload.url);
    },
    [token]
  );

  const confirmEcusCheckout = useCallback(
    async (sessionId: string) => {
      if (!token) throw new Error('Connecte-toi pour valider le paiement');
      const payload = await api('/api/payments/confirm-checkout-session', { method: 'POST', token, body: JSON.stringify({ sessionId }) });
      const nextEcus = Number(payload?.ecus);
      if (Number.isFinite(nextEcus) && profile) open(token, nextEcus, profile);
      else await refreshUserData();
      return {
        credited: Number(payload?.credited ?? 0),
        ecus: Number.isFinite(nextEcus) ? nextEcus : ecus,
        duplicated: Boolean(payload?.duplicated),
      };
    },
    [token, profile, open, refreshUserData, ecus]
  );

  // Au chargement : solde et profil à jour depuis le serveur. Seul un refus du jeton (401) ou un compte suspendu
  // (403) déconnecte ; une coupure réseau ou une limite de requêtes (429) garde la session.
  useEffect(() => {
    if (!isLoggedIn || !token) return;
    let cancelled = false;
    api('/api/auth/me', { token })
      .then((payload) => { if (!cancelled) open(token, Number(payload.ecus ?? 0), profileFrom(payload)); })
      .catch((err) => { if (!cancelled && err instanceof ApiError && (err.status === 401 || err.status === 403)) logout(); });
    return () => { cancelled = true; };
  }, [isLoggedIn, token, logout, open]);

  const value = useMemo<UserContextType>(() => ({
    isLoggedIn, ecus, profile, token, login, register, logout, updateProfile, deleteAccount,
    createEcusCheckout, confirmEcusCheckout, refreshUserData,
  }), [isLoggedIn, ecus, profile, token, login, register, logout, updateProfile, deleteAccount,
    createEcusCheckout, confirmEcusCheckout, refreshUserData]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
