import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Clock,
  MessageSquare,
  CheckCircle,
  Archive,
  LogIn,
  Settings,
  Key,
} from "lucide-react";

export default function Account() {
  const { loading: authLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  // Fetch account stats
  const { data: accountData, isLoading } = trpc.auth.accountStats.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="container py-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <User className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Account</h1>
            </div>
          </div>
        </header>
        <main className="container py-16">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Sign in to View Account</CardTitle>
              <CardDescription>
                Access your account settings and usage statistics.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button size="lg" onClick={() => window.location.href = getLoginUrl()}>
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <User className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Account</h1>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate("/settings")}>
            <Key className="h-4 w-4 mr-2" />
            API Keys
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : accountData ? (
            <>
              {/* Profile Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Your account details and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    {accountData.user.name && (
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Name</p>
                          <p className="font-medium">{accountData.user.name}</p>
                        </div>
                      </div>
                    )}

                    {accountData.user.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{accountData.user.email}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Login Method</p>
                        <p className="font-medium capitalize">{accountData.user.loginMethod || "Email"}</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Member Since</p>
                        <p className="font-medium">
                          {new Date(accountData.user.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Last Sign In</p>
                        <p className="font-medium">
                          {new Date(accountData.user.lastSignedIn).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Usage Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Usage Statistics
                  </CardTitle>
                  <CardDescription>
                    Your debate activity overview
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <MessageSquare className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">{accountData.stats.totalDebates}</p>
                      <p className="text-sm text-muted-foreground">Total Debates</p>
                    </div>

                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <div className="h-6 w-6 mx-auto mb-2 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <div className="h-3 w-3 rounded-full bg-blue-500" />
                      </div>
                      <p className="text-2xl font-bold">{accountData.stats.activeDebates}</p>
                      <p className="text-sm text-muted-foreground">Active</p>
                    </div>

                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-500" />
                      <p className="text-2xl font-bold">{accountData.stats.completedDebates}</p>
                      <p className="text-sm text-muted-foreground">Completed</p>
                    </div>

                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <Archive className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-2xl font-bold">{accountData.stats.archivedDebates}</p>
                      <p className="text-sm text-muted-foreground">Archived</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={() => navigate("/library")}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    View Library
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/settings")}>
                    <Key className="h-4 w-4 mr-2" />
                    Manage API Keys
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/leaderboard")}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    View Leaderboard
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Failed to load account data</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
