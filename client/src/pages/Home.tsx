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
  Sparkles,
  Vote,
  Loader2,
} from "lucide-react";

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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
      <div className="flex-1 overflow-y-auto relative">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none dark:from-blue-900/5" />
        <div className="absolute -top-[200px] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 py-12 flex flex-col items-center relative z-10">
          {/* Hero Section */}
          <h1 className="text-4xl md:text-6xl font-bold text-center mb-4 text-slate-900 dark:text-white tracking-tight">
            Start a new{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
              debate
            </span>
          </h1>
          <p className="text-center text-slate-600 dark:text-slate-400 max-w-2xl mb-12 text-lg leading-relaxed">
            Orchestrate complex discussions between top-tier AI models. Compare
            reasoning, detect bias, and synthesize actionable insights in
            real-time.
          </p>

          {/* Main Form Card */}
          <div className="w-full bg-white dark:bg-[#0f1623] rounded-3xl border border-slate-200 dark:border-slate-800 p-1 shadow-2xl shadow-black/5 dark:shadow-black/20 ring-1 ring-white/50 dark:ring-white/5">
            <div className="p-6 md:p-8 rounded-[1.25rem] bg-gradient-to-b from-transparent to-slate-50 dark:to-slate-900/50">
              {/* Topic Input */}
              <div className="mb-8">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  <div className="w-6 h-6 rounded-md bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  Debate Topic
                </label>
                <div className="relative group">
                  <input
                    className="w-full bg-slate-50 dark:bg-[#0b101b] border border-slate-200 dark:border-slate-800 rounded-xl px-5 py-4 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none shadow-sm group-hover:border-slate-300 dark:group-hover:border-slate-700"
                    placeholder="What would you like to explore? (e.g., The impact of AI on creative industries)"
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden group-focus-within:block">
                    <button
                      onClick={handleStartDebate}
                      disabled={isLoading}
                      className="p-2 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors disabled:opacity-50"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="h-px w-full bg-slate-200 dark:bg-slate-800 my-8" />

              {/* Panel Configuration */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Panel Configuration
                  </label>
                  <span className="text-xs text-slate-400">
                    Quick Select ({selectedModels.length}/6 selected)
                  </span>
                </div>

                {/* Model Selector */}
                <div className="mb-6">
                  <ModelSelector
                    selectedModels={selectedModels}
                    onSelectionChange={setSelectedModels}
                    maxSelection={6}
                  />
                </div>

                {/* Moderator & Devil's Advocate */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {/* Moderator Select */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Moderator Model
                    </label>
                    <select
                      className="w-full bg-white dark:bg-[#0b101b] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary/50 h-11 px-4 text-slate-900 dark:text-white transition-all"
                      value={moderatorModel}
                      onChange={(e) => setModeratorModel(e.target.value)}
                    >
                      <option value="">Select Moderator</option>
                      {models
                        ?.sort((a, b) => a.name.localeCompare(b.name))
                        .map((m) => (
                          <option key={m.openRouterId} value={m.openRouterId}>
                            {m.name} ({m.provider})
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Devil's Advocate Select */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      Devil's Advocate
                      <input
                        type="checkbox"
                        className="rounded text-primary focus:ring-primary w-3.5 h-3.5"
                        checked={devilsAdvocateEnabled}
                        onChange={(e) =>
                          setDevilsAdvocateEnabled(e.target.checked)
                        }
                      />
                    </label>
                    <select
                      disabled={!devilsAdvocateEnabled}
                      className="w-full bg-white dark:bg-[#0b101b] border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-primary/50 h-11 px-4 text-slate-900 dark:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      value={devilsAdvocateModel}
                      onChange={(e) => setDevilsAdvocateModel(e.target.value)}
                    >
                      <option value="">Select DA Model (Optional)</option>
                      {models
                        ?.sort((a, b) => a.name.localeCompare(b.name))
                        .map((m) => (
                          <option key={m.openRouterId} value={m.openRouterId}>
                            {m.name} ({m.provider})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Voting Toggle */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Vote className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      Enable Voting
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Allow participants to vote on arguments
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={votingEnabled}
                      onChange={(e) => setVotingEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>

              <div className="h-px w-full bg-slate-200 dark:bg-slate-800 my-6" />

              {/* Actions Row */}
              <div className="flex items-center justify-between">
                {/* File Upload Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                      imageFile
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                        : "bg-white dark:bg-[#0b101b] border border-slate-200 dark:border-slate-800 hover:border-primary/50 text-slate-500 hover:text-primary"
                    }`}
                    title={imageFile ? imageFile.name : "Add Image"}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    />
                    {imageFile ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Image className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => pdfInputRef.current?.click()}
                    className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${
                      pdfFile
                        ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                        : "bg-white dark:bg-[#0b101b] border border-slate-200 dark:border-slate-800 hover:border-primary/50 text-slate-500 hover:text-primary"
                    }`}
                    title={pdfFile ? pdfFile.name : "Add PDF"}
                  >
                    <input
                      type="file"
                      ref={pdfInputRef}
                      className="hidden"
                      accept="application/pdf"
                      onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                    />
                    {pdfFile ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Start Button */}
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 tracking-wide">
                      READY
                    </span>
                  </div>
                  <button
                    onClick={handleStartDebate}
                    disabled={isLoading}
                    className="bg-primary hover:bg-primary-hover text-white h-12 px-6 rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Start Debate
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <p className="mt-8 text-xs text-center text-slate-500">
            AI models are configured for maximum reasoning capability.
            <br className="md:hidden" /> Standard usage rates apply per token.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
