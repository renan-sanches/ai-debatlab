import { useCallback, useEffect, useMemo, useState } from "react";
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
    retry: false,
    refetchOnWindowFocus: false,
    enabled: !!firebaseUser, // Only fetch when we have a Firebase user
  });

  // Listen for auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
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
