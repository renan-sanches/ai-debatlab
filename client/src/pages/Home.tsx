import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ModelSelector } from "@/components/ModelSelector";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Image,
  FileText,
  Check,
  ArrowRight,
  Lightbulb,
  Vote,
  Loader2,
  Settings2,
  Sparkles,
  EyeOff
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

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
  const [isBlindMode, setIsBlindMode] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Get available models
  const { data: availableModelsData } = trpc.models.available.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: allOpenRouterModels } = trpc.models.all.useQuery();
  const { data: listModels } = trpc.models.list.useQuery();

  const models = isAuthenticated
    ? allOpenRouterModels?.models || availableModelsData?.models
    : listModels;

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

  const handleStartDebate = async () => {
    if (!question.trim()) {
      toast.error("Please enter a question or topic");
      return;
    }
    if (selectedModels.length < 2) {
      toast.error("Please select at least 2 AI models");
      return;
    }
    // Auto-select moderator if not selected? Or enforce it?
    // Current logic enforces it.
    if (!moderatorModel) {
       // Try to pick a neutral moderator if none selected?
       // For now, let's just warn properly.
       toast.error("Please select a moderator model in Advanced Settings");
       setIsAdvancedOpen(true);
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
      isBlindMode,
      imageUrl,
      pdfUrl,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleStartDebate();
    }
  };

  const isLoading = createDebate.status === "pending" || isUploading;

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-black/20">
        <div className="max-w-5xl mx-auto px-6 py-12 md:py-16">

          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 text-slate-900 dark:text-white">
              Start a new <span className="text-blue-500">debate</span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Orchestrate complex discussions between top-tier AI models. Compare
              reasoning, detect bias, and synthesize actionable insights in real-time.
            </p>
          </div>

          {/* Main Configuration Card */}
          <div className="w-full bg-white dark:bg-[#0b101b] rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-6 md:p-10">

            {/* Topic Input */}
            <div className="mb-10">
              <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-900 dark:text-white mb-4">
                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Lightbulb className="w-4 h-4" />
                </div>
                Debate Topic
              </label>
              <div className="relative">
                <textarea
                  className="w-full bg-slate-50 dark:bg-[#151b2d] border border-slate-200 dark:border-slate-800 rounded-2xl px-6 py-5 text-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none min-h-[140px]"
                  placeholder="What would you like to explore? (e.g., The impact of AI on creative industries)"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
            </div>

            {/* Panel Configuration */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Panel Configuration
                </h3>
                <span className="text-xs text-slate-400 font-medium">
                  Quick Select ({selectedModels.length}/6 selected)
                </span>
              </div>

              <ModelSelector
                selectedModels={selectedModels}
                onSelectionChange={setSelectedModels}
                maxSelection={6}
              />
            </div>

            {/* Footer Text */}
            <p className="text-center text-xs text-slate-400 mb-8 pt-4">
              AI models are configured for maximum reasoning capability. Standard usage rates apply per token.
            </p>

            {/* Advanced Settings & Start Controls */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-8">

              <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen} className="mb-8">
                <CollapsibleTrigger asChild>
                  <button className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                    <Settings2 className="w-4 h-4" />
                    <span>{isAdvancedOpen ? "Hide" : "Show"} Advanced Settings</span>
                    {(!moderatorModel) && (
                        <span className="ml-2 w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Moderator required" />
                    )}
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent className="mt-6 space-y-6 animate-in slide-in-from-top-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Moderator */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Moderator Model <span className="text-red-500">*</span>
                      </label>
                      <select
                        className="w-full bg-slate-50 dark:bg-[#151b2d] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        value={moderatorModel}
                        onChange={(e) => setModeratorModel(e.target.value)}
                      >
                        <option value="">Select a Moderator</option>
                        {models
                          ?.sort((a, b) => a.name.localeCompare(b.name))
                          .map((m) => (
                            <option key={m.openRouterId} value={m.openRouterId}>
                              {m.name}
                            </option>
                          ))}
                      </select>
                      <p className="text-xs text-slate-500">Required to manage the debate flow.</p>
                    </div>

                    {/* Devil's Advocate */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                         <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                           Devil's Advocate
                         </label>
                         <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="da-toggle"
                              className="accent-blue-500 w-4 h-4"
                              checked={devilsAdvocateEnabled}
                              onChange={(e) => setDevilsAdvocateEnabled(e.target.checked)}
                            />
                            <label htmlFor="da-toggle" className="text-xs text-slate-500 cursor-pointer">Enable</label>
                         </div>
                      </div>

                      <select
                        disabled={!devilsAdvocateEnabled}
                        className="w-full bg-slate-50 dark:bg-[#151b2d] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all disabled:opacity-50"
                        value={devilsAdvocateModel}
                        onChange={(e) => setDevilsAdvocateModel(e.target.value)}
                      >
                        <option value="">Select Model</option>
                        {models
                          ?.sort((a, b) => a.name.localeCompare(b.name))
                          .map((m) => (
                            <option key={m.openRouterId} value={m.openRouterId}>
                              {m.name}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Voting */}
                    <div className="md:col-span-1">
                        <label className="flex items-center p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-[#151b2d] cursor-pointer hover:border-blue-500/50 transition-colors h-full">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mr-4">
                                <Vote className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <div className="font-medium text-slate-900 dark:text-white">Enable Voting</div>
                                <div className="text-xs text-slate-500">Allow participants to vote on arguments</div>
                            </div>
                            <input
                              type="checkbox"
                              checked={votingEnabled}
                              onChange={(e) => setVotingEnabled(e.target.checked)}
                              className="w-5 h-5 accent-blue-500"
                            />
                        </label>
                    </div>

                    {/* Blind Mode */}
                    <div className="md:col-span-1">
                        <label className="flex items-center p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-[#151b2d] cursor-pointer hover:border-blue-500/50 transition-colors h-full">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mr-4">
                                <EyeOff className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <div className="font-medium text-slate-900 dark:text-white">Blind Round</div>
                                <div className="text-xs text-slate-500">Models won't see each other's responses in the same round</div>
                            </div>
                            <input
                              type="checkbox"
                              checked={isBlindMode}
                              onChange={(e) => setIsBlindMode(e.target.checked)}
                              className="w-5 h-5 accent-blue-500"
                            />
                        </label>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Action Bar */}
              <div className="flex items-center justify-between">

                {/* Uploads */}
                <div className="flex gap-3">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                            "flex items-center justify-center w-11 h-11 rounded-xl border transition-all",
                            imageFile
                                ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                : "bg-white dark:bg-[#151b2d] border-slate-200 dark:border-slate-800 text-slate-400 hover:text-blue-500 hover:border-blue-500/50"
                        )}
                        title={imageFile ? imageFile.name : "Upload Image"}
                    >
                        {imageFile ? <Check className="w-5 h-5" /> : <Image className="w-5 h-5" />}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                        />
                    </button>

                    <button
                        onClick={() => pdfInputRef.current?.click()}
                        className={cn(
                            "flex items-center justify-center w-11 h-11 rounded-xl border transition-all",
                            pdfFile
                                ? "bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/20"
                                : "bg-white dark:bg-[#151b2d] border-slate-200 dark:border-slate-800 text-slate-400 hover:text-blue-500 hover:border-blue-500/50"
                        )}
                        title={pdfFile ? pdfFile.name : "Upload PDF context"}
                    >
                        {pdfFile ? <Check className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                        <input
                            type="file"
                            ref={pdfInputRef}
                            className="hidden"
                            accept="application/pdf"
                            onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                        />
                    </button>
                </div>

                {/* Start Button */}
                <Button
                    onClick={handleStartDebate}
                    disabled={isLoading}
                    size="lg"
                    className="h-14 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 font-semibold text-lg"
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : null}
                    Start Debate
                    {!isLoading && <ArrowRight className="w-5 h-5 ml-2" />}
                </Button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
