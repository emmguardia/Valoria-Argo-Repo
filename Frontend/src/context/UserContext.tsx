import { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface PurchaseRecord {
  productId: number;
  productName: string;
  price: number;
  date: string;
}

export interface UserProfile {
  pseudo: string;
  email: string;
}

interface UserContextType {
  isLoggedIn: boolean;
  ecus: number;
  profile: UserProfile | null;
  purchaseHistory: PurchaseRecord[];
  register: (data: { pseudo: string; email: string; password: string }) => Promise<void>;
  login: (data: { identifier: { pseudo?: string; email?: string }; password: string; rememberMe?: boolean }) => Promise<void>;
  logout: () => void;
  addEcus: (amount: number) => void;
  spendEcus: (amount: number) => boolean;
  addPurchase: (record: PurchaseRecord) => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  deleteAccount: () => void;
}

const UserContext = createContext<UserContextType | null>(null);

const STORAGE_KEY = 'valoria_user';

interface StoredUserState {
  isLoggedIn: boolean;
  token: string | null;
  ecus: number;
  profile: UserProfile | null;
  purchaseHistory: PurchaseRecord[];
}

function readStoredUser(): StoredUserState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {
        isLoggedIn: false,
        token: null,
        ecus: 0,
        profile: null as UserProfile | null,
        purchaseHistory: [] as PurchaseRecord[],
      };
    }

    const data = JSON.parse(stored);
    if (!data?.loggedIn) {
      return {
        isLoggedIn: false,
        token: data?.token ?? null,
        ecus: 0,
        profile: null as UserProfile | null,
        purchaseHistory: [] as PurchaseRecord[],
      };
    }

    return {
      isLoggedIn: true,
      token: data?.token ?? null,
      ecus: data.ecus ?? 0,
      profile: data.profile ?? null,
      purchaseHistory: data.purchaseHistory ?? [],
    };
  } catch {
    return {
      isLoggedIn: false,
      token: null,
      ecus: 0,
      profile: null as UserProfile | null,
      purchaseHistory: [] as PurchaseRecord[],
    };
  }
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const initial: StoredUserState = readStoredUser();
  const [isLoggedIn, setIsLoggedIn] = useState(initial.isLoggedIn);
  const [token, setToken] = useState<string | null>(initial.token);
  const [ecus, setEcus] = useState(initial.ecus);
  const [profile, setProfile] = useState<UserProfile | null>(initial.profile);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseRecord[]>(initial.purchaseHistory);

  const persist = useCallback(
    (loggedIn: boolean, tokenValue: string | null, ecusAmount: number, prof: UserProfile | null, history: PurchaseRecord[]) => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ loggedIn, token: tokenValue, ecus: ecusAmount, profile: prof, purchaseHistory: history })
      );
    },
    []
  );

  const register = useCallback(
    async (data: { pseudo: string; email: string; password: string }) => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pseudo: data.pseudo, email: data.email, password: data.password }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || 'Erreur lors de l’inscription');
      }

      const tokenValue = payload?.token;
      const user = payload?.user;
      if (!tokenValue || !user) throw new Error('Réponse d’inscription invalide');

      const newProfile = { pseudo: String(user.pseudo || ''), email: String(user.email || '') };

      setToken(tokenValue);
      setIsLoggedIn(true);
      setEcus(Number(user.ecus ?? 0));
      setProfile(newProfile);
      setPurchaseHistory([]);
      persist(true, tokenValue, Number(user.ecus ?? 0), newProfile, []);
    },
    [persist]
  );

  const login = useCallback(
    async (data: { identifier: { pseudo?: string; email?: string }; password: string; rememberMe?: boolean }) => {
      const body: {
        pseudo?: string;
        email?: string;
        password: string;
        rememberMe?: boolean;
      } = {
        password: data.password,
        rememberMe: Boolean(data.rememberMe),
      };

      if (data.identifier.pseudo) body.pseudo = data.identifier.pseudo;
      if (data.identifier.email) body.email = data.identifier.email;

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || 'Erreur lors de la connexion');
      }

      const tokenValue = payload?.token;
      const user = payload?.user;
      if (!tokenValue || !user) throw new Error('Réponse de connexion invalide');

      const newProfile = { pseudo: String(user.pseudo || ''), email: String(user.email || '') };

      setToken(tokenValue);
      setIsLoggedIn(true);
      setEcus(Number(user.ecus ?? 0));
      setProfile(newProfile);
      setPurchaseHistory([]);
      persist(true, tokenValue, Number(user.ecus ?? 0), newProfile, []);
    },
    [persist]
  );

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    setEcus(0);
    setProfile(null);
    setPurchaseHistory([]);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const addEcus = useCallback((amount: number) => {
    setEcus((prev) => prev + amount);
  }, []);

  const spendEcus = useCallback(
    (amount: number) => {
      if (ecus < amount) return false;
      setEcus((prev) => prev - amount);
      return true;
    },
    [ecus]
  );

  const addPurchase = useCallback((record: PurchaseRecord) => {
    setPurchaseHistory((prev) => [record, ...prev]);
  }, []);

  const updateProfile = useCallback(
    (data: Partial<UserProfile>) => {
      if (!token) return;

      void fetch('/api/auth/me', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pseudo: data.pseudo,
          email: data.email,
        }),
      })
        .then(async (r) => {
          const payload = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(payload?.error || 'Erreur lors de la mise à jour');

          const newProfile = {
            pseudo: String(payload?.pseudo || ''),
            email: String(payload?.email || ''),
          };

          setProfile(newProfile);
          setEcus(Number(payload?.ecus ?? ecus));
          persist(true, token, Number(payload?.ecus ?? ecus), newProfile, purchaseHistory);
        })
        .catch((err) => {
          window.alert(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
        });
    },
    [token, ecus, persist, purchaseHistory]
  );

  const deleteAccount = useCallback(async () => {
    if (!token) {
      logout();
      return;
    }
    const response = await fetch('/api/auth/me', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      // On n'empêche pas la déconnexion côté UI : c'est plus simple pour l'utilisateur.
      logout();
      return;
    }
    logout();
  }, [logout, token]);

  useEffect(() => {
    if (!isLoggedIn || !token) return;

    // Sync depuis le backend (permet d'avoir le bon solde ECUS).
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        const payload = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(payload?.error || 'Erreur lors du chargement du profil');
        const newProfile = { pseudo: String(payload.pseudo || ''), email: String(payload.email || '') };
        const newEcus = Number(payload.ecus ?? 0);
        setProfile(newProfile);
        setEcus(newEcus);
      })
      .catch(() => {
        // Token expiré ou invalide -> déconnecter
        logout();
      });
  }, [isLoggedIn, token, logout]);

  return (
    <UserContext.Provider
      value={{
        isLoggedIn,
        ecus,
        profile,
        purchaseHistory,
        login,
        register,
        logout,
        addEcus,
        spendEcus,
        addPurchase,
        updateProfile,
        deleteAccount,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
