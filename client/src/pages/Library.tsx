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
  Trash2,
  Play,
  Eye,
  ArrowRight,
  Clock,
  Search,
  History as HistoryIcon,
  StopCircle,
  Download,
  Trophy,
  FileText,
  Loader2,
  Flame,
  Zap,
  Handshake,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { AI_MODELS } from "../../../shared/models";
import DashboardLayout from "@/components/DashboardLayout";
import { getModelAvatar } from "@/config/avatarConfig";

// Helper function to estimate duration from debate data
function estimateDuration(debate: any): string {
  // If we have actual duration data, use it
  if (debate.duration) {
    const minutes = Math.floor(debate.duration / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  }

  // Otherwise estimate based on message count or created date
  // This is placeholder logic - adjust based on your actual data
  const estimatedMinutes = Math.floor(Math.random() * 120) + 30; // Random 30-150 min
  const hours = Math.floor(estimatedMinutes / 60);
  const remainingMinutes = estimatedMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${estimatedMinutes}m`;
}

// Helper function to estimate intensity
function estimateIntensity(debate: any): { level: string; icon: typeof Flame; color: string } {
  // This is placeholder logic - you can adjust based on actual metrics
  // like message count, word count, sentiment analysis, etc.
  const intensityLevels = [
    { level: "High Intensity", icon: Flame, color: "text-red-400" },
    { level: "Med Intensity", icon: Zap, color: "text-yellow-500" },
    { level: "Extreme Intensity", icon: Flame, color: "text-orange-500" },
  ];

  // Random for now - replace with actual logic
  return intensityLevels[Math.floor(Math.random() * intensityLevels.length)];
}

// Helper function to determine winner/consensus
function getDebateOutcome(debate: any): {
  type: 'winner' | 'consensus' | null;
  model?: string;
  summary?: string;
  borderColor: string;
  iconColor: string;
} {
  // This is placeholder logic - adjust based on your actual results data
  if (debate.status !== 'completed') {
    return { type: null, borderColor: '', iconColor: '' };
  }

  // Check if we have actual winner/consensus data
  if (debate.winner) {
    return {
      type: 'winner',
      model: debate.winner,
      summary: debate.winningSummary || "Compelling arguments based on data-driven insights and logical reasoning.",
      borderColor: 'border-yellow-500',
      iconColor: 'text-yellow-500',
    };
  }

  if (debate.consensus) {
    return {
      type: 'consensus',
      summary: debate.consensusSummary || "Both models reached agreement on key foundational principles.",
      borderColor: 'border-blue-400',
      iconColor: 'text-blue-400',
    };
  }

  // Fallback - randomly assign for demonstration
  const hasWinner = Math.random() > 0.4;

  if (hasWinner) {
    const participantModels = debate.participantModels as string[];
    const winnerModel = participantModels[Math.floor(Math.random() * participantModels.length)];
    const model = AI_MODELS.find(m => m.id === winnerModel);

    return {
      type: 'winner',
      model: model?.name || winnerModel,
      summary: "Compelling arguments based on data-driven insights and logical reasoning.",
      borderColor: Math.random() > 0.5 ? 'border-yellow-500' : 'border-cyan-500',
      iconColor: Math.random() > 0.5 ? 'text-yellow-500' : 'text-cyan-500',
    };
  }

  return {
    type: 'consensus',
    summary: "Both models reached agreement on key foundational principles.",
    borderColor: 'border-blue-400',
    iconColor: 'text-blue-400',
  };
}

// Skeleton Loading Card Component
function SkeletonCard() {
  return (
    <div className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-[#1F2937] shadow-sm premium-transition">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded shimmer" />
            <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded shimmer" />
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded shimmer" />
          </div>
          <div className="h-7 w-3/4 bg-slate-200 dark:bg-slate-700 rounded shimmer" />
        </div>
      </div>

      {/* Participants Skeleton */}
      <div className="flex items-center justify-center gap-4 mb-6 py-5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
        <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-700 shimmer" />
        <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-slate-700 shimmer" />
      </div>

      {/* Summary Skeleton */}
      <div className="mb-6 px-1">
        <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded shimmer mb-2" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded shimmer" />
          <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-700 rounded shimmer" />
        </div>
      </div>

      {/* Actions Skeleton */}
      <div className="flex items-center gap-3 border-t border-slate-100 dark:border-slate-800 pt-5">
        <div className="flex-1 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl shimmer" />
        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl shimmer" />
        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl shimmer" />
      </div>
    </div>
  );
}

export default function Library() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSummaries, setExpandedSummaries] = useState<Set<number>>(new Set());

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

  const endDebate = trpc.results.endDebate.useMutation({
    onSuccess: () => {
      toast.success("Debate ended successfully");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to end debate: " + error.message);
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

  const toggleSummary = (debateId: number) => {
    setExpandedSummaries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(debateId)) {
        newSet.delete(debateId);
      } else {
        newSet.add(debateId);
      }
      return newSet;
    });
  };

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
      <div className="flex-1 overflow-y-auto p-6 md:p-8 lg:px-12 lg:py-10">
        <div className="max-w-7xl mx-auto space-y-10">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold tracking-wider uppercase premium-transition">
                <HistoryIcon className="w-3.5 h-3.5" /> History Archives
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
                Your Debate{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-primary">
                  Journey
                </span>
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl leading-relaxed">
                Review detailed logs of past dialectics. Analyze winning
                arguments, consensus points, and AI model performance metrics.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Search Input */}
              <div className="relative group hidden lg:block">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type="text"
                  className="block w-64 pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-card border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm shadow-sm premium-transition"
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Button
                onClick={() => navigate("/")}
                className="bg-gradient-to-r from-primary to-[#1d4ed8] hover:from-primary-hover hover:to-[#1e40af] text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 premium-transition flex items-center gap-2 group whitespace-nowrap h-12 pulse-ring"
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 premium-transition" />
                New Exploration
              </Button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="relative group lg:hidden">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-card border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm shadow-sm premium-transition"
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
            <div className="glass-panel py-32 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-8 premium-transition">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-3xl flex items-center justify-center mx-auto text-slate-400 shadow-lg">
                <Sparkles className="w-12 h-12 text-blue-500 dark:text-blue-400" />
              </div>
              <div className="max-w-md mx-auto space-y-3">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {searchQuery ? "No matches found" : "Your library is empty"}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-lg">
                  {searchQuery
                    ? "Try adjusting your search filters or browse all debates."
                    : "Begin your journey into the dialectic and build your personal debate history archives."}
                </p>
              </div>
              {!searchQuery && (
                <Button
                  onClick={() => navigate("/")}
                  className="bg-gradient-to-r from-primary to-[#1d4ed8] hover:from-primary-hover hover:to-[#1e40af] text-white rounded-xl h-12 px-8 font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 premium-transition"
                >
                  Start Your First Debate
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {filteredDebates.map((debate) => {
                const participantModels = debate.participantModels as string[];
                const tags = debate.tags as string[] | null;
                const duration = estimateDuration(debate);
                const intensity = estimateIntensity(debate);
                const outcome = getDebateOutcome(debate);
                const isExpanded = expandedSummaries.has(debate.id);
                const summaryText = debate.question;
                const shouldShowExpand = summaryText.length > 150;

                return (
                  <div
                    key={debate.id}
                    className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-[#1F2937] shadow-sm hover:shadow-xl premium-transition flex flex-col"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                      <div>
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider premium-transition ${
                              debate.status === "completed"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.15)]"
                                : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-[0_0_8px_rgba(59,130,246,0.15)]"
                            }`}
                          >
                            {debate.status}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {duration}
                          </span>
                          <span className={`text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1`}>
                            <intensity.icon className={`w-3.5 h-3.5 ${intensity.color}`} />
                            {intensity.level}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight line-clamp-2">
                          {debate.title || debate.question}
                        </h3>
                      </div>
                      <div className="text-right hidden sm:block shrink-0">
                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5">
                          ID: #{debate.id}
                        </span>
                        <div className="text-xs text-slate-500 mt-1">
                          {new Date(debate.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    {/* Participants Display */}
                    <div className="flex items-center justify-center gap-4 mb-6 py-5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 relative overflow-hidden premium-transition">
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
                        const avatar = getModelAvatar(
                          modelId,
                          debate.modelAvatars as Record<string, string> | null
                        );
                        return (
                          <div
                            key={modelId}
                            className="flex flex-col items-center gap-2 z-10 relative"
                          >
                            <div
                              className={`w-14 h-14 rounded-full border-2 flex items-center justify-center overflow-hidden premium-transition hover:scale-110 ${
                                index === 0
                                  ? "border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.25)] ring-4 ring-purple-500/10"
                                  : "border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.25)] ring-4 ring-emerald-500/10"
                              }`}
                            >
                              <img
                                src={avatar}
                                alt={model?.name || modelId}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "/avatars/default.png";
                                }}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                              {model?.name?.split(" ")[0] || modelId}
                            </span>
                          </div>
                        );
                      })}
                      {participantModels.length > 2 && (
                        <>
                          <div className="flex flex-col items-center z-10">
                            <span className="text-2xl font-black italic text-slate-300 dark:text-slate-700">
                              VS
                            </span>
                          </div>
                          <div className="flex flex-col items-center gap-2 z-10 relative">
                            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center premium-transition hover:scale-110">
                              <span className="text-sm font-bold text-slate-500">
                                +{participantModels.length - 2}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                              More
                            </span>
                          </div>
                        </>
                      )}
                      {participantModels.length === 2 && (
                        <div className="flex flex-col items-center z-10 mx-2">
                          <span className="text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-b from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-800 tracking-widest">
                            VS
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {tags && tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] font-bold uppercase tracking-widest bg-slate-50 dark:bg-slate-800 text-slate-500 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-700 premium-transition hover:bg-slate-100 dark:hover:bg-slate-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Executive Summary with Expand */}
                    <div className="mb-6 px-1">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                        Executive Summary
                      </h4>
                      <div className="relative">
                        <p className={`text-sm text-slate-600 dark:text-slate-300 leading-relaxed ${!isExpanded && shouldShowExpand ? 'line-clamp-4' : ''}`}>
                          {summaryText}
                        </p>
                        {shouldShowExpand && (
                          <button
                            onClick={() => toggleSummary(debate.id)}
                            className="mt-2 text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1 premium-transition"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-3.5 h-3.5" />
                                Show Less
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3.5 h-3.5" />
                                Expand
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Winner/Consensus Box */}
                    {outcome.type && (
                      <div className={`mb-6 p-4 rounded-xl bg-slate-50 dark:bg-[#1A2333] border-l-4 ${outcome.borderColor} relative shadow-sm premium-transition`}>
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
                    <div className="flex items-center gap-3 border-t border-slate-100 dark:border-slate-800 pt-5 mt-auto">
                      {debate.status === "active" ? (
                        <button
                          className="flex-1 bg-gradient-to-r from-primary to-[#1060D8] hover:from-primary-hover hover:to-[#1d4ed8] text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 premium-transition shadow-lg shadow-blue-500/20 hover:shadow-[0_0_20px_rgba(47,129,247,0.4)] hover:brightness-110"
                          onClick={() =>
                            navigate(`/debate/${debate.id}?autostart=true`)
                          }
                        >
                          <Play className="w-4 h-4 fill-current" />
                          <span className="text-sm">Resume Debate</span>
                        </button>
                      ) : (
                        <button
                          className="flex-1 bg-gradient-to-r from-cyan-500/10 to-cyan-600/10 hover:from-cyan-500/20 hover:to-cyan-600/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 premium-transition shadow-[0_0_15px_rgba(6,182,212,0.25)] hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:brightness-110"
                          onClick={() => navigate(`/debate/${debate.id}`)}
                        >
                          <FileText className="w-4 h-4" />
                          <span className="text-sm">Review Transcript</span>
                        </button>
                      )}

                      <button
                        className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 premium-transition hover:scale-110"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 premium-transition hover:scale-110"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="glass-card rounded-2xl p-6">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
                              Delete Exploration?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-500">
                              This will permanently remove this dialectic session
                              from your archives. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="mt-6 gap-3">
                            <AlertDialogCancel className="rounded-xl border-slate-200 dark:border-slate-800 h-10 px-4 font-medium premium-transition">
                              Keep it
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteDebate.mutate({ debateId: debate.id });
                              }}
                              className="bg-red-500 hover:bg-red-600 text-white rounded-xl h-10 px-6 font-medium premium-transition"
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

          {/* Load More */}
          {filteredDebates && filteredDebates.length > 0 && (
            <div className="flex justify-center pt-8 pb-8">
              <button className="text-sm font-semibold text-slate-500 hover:text-primary premium-transition flex items-center gap-2 px-6 py-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                <HistoryIcon className="w-4 h-4" /> Load older debates
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
