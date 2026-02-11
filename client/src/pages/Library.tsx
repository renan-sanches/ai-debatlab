import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
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
  Plus,
  Loader2,
  Search,
  History,
  Sparkles,
  Compass,
  Clock,
  Flame,
  Zap,
  Trophy,
  Handshake,
  Play,
  FileText,
  Download,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { AI_MODELS } from "../../../shared/models";
import DashboardLayout from "@/components/DashboardLayout";

// Helper function to get emoji and colors for AI models
function getModelEmoji(modelId: string): { emoji: string; bgColor: string; borderColor: string; shadowColor: string } {
  // Match emojis to model types
  if (modelId.includes('claude')) return { emoji: '🤖', bgColor: 'bg-purple-100 dark:bg-purple-900/20', borderColor: 'border-purple-500', shadowColor: 'shadow-[0_0_15px_rgba(168,85,247,0.25)]' };
  if (modelId.includes('gpt')) return { emoji: '👾', bgColor: 'bg-emerald-100 dark:bg-emerald-900/20', borderColor: 'border-emerald-500', shadowColor: 'shadow-[0_0_15px_rgba(16,185,129,0.25)]' };
  if (modelId.includes('gemini')) return { emoji: '🧠', bgColor: 'bg-blue-100 dark:bg-blue-900/20', borderColor: 'border-blue-500', shadowColor: 'shadow-[0_0_15px_rgba(59,130,246,0.25)]' };
  if (modelId.includes('mistral')) return { emoji: '⚡', bgColor: 'bg-orange-100 dark:bg-orange-900/20', borderColor: 'border-orange-500', shadowColor: 'shadow-[0_0_15px_rgba(249,115,22,0.25)]' };
  if (modelId.includes('llama')) return { emoji: '☢️', bgColor: 'bg-cyan-100 dark:bg-cyan-900/20', borderColor: 'border-cyan-500', shadowColor: 'shadow-[0_0_15px_rgba(6,182,212,0.25)]' };
  // Default
  return { emoji: '🤖', bgColor: 'bg-gray-100 dark:bg-gray-800', borderColor: 'border-gray-500', shadowColor: 'shadow-[0_0_15px_rgba(107,114,128,0.25)]' };
}

// Helper function to determine winner/consensus from actual debate data
function getDebateOutcome(debate: any): {
  type: 'winner' | 'consensus' | null;
  model?: string;
  summary?: string;
  borderColor: string;
  iconColor: string;
} {
  if (debate.status !== 'completed') {
    return { type: null, borderColor: '', iconColor: '' };
  }

  if (debate.winner) {
    return {
      type: 'winner',
      model: debate.winner,
      summary: debate.winningSummary,
      borderColor: 'border-yellow-500',
      iconColor: 'text-yellow-500',
    };
  }

  if (debate.consensus) {
    return {
      type: 'consensus',
      summary: debate.consensusSummary,
      borderColor: 'border-blue-400',
      iconColor: 'text-blue-400',
    };
  }

  // No result data available - show neutral state
  return {
    type: null,
    borderColor: 'border-slate-300',
    iconColor: 'text-slate-400',
  };
}

// Helper function to get best available summary for executive summary section
function getExecutiveSummary(debate: any): string {
  // Priority 1: Consensus summary if consensus reached
  if (debate.consensus && debate.consensusSummary) {
    return debate.consensusSummary;
  }

  // Priority 2: Winning summary if winner exists
  if (debate.winner && debate.winningSummary) {
    return debate.winningSummary;
  }

  // Priority 3: Moderator synthesis from first round
  if (debate.rounds?.[0]?.moderatorSynthesis) {
    return debate.rounds[0].moderatorSynthesis;
  }

  // Fallback: Use question
  return debate.question;
}

// Skeleton Loading Card Component
function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-card-dark rounded-2xl p-6 border border-gray-200 dark:border-card-border-dark shadow-card">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded shimmer" />
            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded shimmer" />
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded shimmer" />
          </div>
          <div className="h-7 w-3/4 bg-gray-200 dark:bg-gray-700 rounded shimmer" />
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 md:gap-6 mb-6 py-6 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-800">
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-200 dark:bg-gray-700 shimmer" />
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-200 dark:bg-gray-700 shimmer" />
      </div>

      <div className="mb-6 px-1">
        <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded shimmer mb-2" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded shimmer" />
          <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded shimmer" />
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-gray-100 dark:border-gray-800 pt-5">
        <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg shimmer" />
        <div className="w-12 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg shimmer" />
        <div className="w-12 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg shimmer" />
      </div>
    </div>
  );
}

export default function Library() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: debates, isLoading, refetch } = trpc.debate.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const deleteDebate = trpc.debate.delete.useMutation({
    onSuccess: () => {
      toast.success("Debate deleted");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to delete debate: " + error.message);
    },
  });

  const filteredDebates = debates?.filter(
    (debate) =>
      debate.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      debate.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      debate.tags?.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="h-full flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-y-auto p-6 md:p-8 lg:px-12 lg:py-10 scroll-smooth">
        <div className="max-w-7xl mx-auto space-y-10">

          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold tracking-wider uppercase">
                <History className="w-4 h-4" /> History Archives
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
                Your Debate <span className="gradient-text">Journey</span>
              </h1>
              <p className="text-text-light-secondary dark:text-text-dark-secondary text-lg max-w-2xl leading-relaxed">
                Review detailed logs of past dialectics. Analyze winning
                arguments, consensus points, and AI model performance metrics.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative group hidden lg:block">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type="text"
                  className="block w-64 pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-card-dark border border-gray-200 dark:border-card-border-dark text-slate-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm shadow-sm"
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Button
                onClick={() => navigate("/")}
                className="bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-6 rounded-xl shadow-glow transition-all flex items-center gap-2 group whitespace-nowrap h-12"
              >
                <Compass className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                New Exploration
              </Button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="relative group lg:hidden">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-card-dark border border-gray-200 dark:border-card-border-dark text-slate-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm shadow-sm"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : !filteredDebates || filteredDebates.length === 0 ? (
            <div className="glass-panel py-32 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 text-center space-y-8">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-3xl flex items-center justify-center mx-auto text-gray-400 shadow-lg">
                <Sparkles className="w-12 h-12 text-blue-500 dark:text-blue-400" />
              </div>
              <div className="max-w-md mx-auto space-y-3">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {searchQuery ? "No matches found" : "Your library is empty"}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-lg">
                  {searchQuery
                    ? "Try adjusting your search filters or browse all debates."
                    : "Begin your journey into the dialectic and build your personal debate history archives."}
                </p>
              </div>
              {!searchQuery && (
                <Button
                  onClick={() => navigate("/")}
                  className="bg-gradient-to-r from-primary to-[#1d4ed8] hover:from-primary-hover hover:to-[#1e40af] text-white rounded-xl h-12 px-8 font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
                >
                  Start Your First Debate
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {filteredDebates.map((debate) => {
                const participantModels = debate.participantModels as string[];
                const outcome = getDebateOutcome(debate);

                return (
                  <div
                    key={debate.id}
                    className="bg-white dark:bg-card-dark rounded-2xl p-6 border border-gray-200 dark:border-card-border-dark shadow-card hover:shadow-glow transition-all duration-300 flex flex-col"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                      <div>
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              debate.status === "completed"
                                ? "bg-green-500/10 text-neon-green border border-green-500/20 shadow-[0_0_8px_rgba(16,185,129,0.15)]"
                                : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-[0_0_8px_rgba(59,130,246,0.15)]"
                            }`}
                          >
                            {debate.status}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {participantModels.length} models
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight line-clamp-2">
                          {debate.title || debate.question}
                        </h3>
                      </div>
                      <div className="text-right hidden sm:block shrink-0">
                        <span className="text-[10px] font-mono text-gray-400 dark:text-gray-600 border border-gray-200 dark:border-gray-800 rounded px-1.5 py-0.5">
                          ID: #{debate.id}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(debate.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                    </div>

                    {/* Participants Display */}
                    <div className="flex items-center justify-center gap-4 md:gap-6 mb-6 py-6 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-800 relative overflow-hidden group-hover:border-blue-500/20 transition-colors">
                      <div
                        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
                        style={{
                          backgroundImage:
                            "radial-gradient(#64748B 1px, transparent 1px)",
                          backgroundSize: "16px 16px",
                        }}
                      />
                      {participantModels.slice(0, 2).map((modelId, index) => {
                        const model = AI_MODELS.find((m) => m.id === modelId);
                        const modelEmoji = getModelEmoji(modelId);
                        const borderColor = index === 0 ? "border-purple-500" : "border-emerald-500";
                        const shadowColor = index === 0
                          ? "shadow-[0_0_15px_rgba(168,85,247,0.25)] ring-4 ring-purple-500/10"
                          : "shadow-[0_0_15px_rgba(16,185,129,0.25)] ring-4 ring-emerald-500/10";

                        return (
                          <div
                            key={modelId}
                            className="flex flex-col items-center gap-2 z-10 relative"
                          >
                            <div
                              className={`w-16 h-16 md:w-20 md:h-20 rounded-full ${modelEmoji.bgColor} border-2 ${borderColor} ${shadowColor} flex items-center justify-center text-3xl`}
                            >
                              {modelEmoji.emoji}
                            </div>
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                              {model?.name?.split(" ")[0] || modelId}
                            </span>
                          </div>
                        );
                      })}

                      {participantModels.length >= 2 && (
                        <div className="flex flex-col items-center z-10 mx-2">
                          <span className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-800 tracking-widest drop-shadow-sm">
                            VS
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Executive Summary */}
                    <div className="mb-6 px-1">
                      <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                        Executive Summary
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
                        {getExecutiveSummary(debate)}
                      </p>
                    </div>

                    {/* Winner/Consensus Box */}
                    {outcome.type && (
                      <div className={`mt-auto mb-6 p-4 rounded-xl bg-slate-50 dark:bg-[#1A2333] border-l-4 ${outcome.borderColor} relative shadow-sm`}>
                        <div className="flex items-start gap-3">
                          <div className={`p-1.5 ${outcome.iconColor.replace('text-', 'bg-')}/10 rounded-full shrink-0`}>
                            {outcome.type === 'winner' ? (
                              <Trophy className={`w-4 h-4 ${outcome.iconColor}`} />
                            ) : (
                              <Handshake className={`w-4 h-4 ${outcome.iconColor}`} />
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                              {outcome.type === 'winner'
                                ? `Winning Argument: ${outcome.model}`
                                : 'Partial Consensus Reached'
                              }
                            </h4>
                            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 italic">
                              "{outcome.summary}"
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3 border-t border-gray-100 dark:border-gray-800 pt-5 mt-auto">
                      {debate.status === "active" ? (
                        <button
                          className="flex-1 bg-primary hover:bg-primary-hover text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-glow active:scale-95 touch-manipulation min-h-[44px]"
                          onClick={() =>
                            navigate(`/debate/${debate.id}?autostart=true`)
                          }
                        >
                          <Play className="w-5 h-5" />
                          <span className="text-sm">Resume Debate</span>
                        </button>
                      ) : (
                        <button
                          className="flex-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-neon-blue border border-cyan-500/20 font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-neon-blue active:scale-95 touch-manipulation min-h-[44px]"
                          onClick={() => navigate(`/debate/${debate.id}`)}
                        >
                          <FileText className="w-5 h-5" />
                          <span className="text-sm">Review Transcript</span>
                        </button>
                      )}

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            className="w-12 h-10 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors active:scale-95 touch-manipulation min-h-[44px]"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="glass-card rounded-2xl p-6">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
                              Delete Exploration?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-500">
                              This will permanently remove this dialectic session
                              from your archives. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="mt-6 gap-3">
                            <AlertDialogCancel className="rounded-xl border-gray-200 dark:border-gray-800 h-10 px-4 font-medium">
                              Keep it
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteDebate.mutate({ debateId: debate.id });
                              }}
                              className="bg-red-500 hover:bg-red-600 text-white rounded-xl h-10 px-6 font-medium"
                            >
                              Delete Forever
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </DashboardLayout>
  );
}
