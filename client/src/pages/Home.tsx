import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ModelSelector } from "@/components/ModelSelector";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Plus,
  ArrowRight,
  ChevronRight,
  Smartphone,
  Globe,
  Sparkles,
  Search,
  History,
  TrendingUp,
  Layout
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

  const models = isAuthenticated ? (allOpenRouterModels?.models || availableModelsData?.models) : listModels;

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

  return (
    <DashboardLayout>
      <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display transition-colors duration-300 antialiased selection:bg-primary/30 min-h-full pb-20">

        {/* Hero Section */}
        <section className="relative min-h-[80vh] flex flex-col items-center justify-center px-6 overflow-hidden pt-12">
          {/* Animated Background Elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] mix-blend-screen animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[120px] mix-blend-screen animate-pulse delay-700"></div>
          </div>

          <div className="text-center mb-12 relative z-10 w-full max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-300 text-xs font-bold uppercase tracking-wider mb-6">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Now with Plus Jakarta Sans
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 text-slate-900 dark:text-white leading-tight">
              Start a new debate
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Orchestrate complex discussions between top-tier AI models. Compare reasoning, detect bias, and synthesize actionable insights in real-time.
            </p>
          </div>

          {/* Main Interaction Area */}
          <div className="w-full max-w-3xl relative group z-20">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl blur opacity-20 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative bg-white dark:bg-[#0f1623] border border-slate-200 dark:border-slate-700/50 rounded-3xl p-1 shadow-2xl input-glow input-glow-dark transition-all">
              <div className="bg-slate-50 dark:bg-[#131b2e] rounded-[1.3rem] p-6 md:p-8">
                <div className="space-y-6 mb-8">
                  {/* Topic Input */}
                  <div className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 mt-1">
                      <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-sm">psychology</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-900 dark:text-white font-medium mb-2">Debate Topic</p>
                      <textarea
                        className="w-full bg-transparent border-none focus:ring-0 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 p-0 resize-none min-h-[60px]"
                        placeholder="What would you like to explore? (e.g., The impact of AI on creative industries)"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyDown={handleKeyDown}
                      />
                    </div>
                  </div>

                  <div className="h-px bg-slate-200 dark:bg-slate-700/50 w-full"></div>

                  {/* Model & Config Selectors */}
                  <div className="space-y-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Panel Configuration</p>

                    <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <ModelSelector
                        selectedModels={selectedModels}
                        onSelectionChange={setSelectedModels}
                        maxSelection={6}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Moderator Select */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-500">Moderator Model</label>
                        <select
                          className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-primary h-10 px-3"
                          value={moderatorModel}
                          onChange={(e) => setModeratorModel(e.target.value)}
                        >
                          <option value="">Select Moderator</option>
                          {models?.sort((a, b) => a.name.localeCompare(b.name)).map(m => (
                            <option key={m.openRouterId} value={m.openRouterId}>
                              {m.name} ({m.provider})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Devil's Advocate Select */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-slate-500 flex items-center gap-2">
                          Devil's Advocate
                          <input
                            type="checkbox"
                            className="rounded text-primary focus:ring-primary w-3 h-3"
                            checked={devilsAdvocateEnabled}
                            onChange={(e) => setDevilsAdvocateEnabled(e.target.checked)}
                          />
                        </label>
                        <select
                          disabled={!devilsAdvocateEnabled}
                          className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-primary h-10 px-3 disabled:opacity-50"
                          value={devilsAdvocateModel}
                          onChange={(e) => setDevilsAdvocateModel(e.target.value)}
                        >
                          <option value="">Select DA Model (Optional)</option>
                          {models?.sort((a, b) => a.name.localeCompare(b.name)).map(m => (
                            <option key={m.openRouterId} value={m.openRouterId}>
                              {m.name} ({m.provider})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${imageFile ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary/50 text-slate-500 hover:text-primary"}`}
                      title="Add Image"
                    >
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
                      <span className="material-symbols-outlined text-lg">{imageFile ? "check" : "image"}</span>
                    </button>
                    <button
                      onClick={() => pdfInputRef.current?.click()}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${pdfFile ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "bg-white dark:bg-sidebar-dark border border-slate-200 dark:border-slate-700 hover:border-primary/50 text-slate-500 hover:text-primary"}`}
                      title="Add PDF"
                    >
                      <input type="file" ref={pdfInputRef} className="hidden" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} />
                      <span className="material-symbols-outlined text-lg">{pdfFile ? "check" : "picture_as_pdf"}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2 text-slate-400 text-[10px] uppercase font-bold tracking-widest mr-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Panel Ready
                    </div>
                    <button
                      onClick={handleStartDebate}
                      disabled={createDebate.status === "pending" || isUploading}
                      className="bg-primary hover:bg-blue-500 text-white h-12 px-6 rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {createDebate.status === "pending" ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>Start Debate <span className="material-symbols-outlined text-sm">arrow_forward</span></>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>


        </section>

        {/* Pick your AI Panel Section */}
        <section className="py-24 px-6 bg-slate-50 dark:bg-[#0B1120] relative" id="models">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] dark:opacity-[0.05] pointer-events-none"></div>
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
              <div className="max-w-xl">
                <span className="text-primary font-bold uppercase tracking-widest text-xs mb-2 block">Diverse Perspectives</span>
                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white">Pick your AI Panel</h2>
                <p className="text-slate-600 dark:text-slate-400 mt-4 text-lg leading-relaxed">
                  Construct a debate between the world's most powerful language models. Compare reasoning, bias, and creative outputs side-by-side.
                </p>
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FeaturedModelCard
                name="GPT-4o"
                description="The industry leader in general reasoning and creative problem solving."
                icon="token"
                color="emerald"
              />
              <FeaturedModelCard
                name="Claude 3.5 Sonnet"
                description="Unrivaled nuance and safety. Perfect for ethical and philosophical debates."
                icon="history_edu"
                color="orange"
              />
              <FeaturedModelCard
                name="Gemini 1.5 Pro"
                description="Google's powerhouse with massive context windows for deep analysis."
                icon="google"
                color="blue"
              />
              <FeaturedModelCard
                name="Llama 3.1"
                description="Meta's state-of-the-art open model with unparalleled efficiency."
                icon="psychology_alt"
                color="indigo"
              />
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section className="py-24 px-6 overflow-hidden bg-white dark:bg-[#080d19]" id="how-it-works">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <span className="text-secondary font-bold uppercase tracking-widest text-xs mb-2 block">Workflow</span>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-slate-900 dark:text-white">How it Works</h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
                From prompt to comprehensive analysis in three simple steps.
              </p>
            </div>

            <div className="relative">
              <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent -z-10"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-10">
                <StepCard number={1} title="Define the Prompt" description="Enter your query or debate topic. Use our rich-text parameters and constraints." color="primary" />
                <StepCard number={2} title="Select your Panel" description="Pick up to 6 models to debate. Adjust temperature and reasoning levels for each." color="secondary" />
                <StepCard number={3} title="Analyze Results" description="Watch the models interact and use our comparison matrix to score their accuracy." color="emerald" />
              </div>
            </div>
          </div>
        </section>


      </div>
    </DashboardLayout>
  );
}

function FeaturedModelCard({ name, description, icon, color }: { name: string, description: string, icon: string, color: "emerald" | "orange" | "blue" | "indigo" }) {
  const colorStyles: Record<string, string> = {
    emerald: "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600",
    orange: "bg-orange-50 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20 text-orange-600 dark:text-orange-400 group-hover:bg-orange-600",
    blue: "bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600",
    indigo: "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600"
  };

  const currentStyles = colorStyles[color];

  return (
    <div className="group bg-white dark:bg-surface-dark p-8 rounded-3xl border border-slate-200 dark:border-slate-800 transition-all hover:-translate-y-1 shadow-sm hover:shadow-xl dark:shadow-none card-hover">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border transition-all ${currentStyles.split('group-hover')[0]}`}>
        <span className="material-symbols-outlined text-3xl">{icon}</span>
      </div>
      <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">{name}</h3>
      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">{description}</p>
      <button className={`w-full py-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 transition-colors ${currentStyles.split('group-hover:')[1]} group-hover:text-white`}>
        Select Model
      </button>
    </div>
  );
}

function StepCard({ number, title, description, color }: { number: number, title: string, description: string, color: "primary" | "secondary" | "emerald" }) {
  const bgColors: Record<string, string> = {
    primary: "bg-primary shadow-primary/30",
    secondary: "bg-secondary shadow-secondary/30",
    emerald: "bg-emerald-500 shadow-emerald-500/30"
  };

  const currentBg = bgColors[color];

  return (
    <div className="relative bg-white dark:bg-surface-dark p-8 rounded-3xl text-center flex flex-col items-center border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none transition-transform hover:scale-105 duration-300">
      <div className="w-24 h-24 bg-white dark:bg-surface-dark rounded-full flex items-center justify-center mb-6 absolute -top-12 border-4 border-white dark:border-[#080d19]">
        <div className={`w-16 h-16 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg ${currentBg}`}>{number}</div>
      </div>
      <div className="mt-10">
        <h4 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">{title}</h4>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  );
}


