import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';
import i18n from '../i18n.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('urban_store_user') || localStorage.getItem('shopmart_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('urban_store_token') || localStorage.getItem('shopmart_token') || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      api.getProfile()
        .then(data => {
          if (data.user) {
            setUser(data.user);
            localStorage.setItem('urban_store_user', JSON.stringify(data.user));
            if (data.user.preferred_language && data.user.preferred_language !== i18n.language) {
              i18n.changeLanguage(data.user.preferred_language);
            }
          }
        })
        .catch(() => {
          logout();
        });
    }
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await api.login(email, password);
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('urban_store_token', data.token);
      localStorage.setItem('urban_store_user', JSON.stringify(data.user));

      if (data.user.preferred_language) {
        i18n.changeLanguage(data.user.preferred_language);
      }
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const data = await api.register(userData);
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('urban_store_token', data.token);
      localStorage.setItem('urban_store_user', JSON.stringify(data.user));

      if (data.user.preferred_language) {
        i18n.changeLanguage(data.user.preferred_language);
      }
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('urban_store_token');
    localStorage.removeItem('urban_store_user');
    localStorage.removeItem('shopmart_token');
    localStorage.removeItem('shopmart_user');
  };

  const setPreferredLanguage = async (lang) => {
    i18n.changeLanguage(lang);
    if (token && user) {
      try {
        await api.updateLanguage(lang);
        setUser(prev => ({ ...prev, preferred_language: lang }));
      } catch (e) {
        console.warn('Failed to update language on server:', e);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, isAdmin: user?.role === 'admin', login, register, logout, setPreferredLanguage, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
