import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); 
  useEffect(() => {
    const savedToken = localStorage.getItem('sheride_token');
    const savedUser = localStorage.getItem('sheride_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);
  const login = (userData, tokenValue) => {
    localStorage.setItem('sheride_token', tokenValue);
    localStorage.setItem('sheride_user', JSON.stringify(userData));
    setToken(tokenValue);
    setUser(userData);
  };
  const logout = () => {
    localStorage.removeItem('sheride_token');
    localStorage.removeItem('sheride_user');
    setToken(null);
    setUser(null);
  };
  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    localStorage.setItem('sheride_user', JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => useContext(AuthContext);
