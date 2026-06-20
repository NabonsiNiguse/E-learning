/**
 * AuthContext — cookie-based JWT authentication.
 *
 * Security changes vs. previous version
 * ───────────────────────────────────────
 * • setTokens / localStorage is NEVER called here.  The server sets
 *   httpOnly cookies; the browser sends them automatically on every request.
 * • We keep the `user` object in React state for UI purposes only.
 * • The refresh token is handled server-side by the /auth/token/refresh/
 *   endpoint which reads the httpOnly cookie.
 * • clearTokens() is still called on logout to remove any legacy entries
 *   that may exist from before this migration.
 */
import {
  createContext, useContext, useState, useEffect, useCallback,
  type ReactNode,
} from "react";
import {
  authApi, clearTokens,
  type AuthUser, type UserRole,
} from "@/lib/api";

interface AuthContextValue {
  currentUser: AuthUser | null;
  role: UserRole;
  isLoading: boolean;
  isAuthenticated: boolean;
  login:  (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading,   setIsLoading]   = useState(true);

  /**
   * On mount: ask the server "who am I?" using the httpOnly access cookie.
   * If the cookie is absent / expired the request returns 401 → we attempt
   * a silent refresh, also via cookie.  If that also fails the user is
   * considered unauthenticated.
   */
  useEffect(() => {
    authApi
      .me()
      .then((user) => setCurrentUser(user))
      .catch(() => {
        // Token may be expired.  tryRefresh() is called automatically inside
        // apiFetch on 401 — if it succeeds apiFetch retries /me/ transparently.
        // If we still end up here the user is genuinely unauthenticated.
        setCurrentUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    // Server returns the user object in JSON AND sets httpOnly cookies.
    // We store the user in state for the UI; NO tokens go into localStorage.
    const data = await authApi.login(email, password);
    setCurrentUser(data.user);
    // Belt-and-suspenders: clear any leftover legacy localStorage tokens
    clearTokens();
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => {});
    // Server clears the cookies via Set-Cookie max-age=0.
    // We also wipe any legacy localStorage tokens.
    clearTokens();
    setCurrentUser(null);
    // Clear React Query cache so stale data from the previous session
    // isn't shown to the next user on the same device.
    import("@/lib/query-client").then(({ queryClient }) => queryClient.clear());
  }, []);

  const role: UserRole = currentUser?.role ?? "student";

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isLoading,
        isAuthenticated: currentUser !== null,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
