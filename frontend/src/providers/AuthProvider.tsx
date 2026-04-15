/**
 * src/providers/AuthProvider.tsx
 *
 * Handles Firebase authentication state and syncs user profile with backend.
 * Triggers backend sync after each successful Firebase login to ensure
 * user data (name, email, admin status) is stored in PostgreSQL.
 *
 * Includes automatic server recovery: when server startup is detected,
 * automatically polls until server is available.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
  useRef,
} from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { useQueryClient } from "@tanstack/react-query";
import { auth, authReady } from "../firebase/config";
import { api, ApiClientError } from "../services/apiClient";
import { queryKeys } from "../hooks/useApi";
import type { UserProfile } from "../types/api.types";

// ── Auth Context Types ───────────────────────────────────────────────────────
interface AuthContextValue {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  isServerStarting: boolean;
  syncProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Auth Provider Component ──────────────────────────────────────────────────
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isServerStarting, setIsServerStarting] = useState(false);
  const queryClient = useQueryClient();
  const recoveryIntervalRef = useRef<number | null>(null);

  /**
   * Cleans up any active recovery polling
   */
  const clearRecoveryInterval = useCallback(() => {
    if (recoveryIntervalRef.current) {
      clearInterval(recoveryIntervalRef.current);
      recoveryIntervalRef.current = null;
    }
  }, []);

  /**
   * Syncs the user profile with the backend.
   * This triggers the backend to create/update the user record
   * with data from the Firebase token (name, email, admin claim).
   */
  const syncProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setIsLoading(false);
      clearRecoveryInterval();
      return;
    }

    try {
      // Fetching profile triggers backend to sync Firebase data
      const fetchedProfile = await api.get<UserProfile>("/api/profile");
      setProfile(fetchedProfile);
      setIsServerStarting(false);
      setIsLoading(false);
      clearRecoveryInterval();

      // Update the query cache so useProfile() has fresh data
      queryClient.setQueryData(queryKeys.profile, fetchedProfile);
    } catch (error) {
      // Check if this is a server startup error
      if (error instanceof ApiClientError && error.isServerStartup) {
        setIsServerStarting(true);
        setIsLoading(false);
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    }
  }, [user, queryClient, clearRecoveryInterval]);

  // Listen to Firebase auth state changes
  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    const initAuth = async () => {
      // Wait for Firebase to initialize
      await authReady;

      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!isMounted) return;

        // Only set user if email is verified (or if user is null for logout)
        // This prevents unverified users from being treated as authenticated
        if (firebaseUser && !firebaseUser.emailVerified) {
          // User exists but email not verified - treat as logged out
          setUser(null);
          setProfile(null);
          queryClient.removeQueries({ queryKey: queryKeys.profile });
          if (isMounted) {
            setIsLoading(false);
          }
          return;
        }

        setUser(firebaseUser);
        setIsLoading(false); // User logged in, stop showing loading screen while we fetch profile

        if (firebaseUser) {
          // User logged in with verified email - sync profile with backend
          try {
            const fetchedProfile = await api.get<UserProfile>("/api/profile");
            if (isMounted) {
              setProfile(fetchedProfile);
              setIsServerStarting(false);
              queryClient.setQueryData(queryKeys.profile, fetchedProfile);
            }
          } catch (error) {
            if (isMounted) {
              // Check if this is a server startup error
              if (error instanceof ApiClientError && error.isServerStartup) {
                setIsServerStarting(true);
              } else {
                setProfile(null);
              }
            }
          }
        } else {
          // User logged out - clear profile
          setProfile(null);
          queryClient.removeQueries({ queryKey: queryKeys.profile });
        }
      });
    };

    initAuth();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [queryClient]);

  /**
   * Automatic server recovery polling
   * When the server is detected as starting, automatically attempt to recover
   * by polling the profile endpoint every 3 seconds until it succeeds.
   */
  useEffect(() => {
    if (!isServerStarting || !user) {
      clearRecoveryInterval();
      return;
    }

    // Start recovery polling immediately, then every 3 seconds
    const attemptRecovery = async () => {
      try {
        const fetchedProfile = await api.get<UserProfile>("/api/profile");
        setProfile(fetchedProfile);
        setIsServerStarting(false);
        setIsLoading(false);
        queryClient.setQueryData(queryKeys.profile, fetchedProfile);
        clearRecoveryInterval();
      } catch (error) {
        // If it's still a server startup error, continue polling
        // Otherwise, stop polling (it's a different kind of error)
        if (!(error instanceof ApiClientError && error.isServerStartup)) {
          setIsLoading(false);
          clearRecoveryInterval();
        }
      }
    };

    // Try immediately first
    attemptRecovery();

    // Set up polling every 3 seconds
    recoveryIntervalRef.current = setInterval(attemptRecovery, 3000);

    return () => {
      clearRecoveryInterval();
    };
  }, [isServerStarting, user, queryClient, clearRecoveryInterval]);

  const isAdmin = profile?.is_admin ?? false;

  const value: AuthContextValue = {
    user,
    profile,
    isLoading,
    isAdmin,
    isServerStarting,
    syncProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── Hook to use Auth Context ─────────────────────────────────────────────────
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthProvider;
