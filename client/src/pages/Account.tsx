import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  User,
  Mail,
  Calendar,
  Clock,
  MessageSquare,
  CheckCircle,
  Archive,
  Key,
  Shield,
  Zap,
  Activity,
  BarChart3,
  Trash2,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function Account() {
  const { loading: authLoading, isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();

  const { data: accountData, isLoading } = trpc.auth.accountStats.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="h-full flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-3">
              <Shield className="h-4 w-4" />
              User Control Plane
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              Account{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
                Profile
              </span>
            </h1>
            <p className="mt-2 text-slate-500 max-w-2xl">
              Manage your identity, security credentials, and review your
              platform engagement metrics in real-time.
            </p>
          </div>

          {!accountData && isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
            </div>
          ) : accountData ? (
            <div className="space-y-8">
              {/* Profile & Subscription Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Identity Card */}
                <div className="lg:col-span-2 bg-white dark:bg-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                  <div className="flex items-center gap-3 mb-6">
                    <User className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      Identity Details
                    </h2>
                  </div>
                  <div className="space-y-4 relative z-10">
                    {/* Name */}
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                      <div className="mt-1 w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-slate-500">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                          Full Name
                        </label>
                        <div className="text-lg font-medium text-slate-900 dark:text-white">
                          {accountData.user.name || "Anonymous User"}
                        </div>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                      <div className="mt-1 w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-slate-500">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                          Contact Email
                        </label>
                        <div className="text-lg font-medium text-slate-900 dark:text-white">
                          {accountData.user.email}
                        </div>
                      </div>
                    </div>

                    {/* Member Info */}
                    <div className="flex flex-col sm:flex-row gap-6 pt-4 text-sm text-slate-500 border-t border-slate-100 dark:border-slate-800 mt-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Member Since:{" "}
                          <span className="text-slate-900 dark:text-white font-medium">
                            {new Date(
                              accountData.user.createdAt
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>
                          Last Active:{" "}
                          <span className="text-slate-900 dark:text-white font-medium">
                            {new Date(
                              accountData.user.lastSignedIn
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Type Card */}
                <div className="bg-white dark:bg-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4">
                    <Zap className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-2">
                    Account Type
                  </h3>
                  <div className="text-3xl font-bold text-slate-900 dark:text-white mb-6 capitalize">
                    {accountData.user.loginMethod || "User"}
                  </div>
                </div>
              </div>

              {/* Engagement Metrics */}
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Engagement Metrics
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    {
                      label: "Total Sessions",
                      val: accountData.stats.totalDebates,
                      icon: MessageSquare,
                      color: "text-blue-500",
                      bg: "bg-blue-50 dark:bg-blue-900/20",
                      border: "from-blue-500",
                    },
                    {
                      label: "Active Now",
                      val: accountData.stats.activeDebates,
                      icon: Activity,
                      color: "text-cyan-500",
                      bg: "bg-cyan-50 dark:bg-cyan-900/20",
                      border: "from-cyan-400",
                      hasIndicator: true,
                    },
                    {
                      label: "Concluded",
                      val: accountData.stats.completedDebates,
                      icon: CheckCircle,
                      color: "text-emerald-500",
                      bg: "bg-emerald-50 dark:bg-emerald-900/20",
                      border: "from-emerald-500",
                    },
                    {
                      label: "Archived",
                      val: accountData.stats.archivedDebates,
                      icon: Archive,
                      color: "text-slate-500",
                      bg: "bg-slate-50 dark:bg-slate-800",
                      border: "from-slate-500",
                    },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className="bg-white dark:bg-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800 transition-all duration-300 cursor-default group relative overflow-hidden hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-700"
                    >
                      <div
                        className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r ${stat.border} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}
                      />
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 relative`}
                        >
                          {stat.hasIndicator && (
                            <span className="absolute top-0 right-0 -mr-1 -mt-1 w-3 h-3 bg-cyan-400 rounded-full border-2 border-white dark:border-card" />
                          )}
                          <stat.icon className="h-5 w-5" />
                        </div>
                        <div className="text-4xl font-bold text-slate-900 dark:text-white mb-1 tabular-nums">
                          {stat.val}
                        </div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          {stat.label}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                  onClick={() => navigate("/settings")}
                  className="bg-white dark:bg-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-amber-500 group-hover:scale-110 transition-transform">
                      <Key className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                        API Credentials
                      </h4>
                      <p className="text-sm text-slate-500">
                        Manage your OpenRouter and provider keys.
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => navigate("/library")}
                  className="bg-white dark:bg-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-500 group-hover:scale-110 transition-transform">
                      <Archive className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                        Debate Archives
                      </h4>
                      <p className="text-sm text-slate-500">
                        Review and manage your full session history.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-slate-500">
                Failed to synchronize account data.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
