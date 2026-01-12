import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2,
  Users,
  Zap,
  Trophy,
  FileText,
  ShieldCheck,
  ArrowRight,
  HelpCircle,
  ImagePlus,
  Key
} from "lucide-react";
import { toast } from "sonner";
import { ModelSelector } from "@/components/ModelSelector";
import DashboardLayout from "@/components/DashboardLayout";

export default function Home() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Get available models
  const { data: availableModelsData } = trpc.models.available.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: allModels } = trpc.models.list.useQuery();

  const models = isAuthenticated ? availableModelsData?.models : allModels;
  const hasApiKey = availableModelsData?.hasApiKey || false;
  const apiProvider = availableModelsData?.provider || "default";

  // Create debate mutation
  const uploadImage = trpc.debate.uploadImage.useMutation();
  const createDebate = trpc.debate.create.useMutation({
    onSuccess: (data) => {
      navigate(`/debate/${data.debateId}?autostart=true`);
    },
    onError: (error) => {
      toast.error("Failed to create debate: " + error.message);
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image must be less than 10MB");
        return;
      }
      setImageFile(file);
    }
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
    }
  };

  const handleStartDebate = async () => {
    if (!question.trim()) {
      toast.error("Please enter a question or topic");
      return;
    }
    if (selectedModels.length < 2) {
      toast.error("Please select at least 2 AI models");
      return;
    }
    if (!moderatorModel) {
      toast.error("Please select a moderator model");
      return;
    }

    let imageUrl: string | undefined;
    let pdfUrl: string | undefined;

    setIsUploading(true);

    try {
      if (imageFile) {
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
      }

      if (pdfFile) {
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
      }
    } catch (error) {
      toast.error("Failed to upload files");
      setIsUploading(false);
      return;
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

    if (hasApiKey) {
      sessionStorage.setItem('useUserApiKey', useUserApiKey.toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
    <DashboardLayout>
      <div className="min-h-full premium-bg p-6 lg:p-10">
        <div className="max-w-5xl mx-auto space-y-10">
          {/* Hero Section */}
          <div className="space-y-4">
            <h2 className="text-4xl font-extrabold tracking-tight text-foreground lg:text-5xl">
              Start a new <span className="text-primary">debate</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Enter a topic or question to start an AI-powered dialectic debate. Challenge assumptions, gain multifaceted perspectives, and synthesize truth.
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleStartDebate(); }} className="space-y-8">
            {/* Main Input Card */}
            <Card className="glass-panel border-none shadow-2xl p-6 lg:p-8 rounded-3xl">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="question" className="text-base font-semibold">What would you like to explore?</Label>
                  <Textarea
                    id="question"
                    placeholder="e.g., Should we implement universal basic income to address automation?"
                    className="min-h-[120px] text-lg bg-background/50 border-border focus:ring-primary rounded-2xl p-4 resize-none transition-all focus:shadow-lg focus:shadow-primary/5"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Select AI Models</Label>
                    <div className="glass-panel rounded-2xl p-4 border border-border/50">
                      <ModelSelector
                        selectedModels={selectedModels}
                        onSelectionChange={setSelectedModels}
                        maxSelection={6}
                      />
                      <p className="text-[10px] text-muted-foreground mt-3 flex items-center gap-1.5">
                        <HelpCircle className="h-3 w-3" />
                        Select at least 2 models for a diverse perspective.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Extra Context & Modes</Label>
                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center justify-between p-4 bg-background/30 rounded-2xl border border-border/50 hover:bg-background/50 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-secondary/10 rounded-lg text-secondary group-hover:scale-110 transition-transform">
                            <Users className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">Devil's Advocate</p>
                            <p className="text-[10px] text-muted-foreground">Forcing counter-perspectives</p>
                          </div>
                        </div>
                        <Switch
                          checked={devilsAdvocateEnabled}
                          onCheckedChange={setDevilsAdvocateEnabled}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-2">
                          <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageSelect}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className={`h-auto py-3 px-4 rounded-2xl flex flex-col items-center gap-1 border-dashed transition-all ${imageFile ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/50"}`}
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <ImagePlus className="h-5 w-5" />
                            <span className="text-[10px] font-bold uppercase">{imageFile ? "Image Added" : "Add Image"}</span>
                          </Button>
                        </div>

                        <div className="flex flex-col gap-2">
                          <input
                            type="file"
                            ref={pdfInputRef}
                            className="hidden"
                            accept="application/pdf"
                            onChange={handlePdfSelect}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className={`h-auto py-3 px-4 rounded-2xl flex flex-col items-center gap-1 border-dashed transition-all ${pdfFile ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/50"}`}
                            onClick={() => pdfInputRef.current?.click()}
                          >
                            <FileText className="h-5 w-5" />
                            <span className="text-[10px] font-bold uppercase">{pdfFile ? "PDF Added" : "Add PDF"}</span>
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Moderator Model</Label>
                      <Select value={moderatorModel} onValueChange={setModeratorModel}>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Select Moderator" />
                        </SelectTrigger>
                        <SelectContent>
                          {models?.map(m => (
                            <SelectItem key={m.openRouterId} value={m.openRouterId}>{m.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {hasApiKey && (
                      <div className="flex items-center justify-between p-3 bg-background/20 rounded-xl border border-border/30">
                        <div className="flex items-center gap-2">
                          <Key className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs font-medium">Use Personal API Key</span>
                        </div>
                        <Switch
                          checked={useUserApiKey}
                          onCheckedChange={setUseUserApiKey}
                          className="scale-75"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={createDebate.status === "pending" || isUploading}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-16 rounded-2xl text-lg shadow-2xl shadow-primary/30 transition-all hover:scale-[1.01] active:scale-[0.99] gap-3"
                  >
                    {(createDebate.status === "pending" || isUploading) ? (
                      <>
                        <Loader2 className="h-6 w-6 animate-spin" />
                        Initializing Workspace...
                      </>
                    ) : (
                      <>
                        Start the Debate
                        <ArrowRight className="h-6 w-6" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </form>

          {/* Quick Tips or Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-3xl border-none space-y-3">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500 w-fit">
                <Zap className="h-5 w-5" />
              </div>
              <h4 className="font-bold">Multimodal Inputs</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Upload images or PDFs to provide rich context for the models to analyze and debate upon.
              </p>
            </div>
            <div className="glass-panel p-6 rounded-3xl border-none space-y-3">
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500 w-fit">
                <Trophy className="h-5 w-5" />
              </div>
              <h4 className="font-bold">Comparative Voting</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Let the models vote on each other's responses to determine the most logical and persuasive arguments.
              </p>
            </div>
            <div className="glass-panel p-6 rounded-3xl border-none space-y-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500 w-fit">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h4 className="font-bold">Moderator Synthesis</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                A neutral moderator will synthesize the entire debate into a coherent summary of findings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
