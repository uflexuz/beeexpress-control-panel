import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('cp_user');
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    // fake login — accept any credentials
    const u = { id: 1, name: 'Super Admin', email, role: 'superadmin' };
    localStorage.setItem('cp_user', JSON.stringify(u));
    localStorage.setItem('cp_token', 'fake-admin-token');
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem('cp_user');
    localStorage.removeItem('cp_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
