import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  Key,
  Trash2,
  Check,
  ExternalLink,
  ShieldCheck,
  Zap,
  Lock,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

type APIProvider = "openrouter" | "anthropic" | "openai" | "google";

const PROVIDER_INFO: Record<
  APIProvider,
  { name: string; description: string; docsUrl: string }
> = {
  openrouter: {
    name: "OpenRouter",
    description:
      "Access 100+ AI models through a single API. Recommended for ultimate flexibility.",
    docsUrl: "https://openrouter.ai/keys",
  },
  anthropic: {
    name: "Anthropic (Claude)",
    description:
      "Direct access to Claude models. Ideal for precision-focused dialectics.",
    docsUrl: "https://console.anthropic.com/settings/keys",
  },
  openai: {
    name: "OpenAI (GPT)",
    description:
      "Direct access to GPT models. Industry standard for versatile reasoning.",
    docsUrl: "https://platform.openai.com/api-keys",
  },
  google: {
    name: "Google (Gemini)",
    description:
      "Direct access to Gemini models. Optimized for long-context analysis.",
    docsUrl: "https://aistudio.google.com/app/apikey",
  },
};

export default function Settings() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [selectedProvider, setSelectedProvider] =
    useState<APIProvider>("openrouter");
  const [apiKey, setApiKey] = useState("");

  const {
    data: apiKeys,
    isLoading,
    refetch,
  } = trpc.apiKeys.list.useQuery(undefined, { enabled: isAuthenticated });

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
      <div className="flex-1 overflow-y-auto p-6 md:p-8 lg:p-10">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-3">
              <Lock className="h-4 w-4" />
              Security & Provisioning
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              Workspace{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
                Settings
              </span>
            </h1>
            <p className="mt-2 text-slate-500 max-w-lg">
              Configure your integration keys to enable personal billing and
              access specific model capabilities.
            </p>
          </div>

          <div className="space-y-8">
            {/* Add New Key */}
            <div className="bg-white dark:bg-card rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="flex items-center gap-3 text-xl font-bold text-slate-900 dark:text-white">
                  <Plus className="h-5 w-5 text-primary" />
                  Provision New Endpoint
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Your credentials are encrypted at rest and used only for model
                  fulfillment.
                </p>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Select Provider
                    </Label>
                    <Select
                      value={selectedProvider}
                      onValueChange={(v) =>
                        setSelectedProvider(v as APIProvider)
                      }
                    >
                      <SelectTrigger className="h-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-base px-4">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-card border-slate-200 dark:border-slate-800 rounded-xl">
                        {Object.entries(PROVIDER_INFO).map(([key, info]) => (
                          <SelectItem
                            key={key}
                            value={key}
                            className="rounded-lg focus:bg-primary/10"
                          >
                            {info.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl">
                      <p className="text-xs text-slate-500 leading-relaxed italic">
                        {PROVIDER_INFO[selectedProvider].description}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      API Credential
                    </Label>
                    <div className="relative group">
                      <Input
                        type="password"
                        placeholder="sk-..."
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="h-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-base px-4 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 opacity-50 group-focus-within:opacity-100 transition-opacity">
                        <Lock className="h-4 w-4" />
                      </div>
                    </div>
                    <a
                      href={PROVIDER_INFO[selectedProvider].docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary-hover transition-colors px-1"
                    >
                      Generate new key
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                <div className="flex justify-end border-t border-slate-100 dark:border-slate-800 pt-6 mt-2">
                  <Button
                    onClick={handleSaveKey}
                    disabled={saveApiKey.isPending}
                    className="h-12 px-8 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold shadow-lg shadow-blue-500/20 gap-2"
                  >
                    {saveApiKey.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    {saveApiKey.isPending ? "Validating..." : "Register Endpoint"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Configured Keys */}
            <div className="bg-white dark:bg-card rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="flex items-center gap-3 text-xl font-bold text-slate-900 dark:text-white">
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                  Established Integrations
                </h2>
              </div>
              <div className="p-6">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Synchronizing credentials...
                    </span>
                  </div>
                ) : apiKeys && apiKeys.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {apiKeys.map((key) => {
                      const info = PROVIDER_INFO[key.provider as APIProvider];
                      return (
                        <div
                          key={key.id}
                          className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-slate-200 dark:hover:border-slate-700 transition-all group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-500">
                              <Zap className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">
                                {info?.name || key.provider}
                              </p>
                              <p className="text-[10px] font-mono text-slate-400 tracking-widest opacity-60">
                                {key.maskedKey}
                              </p>
                            </div>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-white dark:bg-card border-slate-200 dark:border-slate-800 rounded-2xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
                                  Sever connection?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-500">
                                  This will purge the {info?.name} integration
                                  from the workspace. You will revert to
                                  fallback billing for this provider.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl border-slate-200 dark:border-slate-800">
                                  Keep it
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    deleteApiKey.mutate({
                                      provider: key.provider as APIProvider,
                                    })
                                  }
                                  className="bg-red-500 text-white hover:bg-red-600 rounded-xl"
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
                  <div className="text-center py-16 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-4">
                    <Key className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-bold text-slate-500">
                      Zero endpoints provisioned.
                    </p>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      Add an API key above to bypass platform limits and use
                      custom analytical models.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
