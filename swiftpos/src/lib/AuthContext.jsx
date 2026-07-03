import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { db } from '@/lib/localDb';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    try {
      const authed = await db.auth.isAuthenticated();
      if (authed) {
        const currentUser = await db.auth.me();
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    checkUserAuth();
  }, [checkUserAuth]);

  const login = async (email, password) => {
    const loggedInUser = await db.auth.loginViaEmailPassword(email, password);
    setUser(loggedInUser);
    setIsAuthenticated(true);
    return loggedInUser;
  };

  const register = async (email, password) => {
    const newUser = await db.auth.register({ email, password });
    setUser(newUser);
    setIsAuthenticated(true);
    return newUser;
  };

  const logout = () => {
    db.auth.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        authChecked,
        login,
        register,
        logout,
        checkUserAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
