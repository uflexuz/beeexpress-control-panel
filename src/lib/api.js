const BASE = import.meta.env.VITE_API_URL || '';

async function request(path, options = {}) {
  const token = localStorage.getItem('cp_token');
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (res.status === 401) {
    localStorage.removeItem('cp_token');
    window.location.href = '/login';
    return;
  }
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

const api = {
  auth: {
    login: (data) => request('/api/admin/login', { method: 'POST', body: JSON.stringify(data) }),
    me: () => request('/api/admin/me'),
  },
  dashboard: {
    stats: () => request('/api/admin/dashboard/stats'),
    chart: (period) => request(`/api/admin/dashboard/chart?period=${period}`),
  },
  restaurants: {
    list: (params) => request(`/api/admin/restaurants?${new URLSearchParams(params)}`),
    get: (id) => request(`/api/admin/restaurants/${id}`),
    approve: (id) => request(`/api/admin/restaurants/${id}/approve`, { method: 'POST' }),
    suspend: (id) => request(`/api/admin/restaurants/${id}/suspend`, { method: 'POST' }),
    activate: (id) => request(`/api/admin/restaurants/${id}/activate`, { method: 'POST' }),
    update: (id, data) => request(`/api/admin/restaurants/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  orders: {
    list: (params) => request(`/api/admin/orders?${new URLSearchParams(params)}`),
    get: (id) => request(`/api/admin/orders/${id}`),
    cancel: (id) => request(`/api/admin/orders/${id}/cancel`, { method: 'POST' }),
  },
  users: {
    list: (params) => request(`/api/admin/users?${new URLSearchParams(params)}`),
    get: (id) => request(`/api/admin/users/${id}`),
    block: (id) => request(`/api/admin/users/${id}/block`, { method: 'POST' }),
    unblock: (id) => request(`/api/admin/users/${id}/unblock`, { method: 'POST' }),
  },
  couriers: {
    list: (params) => request(`/api/admin/couriers?${new URLSearchParams(params)}`),
    get: (id) => request(`/api/admin/couriers/${id}`),
    block: (id) => request(`/api/admin/couriers/${id}/block`, { method: 'POST' }),
  },
  finance: {
    summary: (period) => request(`/api/admin/finance/summary?period=${period}`),
    payouts: () => request('/api/admin/finance/payouts'),
    payout: (id, data) => request(`/api/admin/finance/payouts/${id}`, { method: 'POST', body: JSON.stringify(data) }),
  },
  settings: {
    get: () => request('/api/admin/settings'),
    update: (data) => request('/api/admin/settings', { method: 'PUT', body: JSON.stringify(data) }),
  },
};

export default api;
