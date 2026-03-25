"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

interface User {
  name: string;
  email: string;
  picture: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, isLoading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        const status = await api.checkAuthStatus();
        if (status.authenticated) {
          try {
            const userInfo = await api.getUserInfo();
            if (mounted) setUser(userInfo);
          } catch (e) {
            console.error("Failed to fetch user info", e);
          }
        } else {
          if (mounted) router.push("/login");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        if (mounted) router.push("/login");
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#050505]">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

  // Still render children even if unauthenticated, router.push("/login") will handle the redirect.
  // Wait, if not authenticated and pushing to login, we shouldn't flash the dashboard.
  if (!user) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
