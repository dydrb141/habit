"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/app/lib/api-client";
import type {
  User,
  Character,
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  PairingRequest,
} from "@/app/types";

interface AuthContextType {
  user: User | null;
  character: Character | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: Omit<RegisterRequest, "role">) => Promise<void>;
  logout: () => void;
  pairWithParent: (pairingCode: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshCharacter: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  /**
   * Fetch current user info
   */
  const refreshUser = async () => {
    try {
      const userData = await apiClient.get<User>("/api/v1/auth/me");
      setUser(userData);
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setUser(null);
    }
  };

  /**
   * Fetch current character info
   */
  const refreshCharacter = async () => {
    try {
      const characterData = await apiClient.get<Character>(
        "/api/v1/character/"
      );
      setCharacter(characterData);
    } catch (error) {
      console.error("Failed to fetch character:", error);
      setCharacter(null);
    }
  };

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    const initAuth = async () => {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        await refreshUser();
        await refreshCharacter();
      } catch (error) {
        console.error("Auth initialization failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Login with email and password
   */
  const login = async (email: string, password: string) => {
    const loginData: LoginRequest = { email, password };
    const response = await apiClient.post<TokenResponse>(
      "/api/v1/auth/login",
      loginData
    );

    apiClient.setToken(response.access_token);

    await refreshUser();
    await refreshCharacter();

    router.push("/dashboard");
  };

  /**
   * Register new child account
   */
  const register = async (data: Omit<RegisterRequest, "role">) => {
    const registerData: RegisterRequest = {
      ...data,
      role: "child",
    };

    await apiClient.post<User>("/api/v1/auth/register", registerData);

    // Auto-login after registration
    await login(data.email, data.password);
  };

  /**
   * Pair with parent using code
   */
  const pairWithParent = async (pairingCode: string) => {
    const pairingData: PairingRequest = { pairing_code: pairingCode };
    await apiClient.post("/api/v1/auth/pairing/pair", pairingData);
  };

  /**
   * Logout and clear session
   */
  const logout = () => {
    apiClient.removeToken();
    setUser(null);
    setCharacter(null);
    router.push("/login");
  };

  const value: AuthContextType = {
    user,
    character,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    pairWithParent,
    refreshUser,
    refreshCharacter,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
