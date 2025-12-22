import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Sparkles, ArrowLeft, Key, Trash2, Check, ExternalLink, LogIn } from "lucide-react";
import { toast } from "sonner";

type APIProvider = "openrouter" | "anthropic" | "openai" | "google";

const PROVIDER_INFO: Record<APIProvider, { name: string; description: string; docsUrl: string }> = {
  openrouter: {
    name: "OpenRouter",
    description: "Access 100+ AI models through a single API. Recommended for flexibility.",
    docsUrl: "https://openrouter.ai/keys",
  },
  anthropic: {
    name: "Anthropic (Claude)",
    description: "Direct access to Claude models. Best for Claude-focused debates.",
    docsUrl: "https://console.anthropic.com/settings/keys",
  },
  openai: {
    name: "OpenAI (GPT)",
    description: "Direct access to GPT models. Best for GPT-focused debates.",
    docsUrl: "https://platform.openai.com/api-keys",
  },
  google: {
    name: "Google (Gemini)",
    description: "Direct access to Gemini models. Best for Gemini-focused debates.",
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
      toast.success("API key saved successfully!");
      setApiKey("");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to save API key: " + error.message);
    },
  });
  
  // Delete API key mutation
  const deleteApiKey = trpc.apiKeys.delete.useMutation({
    onSuccess: () => {
      toast.success("API key removed");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to remove API key: " + error.message);
    },
  });

  const handleSaveKey = () => {
    if (!apiKey.trim()) {
      toast.error("Please enter an API key");
      return;
    }
    saveApiKey.mutate({ provider: selectedProvider, apiKey: apiKey.trim() });
  };

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
              <Sparkles className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Settings</h1>
            </div>
          </div>
        </header>
        <main className="container py-16">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Sign in to Access Settings</CardTitle>
              <CardDescription>
                Configure your API keys and preferences.
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
        <div className="container py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">Settings</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* API Keys Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Keys
              </CardTitle>
              <CardDescription>
                Configure your API keys to use your own billing for AI model access. 
                OpenRouter is recommended as it provides access to all models through a single key.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add New Key */}
              <div className="space-y-4 p-4 border border-border rounded-lg">
                <h3 className="font-medium">Add API Key</h3>
                
                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Select value={selectedProvider} onValueChange={(v) => setSelectedProvider(v as APIProvider)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PROVIDER_INFO).map(([key, info]) => (
                        <SelectItem key={key} value={key}>
                          {info.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {PROVIDER_INFO[selectedProvider].description}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input
                    type="password"
                    placeholder="sk-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <a
                    href={PROVIDER_INFO[selectedProvider].docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    Get your API key
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>

                <Button onClick={handleSaveKey} disabled={saveApiKey.isPending}>
                  {saveApiKey.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Save Key
                    </>
                  )}
                </Button>
              </div>

              {/* Existing Keys */}
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : apiKeys && apiKeys.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="font-medium">Configured Keys</h3>
                  {apiKeys.map((key) => (
                    <div
                      key={key.id}
                      className="flex items-center justify-between p-3 border border-border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{PROVIDER_INFO[key.provider as APIProvider]?.name}</p>
                        <p className="text-sm text-muted-foreground font-mono">{key.maskedKey}</p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove API Key?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove your {PROVIDER_INFO[key.provider as APIProvider]?.name} API key. 
                              You'll need to add it again to use this provider.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteApiKey.mutate({ provider: key.provider as APIProvider })}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Key className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No API keys configured yet</p>
                  <p className="text-sm">Add an API key above to use your own billing</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="bg-accent/30">
            <CardContent className="py-4">
              <h3 className="font-medium mb-2">About API Keys</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Your API keys are stored securely and only used for AI model requests</li>
                <li>• OpenRouter provides access to Claude, GPT, Gemini, and 100+ other models</li>
                <li>• Direct provider keys (Anthropic, OpenAI, Google) only work with their respective models</li>
                <li>• You can remove your keys at any time from this page</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
