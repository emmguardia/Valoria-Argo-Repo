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
  login: (ecus?: number, profile?: Partial<UserProfile>) => void;
  logout: () => void;
  addEcus: (amount: number) => void;
  spendEcus: (amount: number) => boolean;
  addPurchase: (record: PurchaseRecord) => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  deleteAccount: () => void;
}

const UserContext = createContext<UserContextType | null>(null);

const STORAGE_KEY = 'valoria_user';

const defaultProfile: UserProfile = { pseudo: '', email: '' };

interface StoredUserState {
  isLoggedIn: boolean;
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
        ecus: 0,
        profile: null as UserProfile | null,
        purchaseHistory: [] as PurchaseRecord[],
      };
    }

    const data = JSON.parse(stored);
    if (!data?.loggedIn) {
      return {
        isLoggedIn: false,
        ecus: 0,
        profile: null as UserProfile | null,
        purchaseHistory: [] as PurchaseRecord[],
      };
    }

    return {
      isLoggedIn: true,
      ecus: data.ecus ?? 0,
      profile: data.profile ?? null,
      purchaseHistory: data.purchaseHistory ?? [],
    };
  } catch {
    return {
      isLoggedIn: false,
      ecus: 0,
      profile: null as UserProfile | null,
      purchaseHistory: [] as PurchaseRecord[],
    };
  }
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const initial: StoredUserState = readStoredUser();
  const [isLoggedIn, setIsLoggedIn] = useState(initial.isLoggedIn);
  const [ecus, setEcus] = useState(initial.ecus);
  const [profile, setProfile] = useState<UserProfile | null>(initial.profile);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseRecord[]>(initial.purchaseHistory);

  const persist = useCallback(
    (loggedIn: boolean, ecusAmount: number, prof: UserProfile | null, history: PurchaseRecord[]) => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ loggedIn, ecus: ecusAmount, profile: prof, purchaseHistory: history })
      );
    },
    []
  );

  const login = useCallback(
    (initialEcus = 150, prof?: Partial<UserProfile>) => {
      setIsLoggedIn(true);
      setEcus(initialEcus);
      const newProfile = prof ? { ...defaultProfile, ...prof } : defaultProfile;
      setProfile(newProfile);
      setPurchaseHistory([]);
      persist(true, initialEcus, newProfile, []);
    },
    [persist]
  );

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    setEcus(0);
    setProfile(null);
    setPurchaseHistory([]);
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

  const updateProfile = useCallback((data: Partial<UserProfile>) => {
    setProfile((prev) => (prev ? { ...prev, ...data } : { ...defaultProfile, ...data }));
  }, []);

  const deleteAccount = useCallback(() => {
    logout();
  }, [logout]);

  useEffect(() => {
    if (isLoggedIn) persist(true, ecus, profile, purchaseHistory);
  }, [isLoggedIn, ecus, profile, purchaseHistory, persist]);

  return (
    <UserContext.Provider
      value={{
        isLoggedIn,
        ecus,
        profile,
        purchaseHistory,
        login,
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
