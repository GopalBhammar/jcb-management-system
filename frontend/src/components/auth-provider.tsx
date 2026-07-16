"use client"

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getCookie, setCookie, deleteCookie } from "@/lib/cookies";
import { apiFetch } from "@/lib/api";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "operator";
  is_active: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchProfile = async () => {
    try {
      const data = await apiFetch<User>("/auth/me");
      setUser(data);
    } catch (err) {
      console.error("Failed to load user profile:", err);
      deleteCookie("token");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = getCookie("token");
    if (token) {
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, []);

  // Redirect handling based on auth state
  useEffect(() => {
    if (isLoading) return;
    
    const token = getCookie("token");
    const isPublicPath = pathname === "/login" || pathname === "/signup" || pathname === "/";
    
    if (!token && !isPublicPath) {
      router.push("/login");
    } else if (token && (pathname === "/login" || pathname === "/signup")) {
      router.push("/dashboard");
    }
  }, [user, isLoading, pathname, router]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    // Clear any stale state before attempting login
    deleteCookie("token");
    setUser(null);
    try {
      const res = await apiFetch<{ access_token: string; token_type: string }>("/auth/login", {
        method: "POST",
        json: { email, password },
      });
      setCookie("token", res.access_token);
      await fetchProfile();
      router.push("/dashboard");
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  const logout = () => {
    deleteCookie("token");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refetchUser: fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
