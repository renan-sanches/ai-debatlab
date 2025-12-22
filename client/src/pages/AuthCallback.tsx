import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

/**
 * Auth callback page for OAuth redirects
 * Supabase redirects here after successful OAuth authentication
 */
export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from URL hash (Supabase puts tokens there)
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth callback error:", error);
          setError(error.message);
          return;
        }

        if (session) {
          // Successfully authenticated, redirect to home
          setLocation("/");
        } else {
          // No session, might be still processing
          // Check for error in URL params
          const params = new URLSearchParams(window.location.search);
          const errorDescription = params.get("error_description");
          if (errorDescription) {
            setError(errorDescription);
          } else {
            // Wait a moment and check again
            setTimeout(async () => {
              const { data: { session } } = await supabase.auth.getSession();
              if (session) {
                setLocation("/");
              } else {
                setError("Authentication failed. Please try again.");
              }
            }, 1000);
          }
        }
      } catch (err) {
        console.error("Auth callback error:", err);
        setError("An unexpected error occurred during authentication.");
      }
    };

    handleAuthCallback();
  }, [setLocation]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-xl p-8 max-w-md w-full text-center">
          <div className="mb-4 text-red-400">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Authentication Error</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => setLocation("/login")}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Completing authentication...</p>
      </div>
    </div>
  );
}

