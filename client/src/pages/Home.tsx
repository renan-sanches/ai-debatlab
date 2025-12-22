import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Sparkles, BookOpen, LogIn, Settings, Key, AlertCircle, Image, Camera, X, Send, Trophy, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { VoiceInput } from "@/components/VoiceInput";
import { ModelSelector } from "@/components/ModelSelector";

export default function Home() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [question, setQuestion] = useState("");
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [moderatorModel, setModeratorModel] = useState("");
  const [devilsAdvocateEnabled, setDevilsAdvocateEnabled] = useState(false);
  const [devilsAdvocateModel, setDevilsAdvocateModel] = useState("");
  const [votingEnabled, setVotingEnabled] = useState(true);
  const [useUserApiKey, setUseUserApiKey] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Get available models based on user's API keys
  const { data: availableModelsData } = trpc.models.available.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: allModels } = trpc.models.list.useQuery();
  const { data: leaderModels } = trpc.models.leaders.useQuery();
  
  // Use available models if authenticated, otherwise all models
  const models = isAuthenticated ? availableModelsData?.models : allModels;
  const hasApiKey = availableModelsData?.hasApiKey || false;
  const apiProvider = availableModelsData?.provider || "default";
  
  // Upload image mutation
  const uploadImage = trpc.debate.uploadImage.useMutation();
  
  // Create debate mutation
  const createDebate = trpc.debate.create.useMutation({
    onSuccess: (data) => {
      // Navigate and auto-start the debate
      navigate(`/debate/${data.debateId}?autostart=true`);
    },
    onError: (error) => {
      toast.error("Failed to create debate: " + error.message);
    },
  });

  const handleModelToggle = (modelId: string) => {
    setSelectedModels(prev => 
      prev.includes(modelId) 
        ? prev.filter(id => id !== modelId)
        : [...prev, modelId]
    );
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image must be less than 10MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error("PDF must be less than 20MB");
        return;
      }
      if (!file.type.includes('pdf')) {
        toast.error("Please select a PDF file");
        return;
      }
      setPdfFile(file);
      setPdfName(file.name);
    }
  };

  const handleRemovePdf = () => {
    setPdfFile(null);
    setPdfName(null);
    if (pdfInputRef.current) pdfInputRef.current.value = "";
  };

  const handleStartDebate = async () => {
    if (!question.trim()) {
      toast.error("Please enter a question for the debate");
      return;
    }
    if (selectedModels.length < 2) {
      toast.error("Please select at least 2 AI models to participate");
      return;
    }
    if (!moderatorModel) {
      toast.error("Please select a moderator model");
      return;
    }
    if (devilsAdvocateEnabled && !devilsAdvocateModel) {
      toast.error("Please select a model for Devil's Advocate mode");
      return;
    }

    let imageUrl: string | undefined;
    let pdfUrl: string | undefined;
    
    setIsUploading(true);
    
    // Upload image if present
    if (imageFile) {
      try {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(",")[1];
            resolve(base64);
          };
        });
        reader.readAsDataURL(imageFile);
        const base64Data = await base64Promise;
        
        const result = await uploadImage.mutateAsync({
          imageData: base64Data,
          mimeType: imageFile.type,
          extension: imageFile.name.split(".").pop() || "jpg",
        });
        imageUrl = result.url;
      } catch (error) {
        toast.error("Failed to upload image");
        setIsUploading(false);
        return;
      }
    }

    // Upload PDF if present
    if (pdfFile) {
      try {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(",")[1];
            resolve(base64);
          };
        });
        reader.readAsDataURL(pdfFile);
        const base64Data = await base64Promise;
        
        const result = await uploadImage.mutateAsync({
          imageData: base64Data,
          mimeType: "application/pdf",
          extension: "pdf",
        });
        pdfUrl = result.url;
      } catch (error) {
        toast.error("Failed to upload PDF");
        setIsUploading(false);
        return;
      }
    }
    
    setIsUploading(false);

    createDebate.mutate({
      question: question.trim(),
      participantModels: selectedModels,
      moderatorModel,
      devilsAdvocateEnabled,
      devilsAdvocateModel: devilsAdvocateEnabled ? devilsAdvocateModel : null,
      votingEnabled,
      imageUrl,
      pdfUrl,
    });
    
    // Store preference for using user API key in session
    if (hasApiKey) {
      sessionStorage.setItem('useUserApiKey', useUserApiKey.toString());
    }
  };

  const handleVoiceTranscription = (text: string) => {
    setQuestion(prev => prev ? `${prev} ${text}` : text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleStartDebate();
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">AI DebateLab</h1>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Button variant="ghost" onClick={() => navigate("/library")}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Library
                </Button>
                <Button variant="ghost" onClick={() => navigate("/leaderboard")}>
                  <Trophy className="h-4 w-4 mr-2" />
                  Leaderboard
                </Button>
                <Button variant="ghost" onClick={() => navigate("/settings")}>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                <span className="text-sm text-muted-foreground">
                  {user?.name || user?.email}
                </span>
              </>
            ) : (
              <Button onClick={() => window.location.href = getLoginUrl()}>
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Multi-AI Roundtable Debates
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get practical answers from multiple AI perspectives. 
              Ask a question, pick your AI panel, and get actionable insights.
            </p>
          </div>

          {!isAuthenticated ? (
            <Card className="max-w-md mx-auto">
              <CardHeader className="text-center">
                <CardTitle>Sign in to Start Debating</CardTitle>
                <CardDescription>
                  Create an account to orchestrate multi-AI debates and save them to your library.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Button size="lg" onClick={() => window.location.href = getLoginUrl()}>
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In to Continue
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Question Input */}
              <Card>
                <CardHeader>
                  <CardTitle>What do you want to discuss?</CardTitle>
                  <CardDescription>
                    Type your question and press Ctrl+Enter to start (or use the button below)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Textarea
                      placeholder="e.g., What's the best way to learn a new programming language? Should I start with Python or JavaScript?"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="min-h-[120px] pr-24 text-base"
                    />
                    <div className="absolute right-2 top-2 flex gap-1">
                      <VoiceInput
                        onTranscription={handleVoiceTranscription}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        title="Add image"
                      >
                        <Image className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => cameraInputRef.current?.click()}
                        title="Take photo"
                      >
                        <Camera className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => pdfInputRef.current?.click()}
                        title="Upload PDF"
                      >
                        <FileText className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                      </Button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <input
                      ref={pdfInputRef}
                      type="file"
                      accept="application/pdf"
                      onChange={handlePdfSelect}
                      className="hidden"
                    />
                  </div>
                  
                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="relative inline-block">
                      <img
                        src={imagePreview}
                        alt="Upload preview"
                        className="max-h-32 rounded-lg border border-border"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* PDF Preview */}
                  {pdfName && (
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border">
                      <FileText className="h-5 w-5 text-red-500" />
                      <span className="text-sm flex-1 truncate">{pdfName}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={handleRemovePdf}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Model Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Pick Your AI Panel</CardTitle>
                  <CardDescription>
                    Select 2-6 AI models to debate your question. Heart your favorites for quick access!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ModelSelector
                    selectedModels={selectedModels}
                    onSelectionChange={setSelectedModels}
                    maxSelection={6}
                  />
                </CardContent>
              </Card>

              {/* Moderator Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Choose Your Moderator</CardTitle>
                  <CardDescription>
                    This AI will summarize the debate and give you actionable recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {leaderModels?.map((model) => (
                      <button
                        key={model.openRouterId}
                        onClick={() => setModeratorModel(model.openRouterId)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                          moderatorModel === model.openRouterId
                            ? "border-amber-500 bg-amber-500/10 text-amber-500"
                            : "border-border hover:border-amber-500/50 hover:bg-accent"
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: model.color }}
                        />
                        <span className="text-sm font-medium">{model.name}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Optional Features */}
              <Card>
                <CardHeader>
                  <CardTitle>Extra Options</CardTitle>
                  <CardDescription>
                    Customize your debate experience
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Devil's Advocate Mode */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <Label className="text-base font-medium flex items-center gap-2">
                        🎭 Devil's Advocate Mode
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        One AI will challenge the group and argue the opposite view
                      </p>
                    </div>
                    <Switch
                      checked={devilsAdvocateEnabled}
                      onCheckedChange={setDevilsAdvocateEnabled}
                    />
                  </div>
                  
                  {devilsAdvocateEnabled && (
                    <div className="ml-6 pl-4 border-l-2 border-primary/30">
                      <Label className="text-sm mb-2 block">Who plays devil's advocate?</Label>
                      <Select value={devilsAdvocateModel} onValueChange={setDevilsAdvocateModel}>
                        <SelectTrigger className="w-full md:w-[300px]">
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          {models?.filter(m => selectedModels.includes(m.openRouterId)).map((model) => (
                            <SelectItem key={model.openRouterId} value={model.openRouterId}>
                              <div className="flex items-center gap-2">
                                <span>{model.icon}</span>
                                <span>{model.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Voting */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <Label className="text-base font-medium flex items-center gap-2">
                        🗳️ Enable Voting
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        AIs vote on who made the best argument
                      </p>
                    </div>
                    <Switch
                      checked={votingEnabled}
                      onCheckedChange={setVotingEnabled}
                    />
                  </div>

                  {/* API Key / Billing Toggle */}
                  {hasApiKey && (
                    <div className="flex items-start justify-between gap-4 pt-4 border-t border-border">
                      <div className="space-y-1">
                        <Label className="text-base font-medium flex items-center gap-2">
                          <Key className="h-4 w-4" />
                          Use Your API Key
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {apiProvider === "openrouter" 
                            ? "Bill to your OpenRouter account" 
                            : "Bill to your direct provider accounts"}
                        </p>
                      </div>
                      <Switch
                        checked={useUserApiKey}
                        onCheckedChange={setUseUserApiKey}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* API Key Status Alert */}
              {!hasApiKey && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>No API key configured. Debates will use default billing.</span>
                    <Button variant="link" size="sm" onClick={() => navigate("/settings")}>
                      Add API Key
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* Start Button */}
              <div className="flex justify-center">
                <Button
                  size="lg"
                  onClick={handleStartDebate}
                  disabled={createDebate.isPending || isUploading}
                  className="px-8"
                >
                  {createDebate.isPending || isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {isUploading ? "Uploading Image..." : "Starting Debate..."}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Start Debate
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
