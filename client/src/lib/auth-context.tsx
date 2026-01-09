import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  joinedDate: string;
}

interface StoredUser {
  email: string;
  password: string;
  name: string;
  userId: string;
  joinedDate: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<Pick<AuthUser, "name" | "email">>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AUTH_STORAGE_KEY = "auth_user";
const USERS_STORAGE_KEY = "registered_users";

function getStoredUsers(): StoredUser[] {
  try {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveStoredUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return { success: false, error: data.error || "Login failed" };
      }

      const authUser: AuthUser = {
        userId: data.user.userId,
        email: data.user.email,
        name: data.user.name,
        joinedDate: data.user.joinedDate,
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
      setUser(authUser);
      return { success: true };
    } catch (error) {
      console.error("[AUTH] Login error:", error);
      return { success: false, error: "Network error. Please check your connection." };
    }
  };

  const signup = async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return { success: false, error: data.error || "Signup failed" };
      }

      const authUser: AuthUser = {
        userId: data.user.userId,
        email: data.user.email,
        name: data.user.name,
        joinedDate: data.user.joinedDate,
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
      setUser(authUser);
      return { success: true };
    } catch (error) {
      console.error("[AUTH] Signup error:", error);
      return { success: false, error: "Network error. Please check your connection." };
    }
  };

  const logout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  };

  const updateProfile = (updates: Partial<Pick<AuthUser, "name" | "email">>) => {
    if (user) {
      const updated = { ...user, ...updates };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
      setUser(updated);
      
      const users = getStoredUsers();
      const userIndex = users.findIndex(u => u.userId === user.userId);
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...updates };
        saveStoredUsers(users);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        updateProfile,
      }}
    >
      {children}
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
