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

export const adminApi = {
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
