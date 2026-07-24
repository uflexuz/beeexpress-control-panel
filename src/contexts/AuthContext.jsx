import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  auth as authApi,
  setUnauthorizedHandler,
  setToken,
  getToken,
} from '../lib/api';

/**
 * Bee Express — Control Panel autentifikatsiya konteksti (real API).
 *
 * - Kirish: POST /auth/login {phone, password, role:'admin'} (api.js token'ni
 *   avtomatik `localStorage['cp_token']` ga yozadi).
 * - Foydalanuvchi profili `localStorage['cp_user']` da keshlanadi.
 * - Sahifa yangilanganda token bo'lsa /user/profile orqali sessiya tekshiriladi.
 * - 401 (sessiya tugagan) — api qatlamining unauthorized handleri lokal holatni
 *   tozalaydi, route guard esa /login ga yo'naltiradi.
 */

const USER_KEY = 'cp_user';
const AuthContext = createContext(null);

/** Keshdan foydalanuvchini o'qiydi (buzuq JSON — null). */
function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStoredUser(user) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch {
    /* localStorage mavjud emas — e'tiborsiz */
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStoredUser());
  const [loading, setLoading] = useState(true);

  /** Lokal sessiyani tozalaydi (token allaqachon api tomonidan tozalangan). */
  const clearSession = useCallback(() => {
    writeStoredUser(null);
    setUser(null);
  }, []);

  // 401 handler: server sessiyasi tugadi -> lokal holatni tozalaymiz.
  // Guard (App.jsx) user=null bo'lgach /login ga yo'naltiradi.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      writeStoredUser(null);
      setUser(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // Mount: token bo'lsa profil orqali sessiyani tasdiqlaymiz.
  useEffect(() => {
    let alive = true;
    const token = getToken();

    if (!token) {
      // Token yo'q -> kesh-user ham bo'lmasin.
      writeStoredUser(null);
      setUser(null);
      setLoading(false);
      return undefined;
    }

    (async () => {
      try {
        const profile = await authApi.me();
        if (!alive) return;
        if (profile && (profile.id || profile.uuid)) {
          const merged = { ...readStoredUser(), ...profile };
          writeStoredUser(merged);
          setUser(merged);
        }
      } catch {
        // 401 -> api handleri tozaladi. Boshqa xato (tarmoq) -> keshni saqlaymiz.
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  /**
   * Telefon + parol bilan kirish. role:'admin' kontekstda yuboriladi.
   * @param {string} phone `+998...` formatida
   * @param {string} password
   * @returns {Promise<object|null>} kirgan foydalanuvchi
   * @throws {ApiError|Error} 401 noto'g'ri, 403 bloklangan, yoki admin emas.
   */
  const login = useCallback(async (phone, password) => {
    const data = await authApi.login({ phone, password, role: 'admin' });
    // Javobda user bo'lmasa (defensiv) profil orqali olamiz.
    let u = data && data.user ? data.user : null;
    if (!u) {
      try {
        u = await authApi.me();
      } catch {
        u = null;
      }
    }

    // Faqat administrator kira oladi (rol serverdan kelsa tekshiramiz).
    if (u && u.role && u.role !== 'admin') {
      setToken(null);
      writeStoredUser(null);
      setUser(null);
      throw new Error('Bu panelga faqat administrator kira oladi.');
    }

    if (u) {
      writeStoredUser(u);
      setUser(u);
    }
    return u;
  }, []);

  /** Chiqish: serverga xabar beradi va lokal holatni tozalaydi. */
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* tarmoq xatosi bo'lsa ham lokal chiqamiz */
    }
    clearSession();
  }, [clearSession]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
