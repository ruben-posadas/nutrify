import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentUser, login as apiLogin, logout as apiLogout, signup as apiSignup } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  async function refreshSession() {
    try {
      const data = await getCurrentUser();
      setUser(data.user);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refreshSession();
  }, []);

  async function login(credentials) {
    const data = await apiLogin(credentials);
    setUser(data.user);
    return data;
  }

  async function signup(payload) {
    const data = await apiSignup(payload);
    setUser(data.user);
    return data;
  }

  async function logout() {
    await apiLogout();
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      signup,
      logout,
      refreshSession,
    }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
