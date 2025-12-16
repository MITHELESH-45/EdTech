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
  login: (email: string, password: string) => { success: boolean; error?: string };
  signup: (email: string, password: string, name: string) => { success: boolean; error?: string };
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

  const login = (email: string, password: string): { success: boolean; error?: string } => {
    const users = getStoredUsers();
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!existingUser) {
      return { success: false, error: "No account found with this email. Please sign up first." };
    }
    
    if (existingUser.password !== password) {
      return { success: false, error: "Incorrect password. Please try again." };
    }
    
    const authUser: AuthUser = {
      userId: existingUser.userId,
      email: existingUser.email,
      name: existingUser.name,
      joinedDate: existingUser.joinedDate,
    };
    
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
    setUser(authUser);
    return { success: true };
  };

  const signup = (email: string, password: string, name: string): { success: boolean; error?: string } => {
    const users = getStoredUsers();
    const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (existingUser) {
      return { success: false, error: "An account with this email already exists. Please login instead." };
    }
    
    const newUser: StoredUser = {
      userId: `user-${Date.now()}`,
      email,
      password,
      name,
      joinedDate: new Date().toISOString(),
    };
    
    saveStoredUsers([...users, newUser]);
    
    const authUser: AuthUser = {
      userId: newUser.userId,
      email: newUser.email,
      name: newUser.name,
      joinedDate: newUser.joinedDate,
    };
    
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
    setUser(authUser);
    return { success: true };
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
