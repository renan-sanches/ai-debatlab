import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
  Loader2,
  Key,
  Trash2,
  Check,
  ExternalLink,
  ShieldCheck,
  Zap,
  Lock,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

type APIProvider = "openrouter" | "anthropic" | "openai" | "google";

const PROVIDER_INFO: Record<APIProvider, { name: string; description: string; docsUrl: string }> = {
  openrouter: {
    name: "OpenRouter",
    description: "Access 100+ AI models through a single API. Recommended for ultimate flexibility.",
    docsUrl: "https://openrouter.ai/keys",
  },
  anthropic: {
    name: "Anthropic (Claude)",
    description: "Direct access to Claude models. Ideal for precision-focused dialectics.",
    docsUrl: "https://console.anthropic.com/settings/keys",
  },
  openai: {
    name: "OpenAI (GPT)",
    description: "Direct access to GPT models. Industry standard for versatile reasoning.",
    docsUrl: "https://platform.openai.com/api-keys",
  },
  google: {
    name: "Google (Gemini)",
    description: "Direct access to Gemini models. Optimized for long-context analysis.",
    docsUrl: "https://aistudio.google.com/app/apikey",
  },
};

export default function Settings() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [selectedProvider, setSelectedProvider] = useState<APIProvider>("openrouter");
  const [apiKey, setApiKey] = useState("");

  // Fetch existing API keys
  const { data: apiKeys, isLoading, refetch } = trpc.apiKeys.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Save API key mutation
  const saveApiKey = trpc.apiKeys.save.useMutation({
    onSuccess: () => {
      toast.success("Identity key verified and stored.");
      setApiKey("");
      refetch();
    },
    onError: (error) => {
      toast.error("Validation failed: " + error.message);
    },
  });

  // Delete API key mutation
  const deleteApiKey = trpc.apiKeys.delete.useMutation({
    onSuccess: () => {
      toast.success("Credential purged from local context.");
      refetch();
    },
    onError: (error) => {
      toast.error("Cleanup failed: " + error.message);
    },
  });

  const handleSaveKey = () => {
    if (!apiKey.trim()) {
      toast.error("Credential field cannot be empty.");
      return;
    }
    saveApiKey.mutate({ provider: selectedProvider, apiKey: apiKey.trim() });
  };

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
              <Lock className="h-4 w-4" />
              Security & Provisioning
            </div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">
              Workspace <span className="text-primary italic">Settings</span>
            </h1>
            <p className="text-muted-foreground text-sm max-w-lg">
              Configure your integration keys to enable personal billing and access specific model capabilities.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {/* Add New Key */}
            <Card className="glass-panel border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="flex items-center gap-3 text-xl font-black">
                  <Plus className="h-6 w-6 text-primary" />
                  Provision New Endpoint
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Your credentials are encrypted at rest and used only for model fulfillment.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 pt-4 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Provider</Label>
                    <Select value={selectedProvider} onValueChange={(v) => setSelectedProvider(v as APIProvider)}>
                      <SelectTrigger className="h-14 bg-background/50 border-white/5 rounded-2xl text-lg px-6 shadow-inner">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-panel border-white/10 rounded-2xl">
                        {Object.entries(PROVIDER_INFO).map(([key, info]) => (
                          <SelectItem key={key} value={key} className="rounded-xl focus:bg-primary/20">
                            {info.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                      <p className="text-xs text-slate-400 leading-relaxed italic">
                        {PROVIDER_INFO[selectedProvider].description}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">API Credential</Label>
                    <div className="relative group">
                      <Input
                        type="password"
                        placeholder="sk-..."
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="h-14 bg-background/50 border-white/5 rounded-2xl text-lg px-6 focus:ring-primary focus:border-primary/40 transition-all shadow-inner"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary opacity-20 group-focus-within:opacity-100 transition-opacity">
                        <Lock className="h-5 w-5" />
                      </div>
                    </div>
                    <a
                      href={PROVIDER_INFO[selectedProvider].docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors px-2"
                    >
                      Generate new key
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                <div className="flex justify-end border-t border-white/5 pt-8 mt-4">
                  <Button
                    onClick={handleSaveKey}
                    disabled={saveApiKey.isPending}
                    className="h-14 px-10 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black shadow-xl shadow-primary/20 gap-2"
                  >
                    {saveApiKey.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                    {saveApiKey.isPending ? "Validating..." : "Register Endpoint"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Configured Keys */}
            <Card className="glass-panel border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="flex items-center gap-3 text-xl font-black">
                  <ShieldCheck className="h-6 w-6 text-emerald-500" />
                  Established Integrations
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-4">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Synchronizing credentials...</span>
                  </div>
                ) : apiKeys && apiKeys.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {apiKeys.map((key) => {
                      const info = PROVIDER_INFO[key.provider as APIProvider];
                      return (
                        <div key={key.id} className="flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-3xl hover:bg-white/[0.08] transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
                              <Zap className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-bold">{info?.name || key.provider}</p>
                              <p className="text-[10px] font-mono text-muted-foreground tracking-widest opacity-60">{key.maskedKey}</p>
                            </div>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive/40 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="glass-panel border-white/10 rounded-3xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-xl font-black">Sever connection?</AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-300">
                                  This will purge the {info?.name} integration from the workspace. You will revert to fallback billing for this provider.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl border-white/10">Keep it</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteApiKey.mutate({ provider: key.provider as APIProvider })}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                                >
                                  Delete Key
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white/5 rounded-[2rem] border-dashed border-white/10 space-y-4">
                    <Key className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-20" />
                    <p className="text-sm font-bold text-muted-foreground">Zero endpoints provisioned.</p>
                    <p className="text-xs text-muted-foreground/60 max-w-xs mx-auto">Add an API key above to bypass platform limits and use custom analytical models.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
