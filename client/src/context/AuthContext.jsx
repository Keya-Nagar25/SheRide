// src/context/AuthContext.js
// Think of this as a "global variable" for who is logged in
// Any component in the app can read the current user from here

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // true while we check localStorage

  // On app load, check if user was already logged in
  useEffect(() => {
    const savedToken = localStorage.getItem('sheride_token');
    const savedUser = localStorage.getItem('sheride_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Call this after successful login/register
  const login = (userData, tokenValue) => {
    localStorage.setItem('sheride_token', tokenValue);
    localStorage.setItem('sheride_user', JSON.stringify(userData));
    setToken(tokenValue);
    setUser(userData);
  };

  // Call this to log out
  const logout = () => {
    localStorage.removeItem('sheride_token');
    localStorage.removeItem('sheride_user');
    setToken(null);
    setUser(null);
  };

  // Update user data (e.g., after verification status changes)
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

// Custom hook - use this in any component: const { user } = useAuth();
export const useAuth = () => useContext(AuthContext);
