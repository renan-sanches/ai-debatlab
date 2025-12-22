import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { supabase, getAccessToken, signOut as supabaseSignOut } from "@/lib/supabase";
import { trpc } from "@/lib/trpc";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = "/login" } = options ?? {};
  const [, setLocation] = useLocation();
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const utils = trpc.useUtils();
  
  // Get user from our backend (synced with Supabase)
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    enabled: !!session, // Only fetch when we have a Supabase session
  });

  // Initialize session from Supabase
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setSupabaseUser(session?.user ?? null);
        
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          // Refresh our backend user data
          utils.auth.me.invalidate();
        } else if (event === "SIGNED_OUT") {
          utils.auth.me.setData(undefined, null);
        }
        
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [utils]);

  const logout = useCallback(async () => {
    try {
      await supabaseSignOut();
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
      supabaseUser,
      session,
      loading: isLoading || (!!session && meQuery.isLoading),
      error: meQuery.error ?? null,
      isAuthenticated: !!session && !!user,
    };
  }, [
    meQuery.data,
    meQuery.error,
    meQuery.isLoading,
    supabaseUser,
    session,
    isLoading,
  ]);

  // Handle redirect for unauthenticated users
  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (isLoading) return;
    if (session) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;
    if (window.location.pathname === "/login") return;
    if (window.location.pathname.startsWith("/auth/")) return;

    setLocation(redirectPath);
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    isLoading,
    session,
    setLocation,
  ]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
    getAccessToken,
  };
}
