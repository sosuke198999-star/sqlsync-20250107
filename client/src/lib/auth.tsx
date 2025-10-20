import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type UserRole = "general" | "admin";

export type AuthenticatedUser = {
  name: string;
  role: UserRole;
  email: string;
};

export type RegisteredUser = {
  id: string;
  name: string;
  password: string;
  role: UserRole;
  email: string;
};

export type LoginInput = {
  name: string;
  password: string;
  role: UserRole;
};

export type RegisterUserInput = {
  name: string;
  password: string;
  role: UserRole;
  email: string;
};

export type UpdateUserInput = {
  id: string;
  name: string;
  role: UserRole;
  password?: string;
  email: string;
};

type AuthContextValue = {
  user: AuthenticatedUser | null;
  users: RegisteredUser[];
  login: (input: LoginInput) => AuthenticatedUser;
  logout: () => void;
  registerUser: (input: RegisterUserInput) => RegisteredUser;
  updateUser: (input: UpdateUserInput) => RegisteredUser;
};

const storageKey = "sqlsync:auth-user";
const usersStorageKey = "sqlsync:auth-users";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const defaultUsers: RegisteredUser[] = [
  {
    id: "default-admin",
    name: "admin",
    password: "admin123",
    role: "admin",
    email: "admin@example.com",
  },
];

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const getInitialUser = (): AuthenticatedUser | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<AuthenticatedUser> | null;
    if (!parsed) return null;
    return {
      name: parsed.name ?? "",
      role: parsed.role ?? "general",
      email: parsed.email ?? "",
    };
  } catch {
    return null;
  }
};

const getInitialUsers = (): RegisteredUser[] => {
  if (typeof window === "undefined") {
    return defaultUsers;
  }

  try {
    const raw = window.localStorage.getItem(usersStorageKey);
    if (!raw) {
      return defaultUsers;
    }

    const parsed = JSON.parse(raw) as Partial<RegisteredUser>[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return defaultUsers;
    }

    return parsed
      .filter(Boolean)
      .map((entry) => ({
        id: entry.id ?? generateId(),
        name: entry.name ?? "",
        password: entry.password ?? "",
        role: entry.role ?? "general",
        email: entry.email ?? "",
      }));
  } catch {
    return defaultUsers;
  }
};

const generateId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `user-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(getInitialUser);
  const [users, setUsers] = useState<RegisteredUser[]>(getInitialUsers);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(usersStorageKey, JSON.stringify(users));
  }, [users]);

  const login = useCallback(
    (input: LoginInput) => {
      const trimmedName = input.name.trim();
      const trimmedPassword = input.password.trim();

      const matched = users.find(
        (candidate) =>
          candidate.name === trimmedName &&
          candidate.password === trimmedPassword &&
          candidate.role === input.role,
      );

      if (!matched) {
        throw new Error("INVALID_CREDENTIALS");
      }

      const authenticated: AuthenticatedUser = {
        name: matched.name,
        role: matched.role,
        email: matched.email,
      };

      setUser(authenticated);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(storageKey, JSON.stringify(authenticated));
      }

      return authenticated;
    },
    [users],
  );

  const registerUser = useCallback((input: RegisterUserInput) => {
    const trimmedName = input.name.trim();
    if (!trimmedName) {
      throw new Error("NAME_REQUIRED");
    }

    const trimmedEmail = input.email.trim();
    if (!trimmedEmail) {
      throw new Error("EMAIL_REQUIRED");
    }

    const normalizedEmail = trimmedEmail.toLowerCase();
    if (!emailPattern.test(normalizedEmail)) {
      throw new Error("INVALID_EMAIL");
    }

    const trimmedPassword = input.password.trim();
    if (!trimmedPassword) {
      throw new Error("PASSWORD_REQUIRED");
    }

    if (trimmedPassword.length < 6) {
      throw new Error("PASSWORD_TOO_SHORT");
    }

    let createdUser: RegisteredUser | null = null;

    setUsers((prev) => {
      if (prev.some((item) => item.name === trimmedName)) {
        throw new Error("DUPLICATE_USER");
      }

      if (
        prev.some(
          (item) => item.email.toLowerCase() === normalizedEmail,
        )
      ) {
        throw new Error("DUPLICATE_EMAIL");
      }

      createdUser = {
        id: generateId(),
        name: trimmedName,
        password: trimmedPassword,
        role: input.role,
        email: normalizedEmail,
      };

      return [...prev, createdUser];
    });

    if (!createdUser) {
      throw new Error("UNKNOWN_ERROR");
    }

    return createdUser;
  }, []);

  const updateUser = useCallback(
    (input: UpdateUserInput) => {
      const trimmedName = input.name.trim();
      if (!trimmedName) {
        throw new Error("NAME_REQUIRED");
      }

      const trimmedEmail = input.email.trim();
      if (!trimmedEmail) {
        throw new Error("EMAIL_REQUIRED");
      }
      const normalizedEmail = trimmedEmail.toLowerCase();
      if (!emailPattern.test(normalizedEmail)) {
        throw new Error("INVALID_EMAIL");
      }

      const providedPassword = input.password;
      const trimmedPassword = providedPassword?.trim() ?? "";

      if (providedPassword !== undefined && trimmedPassword.length === 0) {
        throw new Error("PASSWORD_REQUIRED");
      }

      if (trimmedPassword && trimmedPassword.length < 6) {
        throw new Error("PASSWORD_TOO_SHORT");
      }

      let updatedUser: RegisteredUser | null = null;
      let previousUser: RegisteredUser | null = null;

      setUsers((prev) => {
        const index = prev.findIndex((item) => item.id === input.id);
        if (index === -1) {
          throw new Error("USER_NOT_FOUND");
        }

        if (prev.some((item, idx) => idx !== index && item.name === trimmedName)) {
          throw new Error("DUPLICATE_USER");
        }
        if (
          prev.some(
            (item, idx) =>
              idx !== index && item.email.toLowerCase() === normalizedEmail,
          )
        ) {
          throw new Error("DUPLICATE_EMAIL");
        }

        const current = prev[index];
        previousUser = current;

        updatedUser = {
          ...current,
          name: trimmedName,
          role: input.role,
          password: trimmedPassword ? trimmedPassword : current.password,
          email: normalizedEmail,
        };

        const next = [...prev];
        next[index] = updatedUser;
        return next;
      });

      if (!updatedUser) {
        throw new Error("UNKNOWN_ERROR");
      }

      if (previousUser) {
        setUser((currentUser) => {
          if (
            currentUser &&
            currentUser.name === previousUser!.name &&
            currentUser.role === previousUser!.role
          ) {
            const nextUser: AuthenticatedUser = {
              name: updatedUser!.name,
              role: updatedUser!.role,
              email: updatedUser!.email,
            };
            if (typeof window !== "undefined") {
              window.localStorage.setItem(storageKey, JSON.stringify(nextUser));
            }
            return nextUser;
          }
          return currentUser;
        });
      }

      return updatedUser;
    },
    [],
  );

  const logout = useCallback(() => {
    setUser(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    const stillExists = users.some(
      (item) => item.name === user.name && item.role === user.role,
    );

    if (!stillExists) {
      logout();
    }
  }, [user, users, logout]);

  const value = useMemo(
    () => ({
      user,
      users,
      login,
      logout,
      registerUser,
      updateUser,
    }),
    [user, users, login, logout, registerUser, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
