/**
 * Bee Express — Control Panel API klienti (admin).
 *
 * Real, jonli server bilan ishlaydi:
 *   Base: https://beee-express.firstcoder.uz/api/v1
 *   Auth: Sanctum Bearer token (localStorage['cp_token']).
 *   Xato javobi: { message: "..." } (o'zbekcha), ro'yxatlar: { data:[...], meta:{page,limit,total} }.
 *
 * Konfiguratsiya: {@link API_BASE_URL}, {@link USE_FAKE_DATA}.
 * Token mexanizmi: {@link setTokenGetter}, {@link setToken}, {@link getToken}.
 * 401 (sessiya tugagan) uchun: {@link setUnauthorizedHandler}.
 */

import {
  FAKE_RESTAURANTS,
  FAKE_ALL_ORDERS,
  FAKE_USERS,
  FAKE_PAYOUTS,
} from './fakeData';

// ---------------------------------------------------------------------------
// Konfiguratsiya
// ---------------------------------------------------------------------------

/** Real API bazaviy manzili. */
export const API_BASE_URL = 'https://beee-express.firstcoder.uz/api/v1';

/**
 * Fake (soxta) ma'lumot rejimi. Default `false` — real serverga ulanadi.
 * `export let` bo'lgani uchun {@link setUseFakeData} orqali almashtirilsa,
 * import qilgan modullarda ham qiymat yangilanadi.
 */
export let USE_FAKE_DATA = false;

/**
 * Fake ma'lumot rejimini yoqish/o'chirish (offline demo / test uchun).
 * @param {boolean} value
 */
export function setUseFakeData(value) {
  USE_FAKE_DATA = !!value;
}

/** localStorage'dagi token kaliti. AuthContext ham shu kalitni ishlatadi. */
export const TOKEN_KEY = 'cp_token';

// ---------------------------------------------------------------------------
// Token / auth-holat mexanizmi (SAQLANGAN: setTokenGetter)
// ---------------------------------------------------------------------------

/** @type {() => (string|null)} */
let tokenGetter = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

/**
 * Bearer token qaytaruvchi funksiyani almashtiradi. Default holatda
 * `localStorage['cp_token']` o'qiladi. Testlarda yoki maxsus xotira uchun
 * boshqa manba ulash imkonini beradi.
 * @param {() => (string|null)} fn
 */
export function setTokenGetter(fn) {
  if (typeof fn === 'function') tokenGetter = fn;
}

/** Joriy Bearer tokenni qaytaradi (getter orqali). @returns {string|null} */
export function getToken() {
  return tokenGetter();
}

/**
 * Tokenni localStorage'ga yozadi yoki (bo'sh qiymatda) o'chiradi.
 * @param {string|null|undefined} token
 */
export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* localStorage mavjud emas — e'tiborsiz qoldiramiz */
  }
}

/** @type {null | (() => void)} */
let onUnauthorized = null;

/**
 * Sessiya tugaganda (401, `skipAuthRedirect` berilmagan so'rovlarda) chaqiriladigan
 * handler. Odatda AuthContext buni /login'ga yo'naltirish uchun o'rnatadi.
 * @param {(() => void)|null} fn
 */
export function setUnauthorizedHandler(fn) {
  onUnauthorized = typeof fn === 'function' ? fn : null;
}

// ---------------------------------------------------------------------------
// Xato turi
// ---------------------------------------------------------------------------

/**
 * API xatosi. `message` — serverdan kelgan o'zbekcha matn (yoki fallback),
 * `status` — HTTP kodi, `data` — javobning to'liq tanasi (bor bo'lsa).
 */
export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {number} [status]
   * @param {*} [data]
   */
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// ---------------------------------------------------------------------------
// So'rov yordamchilari
// ---------------------------------------------------------------------------

/**
 * Query-string quradi. `null`/`undefined`/`''` qiymatlar tashlab yuboriladi.
 * @param {Record<string, any>} [params]
 * @returns {string} `''` yoki `?a=1&b=2`
 */
function buildQuery(params) {
  if (!params) return '';
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      usp.append(key, String(value));
    }
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Asosiy so'rov funksiyasi.
 * - Bearer tokenni ({@link getToken}) qo'shadi.
 * - `Accept: application/json` va (tana bor bo'lsa) `Content-Type: application/json`.
 * - Xatoda {@link ApiError}(message, status, data) tashlaydi.
 * - 401 (va `skipAuthRedirect` false) bo'lsa tokenni tozalab, unauthorized handlerni chaqiradi.
 * - Javob JSON bo'lmasa (masalan Laravel 404 HTML sahifasi) — defensiv parse.
 *
 * @param {string} path `/admin/users` kabi nisbiy yo'l.
 * @param {object} [options]
 * @param {string} [options.method='GET']
 * @param {*} [options.body] JSON'ga o'giriladi (agar string bo'lmasa).
 * @param {Record<string,string>} [options.headers]
 * @param {Record<string,any>} [options.query] Query paramlar.
 * @param {boolean} [options.skipAuthRedirect=false] 401'da handlerni chaqirmaslik (login/register uchun).
 * @returns {Promise<any>} Javob tanasi (JSON) yoki bo'sh javobda `null`.
 */
async function request(path, options = {}) {
  const {
    method = 'GET',
    body,
    headers,
    query,
    skipAuthRedirect = false,
    ...rest
  } = options;

  const hasBody = body !== undefined && body !== null;
  const token = getToken();
  const url = `${API_BASE_URL}${path}${buildQuery(query)}`;

  let res;
  try {
    res = await fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      ...(hasBody
        ? { body: typeof body === 'string' ? body : JSON.stringify(body) }
        : {}),
      ...rest,
    });
  } catch (networkErr) {
    // Tarmoq uzilishi / CORS / DNS — status yo'q.
    throw new ApiError(
      'Server bilan bog\'lanib bo\'lmadi. Internetni tekshiring.',
      0,
      { cause: String(networkErr && networkErr.message ? networkErr.message : networkErr) },
    );
  }

  // Tanani xavfsiz o'qish (bo'sh javob yoki JSON bo'lmagan HTML holati uchun).
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (res.status === 401 && !skipAuthRedirect) {
    setToken(null);
    if (onUnauthorized) onUnauthorized();
  }

  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && data.message) ||
      res.statusText ||
      `HTTP ${res.status}`;
    throw new ApiError(message, res.status, data);
  }

  return data;
}

// ---------------------------------------------------------------------------
// Fake fallback yordamchilari (default o'chiq)
// ---------------------------------------------------------------------------

/**
 * Massivni real API ro'yxat shakliga (`{data, meta}`) o'raydi.
 * @param {any[]} arr
 */
function fakeList(arr) {
  const list = Array.isArray(arr) ? arr : [];
  return Promise.resolve({
    data: list,
    meta: { page: 1, limit: list.length, total: list.length },
  });
}

/** Mutatsiyalar uchun soxta muvaffaqiyat javobi. */
function fakeOk(extra = {}) {
  return Promise.resolve({ message: 'ok', ...extra });
}

// ---------------------------------------------------------------------------
// AUTH
// ---------------------------------------------------------------------------

const auth = {
  /**
   * Admin (yoki boshqa rol) sifatida kirish.
   * Muvaffaqiyatda tokenni avtomatik localStorage'ga yozadi.
   * @param {{phone:string, password:string, role?:('client'|'owner'|'seller'|'courier'|'admin')}} credentials
   * @returns {Promise<{access_token:string, token_type:string, user:object}>}
   * @throws {ApiError} 401 — telefon/parol noto'g'ri; 403 — bloklangan.
   */
  async login(credentials) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: credentials,
      skipAuthRedirect: true,
    });
    if (data && data.access_token) setToken(data.access_token);
    return data;
  },

  /**
   * Yangi client ro'yxatdan o'tkazish (faqat client roli, token beriladi).
   * @param {{phone:string, password:string, name:string}} payload password min 8 belgidan.
   * @returns {Promise<{access_token:string, token_type:string, user:object}>}
   */
  async register(payload) {
    const data = await request('/auth/register', {
      method: 'POST',
      body: payload,
      skipAuthRedirect: true,
    });
    if (data && data.access_token) setToken(data.access_token);
    return data;
  },

  /**
   * Chiqish. Serverga xabar beradi va tokenni har holda tozalaydi.
   * @returns {Promise<any>}
   */
  async logout() {
    try {
      return await request('/auth/logout', { method: 'POST', skipAuthRedirect: true });
    } finally {
      setToken(null);
    }
  },

  /**
   * Joriy foydalanuvchi profili.
   * @returns {Promise<object>} User
   */
  me() {
    return request('/user/profile');
  },

  /**
   * Profilni yangilash.
   * @param {{name?:string, email?:string}} payload
   * @returns {Promise<object>}
   */
  updateProfile(payload) {
    return request('/user/profile', { method: 'PUT', body: payload });
  },
};

// ---------------------------------------------------------------------------
// ADMIN
// ---------------------------------------------------------------------------

const admin = {
  /**
   * Foydalanuvchilar ro'yxati.
   * @param {{page?:number, limit?:number, search?:string, role?:string, status?:string}} [params]
   * @returns {Promise<{data:object[], meta:{page:number,limit:number,total:number}}>}
   */
  users(params) {
    if (USE_FAKE_DATA) return fakeList(FAKE_USERS);
    return request('/admin/users', { query: params });
  },

  /**
   * Restoranlar (vendor) ro'yxati.
   * @param {{page?:number, limit?:number, search?:string, is_active?:boolean}} [params]
   * @returns {Promise<{data:object[], meta:{page:number,limit:number,total:number}}>}
   */
  restaurants(params) {
    if (USE_FAKE_DATA) return fakeList(FAKE_RESTAURANTS);
    return request('/admin/restaurants', { query: params });
  },

  /**
   * Buyurtmalar ro'yxati.
   * @param {{page?:number, limit?:number, status?:string, vendor_id?:number, user_id?:number}} [params]
   * @returns {Promise<{data:object[], meta:{page:number,limit:number,total:number}}>}
   */
  orders(params) {
    if (USE_FAKE_DATA) return fakeList(FAKE_ALL_ORDERS);
    return request('/admin/orders', { query: params });
  },

  /**
   * To'lovlar ro'yxati.
   * @param {{page?:number, limit?:number, status?:string}} [params]
   * @returns {Promise<{data:object[], meta:{page:number,limit:number,total:number}}>}
   */
  payments(params) {
    if (USE_FAKE_DATA) return fakeList(FAKE_PAYOUTS);
    return request('/admin/payments', { query: params });
  },

  /**
   * Audit (harakatlar) jurnali.
   * @param {{page?:number, limit?:number}} [params]
   * @returns {Promise<{data:object[], meta:{page:number,limit:number,total:number}}>}
   */
  audits(params) {
    if (USE_FAKE_DATA) return fakeList([]);
    return request('/admin/audits', { query: params });
  },

  /**
   * Vendor hamyonini to'ldirish (top-up).
   * @param {number|string} vendorId
   * @param {{amount:number, note?:string}} payload
   * @returns {Promise<any>}
   */
  vendorTopup(vendorId, payload) {
    if (USE_FAKE_DATA) return fakeOk();
    return request(`/admin/vendor/${vendorId}/topup`, { method: 'POST', body: payload });
  },

  /**
   * Vendorni bloklash.
   * @param {number|string} vendorId
   * @returns {Promise<any>}
   */
  vendorBlock(vendorId) {
    if (USE_FAKE_DATA) return fakeOk();
    return request(`/admin/vendor/${vendorId}/block`, { method: 'POST' });
  },

  /**
   * Vendor blokini olib tashlash.
   * @param {number|string} vendorId
   * @returns {Promise<any>}
   */
  vendorUnblock(vendorId) {
    if (USE_FAKE_DATA) return fakeOk();
    return request(`/admin/vendor/${vendorId}/unblock`, { method: 'POST' });
  },

  /**
   * Vendor komissiya foizini o'rnatish.
   * @param {number|string} vendorId
   * @param {{commission_percent:number}} payload
   * @returns {Promise<any>}
   */
  setCommission(vendorId, payload) {
    if (USE_FAKE_DATA) return fakeOk();
    return request(`/admin/vendor/${vendorId}/commission`, { method: 'POST', body: payload });
  },

  /**
   * Buyurtma statusini majburiy o'zgartirish.
   * @param {number|string} orderId
   * @param {{status:string, note?:string}} payload
   * @returns {Promise<any>}
   */
  setOrderStatus(orderId, payload) {
    if (USE_FAKE_DATA) return fakeOk();
    return request(`/admin/order/${orderId}/status`, { method: 'POST', body: payload });
  },

  /**
   * Foydalanuvchi hamyoniga refund (qaytarish).
   * @param {{user_id:number|string, amount:number, order_id?:number|string, note?:string}} payload
   * @returns {Promise<any>}
   */
  walletRefund(payload) {
    if (USE_FAKE_DATA) return fakeOk();
    return request('/admin/wallet/refund', { method: 'POST', body: payload });
  },
};

// ---------------------------------------------------------------------------
// Katalog (public, name-resolution uchun foydali)
// ---------------------------------------------------------------------------

const catalog = {
  /**
   * Bitta restoran (vendor) tafsiloti — public endpoint.
   * Buyurtma/audit qatorlarida `vendor_id`dan nom aniqlash uchun ishlatiladi.
   * @param {number|string} id
   * @returns {Promise<object>} Vendor
   */
  restaurant(id) {
    return request(`/restaurant/${id}`);
  },

  /**
   * Public restoranlar ro'yxati (authsiz).
   * @param {{limit?:number, category_id?:number}} [params]
   * @returns {Promise<{data:object[], meta:object}>}
   */
  restaurants(params) {
    return request('/restaurants', { query: params });
  },

  /**
   * Kategoriyalar.
   * @param {{type?:string}} [params]
   * @returns {Promise<{data:object[]}>}
   */
  categories(params) {
    return request('/categories', { query: params });
  },
};

// ---------------------------------------------------------------------------
// Backward-compat aliaslar (eski api.js guruh nomlari)
// ---------------------------------------------------------------------------

/** @deprecated Yangi kodda `admin.restaurants` / `admin.vendor*` ni ishlating. */
const restaurants = {
  list: (params) => admin.restaurants(params),
  get: (id) => catalog.restaurant(id),
  block: (id) => admin.vendorBlock(id),
  unblock: (id) => admin.vendorUnblock(id),
  // Real API'da "approve/suspend/activate" YO'Q — eng yaqin block/unblock'ga xaritalanadi.
  suspend: (id) => admin.vendorBlock(id),
  activate: (id) => admin.vendorUnblock(id),
  approve: (id) => admin.vendorUnblock(id),
  commission: (id, data) => admin.setCommission(id, data),
  topup: (id, data) => admin.vendorTopup(id, data),
};

/** @deprecated Yangi kodda `admin.orders` / `admin.setOrderStatus` ni ishlating. */
const orders = {
  list: (params) => admin.orders(params),
  setStatus: (id, data) => admin.setOrderStatus(id, data),
  cancel: (id, note) => admin.setOrderStatus(id, { status: 'cancelled', note }),
};

/** @deprecated Yangi kodda `admin.users` ni ishlating. */
const users = {
  list: (params) => admin.users(params),
};

/** @deprecated Yangi kodda `admin.payments` / `admin.walletRefund` ni ishlating. */
const finance = {
  payments: (params) => admin.payments(params),
  payouts: (params) => admin.payments(params),
  refund: (data) => admin.walletRefund(data),
};

// ---------------------------------------------------------------------------
// Eksport
// ---------------------------------------------------------------------------

const api = {
  auth,
  admin,
  catalog,
  // compat guruhlari
  restaurants,
  orders,
  users,
  finance,
  // past darajali yordamchilar (kerak bo'lsa)
  request,
};

export { api, request, auth, admin, catalog };
export default api;
