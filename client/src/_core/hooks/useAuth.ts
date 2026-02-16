import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { trpc } from "@/lib/trpc";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = "/login" } = options ?? {};
  const [, setLocation] = useLocation();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const utils = trpc.useUtils();

  // Get user from our backend
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: 2,                    // Retry on network/server errors
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    enabled: !!firebaseUser, // Only fetch when we have a Firebase user
  });

  // Listen for auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
        // Temporary debug log: remove after auth migration stabilises.
        console.debug("[useAuth] onAuthStateChanged →", user ? user.uid : "null");
        setFirebaseUser(user);
        setIsLoading(false);

        if (user) {
            utils.auth.me.invalidate();
        } else {
            utils.auth.me.setData(undefined, null);
        }
    });

    return () => unsubscribe();
  }, [utils]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      utils.auth.me.setData(undefined, null);
      setLocation("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, [utils, setLocation]);

  const state = useMemo(() => {
    const user = meQuery.data ?? null;
    
    // Store user info for potential offline use
    if (user) {
      localStorage.setItem("debatelab-user-info", JSON.stringify(user));
    }
    
    return {
      user,
      firebaseUser,
      loading: isLoading || (!!firebaseUser && meQuery.isLoading),
      error: meQuery.error ?? null,
      isAuthenticated: !!firebaseUser && !!user,
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    firebaseUser,
    isLoading,
  ]);

  // Safety-net: if Firebase user exists but server returned null, refetch once.
  // This handles transient failures during the auth handshake.
  const retryRef = useRef(0);
  useEffect(() => {
    if (
      firebaseUser &&
      !meQuery.data &&
      !meQuery.isLoading &&
      meQuery.status === "success" &&
      retryRef.current < 2
    ) {
      retryRef.current += 1;
      // Temporary debug log: remove after auth migration stabilises.
      console.warn("[useAuth] Server returned null for Firebase user – refetching (attempt", retryRef.current, ")");
      const timer = setTimeout(() => meQuery.refetch(), 800);
      return () => clearTimeout(timer);
    }
    if (meQuery.data) {
      retryRef.current = 0; // reset on success
    }
  }, [firebaseUser, meQuery.data, meQuery.isLoading, meQuery.status, meQuery.refetch]);

  // Handle redirect for unauthenticated users
  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (isLoading) return;
    if (firebaseUser) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;
    if (window.location.pathname === "/login") return;
    if (window.location.pathname.startsWith("/auth/")) return;

    setLocation(redirectPath);
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    isLoading,
    firebaseUser,
    setLocation,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
