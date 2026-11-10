async function request<T>(url: string, token: string | null, init: RequestInit = {}): Promise<T> {
  if (!token) throw new Error('Non authentifié');
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || `Erreur ${response.status}`);
  }
  return payload as T;
}

export interface ServerStatus {
  lastHeartbeat: { at: string; onlinePlayers: number; pluginVersion: string | null } | null;
  commands: Record<string, number>;
}
export interface ServerCommand {
  id: number; mc_uuid: string | null; mc_username: string | null; command_text: string; require_online: number;
  source: string; source_id: string | null; status: string; attempts: number; last_error: string | null;
  created_at: string; sent_at: string | null; done_at: string | null;
}
export interface ServerCommandEvent { event: string; detail: string | null; created_at: string }
export interface LedgerEntry {
  id: number; user_id: number; pseudo: string; delta: number; balance_after: number; reason: string; origin: string;
  ref_type: string | null; ref_id: string | null; detail: string | null; created_at: string;
}

type Daily = { day: string; value: number }[];
type Top = { label: string; views: number; visitors: number }[];
export interface StatsData {
  days: number;
  site: { visitors: Daily; views: Daily; pages: Top; referrers: Top; devices: Top; browsers: Top; systems: Top; countries: Top };
  server: {
    now: { at: string; online: number; tps: number; mspt: number; memoryUsedMb: number; memoryMaxMb: number; cpuPercent: number | null; chunks: number; entities: number } | null;
    hourly: { hour: string; online: number; tps: number; mspt: number; memoryMb: number; memoryMaxMb: number; cpu: number | null; chunks: number; entities: number }[];
    uniquePlayers: Daily; newPlayers: Daily; playtimeHours: Daily; sessions: Daily; returningPlayers: Daily;
    /** Par jour d'arrivée : nouveaux joueurs et combien sont revenus (null tant que la fenêtre n'est pas écoulée). */
    retention: { day: string; arrivals: number; firstDayMinutes: number; d1: number | null; d7: number | null; d30: number | null }[];
    retentionRates: { d1: number | null; d7: number | null; d30: number | null };
    snapshot: { at: string; data: Record<string, unknown> } | null;
  };
  business: {
    accounts: Daily; totalAccounts: number; linkedAccounts: number; revenueEuros: Daily; ecusBought: Daily;
    purchases: { label: string; count: number; ecus: number }[]; purchasesByDay: Daily; votes: Daily;
    votesBySite: { label: string; count: number }[];
  };
}

export const adminApi = {
  stats: (token: string | null, days: number) => request<StatsData>(`/api/admin/stats?days=${days}`, token),
  // Serveur Minecraft : état de la liaison, file de commandes, historique, registre des Écus
  serverStatus: (token: string | null) => request<ServerStatus>('/api/admin/server-status', token),
  listServerCommands: (token: string | null, params: { status?: string; player?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set('status', params.status);
    if (params.player) qs.set('player', params.player);
    return request<{ items: ServerCommand[] }>(`/api/admin/server-commands?${qs.toString()}`, token);
  },
  serverCommand: (token: string | null, id: number) =>
    request<{ command: ServerCommand; events: ServerCommandEvent[] }>(`/api/admin/server-commands/${id}`, token),
  serverCommandAction: (token: string | null, id: number, action: 'retry' | 'cancel') =>
    request<{ ok: true }>(`/api/admin/server-commands/${id}/${action}`, token, { method: 'POST' }),
  ledger: (token: string | null, userId?: number) =>
    request<{ items: LedgerEntry[] }>(`/api/admin/ledger${userId ? `?user=${userId}` : ''}`, token),

  // Users
  listUsers: (token: string | null, params: { page?: number; limit?: number; search?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.search) qs.set('search', params.search);
    return request<{ items: AdminUser[]; total: number; page: number; limit: number }>(
      `/api/admin/users?${qs.toString()}`, token
    );
  },
  updateUser: (token: string | null, id: string, body: { role?: 'user' | 'admin'; banned?: boolean; banReason?: string }) =>
    request<AdminUser>(`/api/admin/users/${id}`, token, { method: 'PATCH', body: JSON.stringify(body) }),
  adjustEcus: (token: string | null, id: string, body: { delta: number; reason: string }) =>
    request<{ ok: true; balance: number; delta: number }>(`/api/admin/users/${id}/ecus`, token, {
      method: 'POST', body: JSON.stringify(body),
    }),

  // Products
  listProducts: (token: string | null) =>
    request<{ items: AdminProduct[] }>(`/api/admin/products`, token),
  createProduct: (token: string | null, body: AdminProductInput) =>
    request<{ ok: true; id: number }>(`/api/admin/products`, token, {
      method: 'POST', body: JSON.stringify(body),
    }),
  updateProduct: (token: string | null, id: number, body: Partial<AdminProductInput>) =>
    request<{ ok: true }>(`/api/admin/products/${id}`, token, {
      method: 'PATCH', body: JSON.stringify(body),
    }),
  deleteProduct: (token: string | null, id: number) =>
    request<{ ok: true }>(`/api/admin/products/${id}`, token, { method: 'DELETE' }),

  // Payments
  listPayments: (token: string | null, params: { page?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    return request<{ items: AdminPayment[]; total: number; page: number; limit: number }>(
      `/api/admin/payments?${qs.toString()}`, token
    );
  },

  // Reward jobs
  listRewardJobs: (token: string | null, params: { page?: number; limit?: number; status?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    if (params.status) qs.set('status', params.status);
    return request<{ items: AdminRewardJob[]; total: number; page: number; limit: number }>(
      `/api/admin/reward-jobs?${qs.toString()}`, token
    );
  },
  reopenRewardJob: (token: string | null, id: number) =>
    request<{ ok: true }>(`/api/admin/reward-jobs/${id}/reopen`, token, { method: 'POST' }),
};

export interface AdminUser {
  id: string;
  pseudo: string;
  email: string;
  ecus: number;
  role: 'user' | 'admin';
  bannedAt: string | null;
  bannedReason: string | null;
  createdAt: string;
  lastLogin: string | null;
}

export interface AdminProductInput {
  slug: string;
  name: string;
  description?: string | null;
  category: 'cosmetiques' | 'avantages' | 'kits' | 'grades';
  priceEcus: number;
  imageUrl?: string | null;
  commandTemplate: string;
  isNew?: boolean;
  active?: boolean;
  sortOrder?: number;
}

export interface AdminProduct extends Required<AdminProductInput> {
  id: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPayment {
  id: number;
  stripeSessionId: string;
  userId: string;
  userPseudo: string | null;
  userEmail: string | null;
  mcUsername: string;
  rewardId: string;
  ecusAmount: number;
  amountCents: number;
  currency: string;
  createdAt: string;
}

export interface AdminRewardJob {
  id: number;
  stripeSessionId: string;
  userId: string;
  userPseudo: string | null;
  userEmail: string | null;
  mcUsername: string;
  rewardId: string;
  commandText: string;
  status: string;
  attempts: number;
  lastError: string | null;
  deliveredAt: string | null;
  dailyAttempts: number;
  dailyAttemptsResetAt: string | null;
  requiresManualClaim: boolean;
  createdAt: string;
  updatedAt: string;
}
