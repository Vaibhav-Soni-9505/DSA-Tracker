import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ReactNode } from "react";
import type { AuthUser, AuthResponse } from "@/types/auth";
import { api } from "@/lib/api";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  register: (credentials: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(api.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    api.removeToken();
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    async function restoreSession() {
      const currentToken = api.getToken();
      if (!currentToken) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await api.get<AuthResponse>("/auth/me");
        if (data.success) {
          setUser(data.data.user);
          setToken(currentToken);
        }
      } catch (err: any) {
        if (err?.name === "ApiError" && (err.code === "INVALID_TOKEN" || err.code === "AUTHENTICATION_REQUIRED")) {
          logout();
        } else {
          // Unhandled error (e.g. network error) - still clear loading but leave user logged out to be safe, 
          // or just assume we couldn't restore session properly. We'll clear to be safe based on instructions.
          logout();
        }
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, [logout]);

  const login = async (credentials: any) => {
    const data = await api.post<AuthResponse>("/auth/login", credentials);
    if (data.success && data.data.token) {
      api.setToken(data.data.token);
      setToken(data.data.token);
      setUser(data.data.user);
    }
  };

  const register = async (credentials: any) => {
    const data = await api.post<AuthResponse>("/auth/register", credentials);
    if (data.success && data.data.token) {
      api.setToken(data.data.token);
      setToken(data.data.token);
      setUser(data.data.user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {isLoading ? null : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
