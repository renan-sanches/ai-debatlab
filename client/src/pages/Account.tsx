import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  User,
  Mail,
  Calendar,
  Clock,
  MessageSquare,
  CheckCircle,
  Archive,
  Settings,
  Key,
  Shield,
  Zap
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function Account() {
  const { loading: authLoading, isAuthenticated, user } = useAuth();
  const [, navigate] = useLocation();

  // Fetch account stats
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
      <div className="min-h-full premium-bg p-6 lg:p-10">
        <div className="max-w-4xl mx-auto space-y-10">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.3em] mb-1">
              <Shield className="h-4 w-4" />
              User Control Plane
            </div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">
              Account <span className="text-primary italic">Profile</span>
            </h1>
            <p className="text-muted-foreground text-sm max-w-md">
              Manage your identity, security credentials, and review your platform engagement metrics.
            </p>
          </div>

          {!accountData && isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
            </div>
          ) : accountData ? (
            <div className="grid grid-cols-1 gap-8">
              {/* Profile & Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="md:col-span-2 glass-panel border-none shadow-2xl rounded-[2rem] overflow-hidden">
                  <CardHeader className="p-8 pb-4">
                    <CardTitle className="flex items-center gap-3 text-xl font-black">
                      <User className="h-6 w-6 text-primary" />
                      Identity Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 pt-4 space-y-6">
                    <div className="grid gap-6">
                      <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-primary/10 transition-colors">
                            <User className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Full Name</p>
                            <p className="text-lg font-bold">{accountData.user.name || "Anonymous User"}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-primary/10 transition-colors">
                            <Mail className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contact Email</p>
                            <p className="text-lg font-bold">{accountData.user.email}</p>
                          </div>
                        </div>
                      </div>

                      <Separator className="bg-white/5" />

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Member Since
                          </p>
                          <p className="font-bold text-slate-300">
                            {new Date(accountData.user.createdAt).toLocaleDateString("en-US", { month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Last Active
                          </p>
                          <p className="font-bold text-slate-300">
                            {new Date(accountData.user.lastSignedIn).toLocaleDateString("en-US", { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-8">
                  <Card className="glass-panel border-none shadow-2xl rounded-[2rem] overflow-hidden bg-primary/5">
                    <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/20">
                        <Zap className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Subscription</p>
                        <h3 className="text-2xl font-black">Pro Plan</h3>
                      </div>
                      <Button variant="outline" className="w-full rounded-xl border-primary/20 hover:bg-primary/10 text-primary font-bold">
                        Manage
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Usage Statistics grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: "Total Sessions", val: accountData.stats.totalDebates, icon: MessageSquare, color: "text-primary", bg: "bg-primary/10" },
                  { label: "Active Now", val: accountData.stats.activeDebates, icon: Activity, color: "text-blue-500", bg: "bg-blue-500/10" },
                  { label: "Concluded", val: accountData.stats.completedDebates, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                  { label: "Archived", val: accountData.stats.archivedDebates, icon: Archive, color: "text-slate-400", bg: "bg-white/5" },
                ].map((stat, i) => (
                  <Card key={i} className="glass-panel border-none shadow-xl rounded-3xl overflow-hidden group hover:scale-105 transition-transform">
                    <CardContent className="p-6 flex flex-col items-center gap-3">
                      <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                        <stat.icon className="h-6 w-6" />
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-black tabular-nums">{stat.val}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                <Card className="glass-panel border-none shadow-2xl rounded-[2rem] p-8 space-y-4 hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => navigate("/settings")}>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500">
                      <Key className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">API Credentials</h4>
                      <p className="text-sm text-muted-foreground">Manage your OpenRouter and provider keys.</p>
                    </div>
                  </div>
                </Card>

                <Card className="glass-panel border-none shadow-2xl rounded-[2rem] p-8 space-y-4 hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => navigate("/library")}>
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
                      <Archive className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">Debate Archives</h4>
                      <p className="text-sm text-muted-foreground">Review and manage your full session history.</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground">Inertia detected. Failed to synchronize account data.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

const Activity = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);
