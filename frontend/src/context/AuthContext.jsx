import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext(null);

const getStoredUser = () => {
  try {
    const u = localStorage.getItem('ql_user');
    return u ? JSON.parse(u) : null;
  } catch { return null; }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser);
  const [token, setToken] = useState(() => localStorage.getItem('ql_token'));
  const [loading, setLoading] = useState(true);

  const saveAuth = useCallback((tok, usr) => {
    localStorage.setItem('ql_token', tok);
    localStorage.setItem('ql_user', JSON.stringify(usr));
    setToken(tok);
    setUser(usr);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ql_token');
    localStorage.removeItem('ql_user');
    setToken(null);
    setUser(null);
  }, []);

  // Verify token on mount
  useEffect(() => {
    const verify = async () => {
      const storedToken = localStorage.getItem('ql_token');
      if (!storedToken) { setLoading(false); return; }
      try {
        const { data } = await authAPI.me();
        if (data.success) {
          setUser(data.user);
          localStorage.setItem('ql_user', JSON.stringify(data.user));
        } else {
          logout();
        }
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [logout]);

  // Listen for global logout event (401)
  useEffect(() => {
    window.addEventListener('auth:logout', logout);
    return () => window.removeEventListener('auth:logout', logout);
  }, [logout]);

  const isAdmin = user?.role === 'admin';
  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{ user, token, loading, isAdmin, isAuthenticated, saveAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
