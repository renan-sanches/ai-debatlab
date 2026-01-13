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
} from "lucide-react";
import { toast } from "sonner";
import { AI_MODELS } from "../../../shared/models";
import DashboardLayout from "@/components/DashboardLayout";
import { getModelAvatar } from "@/config/avatarConfig";

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
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold tracking-wider uppercase">
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
                  className="block w-64 pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-card border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm shadow-sm"
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Button
                onClick={() => navigate("/")}
                className="bg-primary hover:bg-primary-hover text-white font-semibold py-3 px-6 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 group whitespace-nowrap h-12"
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
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
              className="block w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-card border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm shadow-sm"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-[320px] rounded-2xl bg-slate-100 dark:bg-slate-800/50 animate-pulse"
                />
              ))}
            </div>
          ) : !filteredDebates || filteredDebates.length === 0 ? (
            <div className="glass-panel py-32 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-8">
              <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800/50 rounded-3xl flex items-center justify-center mx-auto text-slate-400">
                <FileText className="w-12 h-12" />
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
                  variant="outline"
                  className="rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 h-12 px-8 font-bold"
                >
                  Start First Debate
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {filteredDebates.map((debate) => {
                const participantModels = debate.participantModels as string[];
                const tags = debate.tags as string[] | null;

                return (
                  <div
                    key={debate.id}
                    className="bg-white dark:bg-card rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                      <div>
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              debate.status === "completed"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                            }`}
                          >
                            {debate.status}
                          </span>
                          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(debate.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight line-clamp-2">
                          {debate.title || debate.question}
                        </h3>
                      </div>
                      <div className="text-right hidden sm:block shrink-0">
                        <span className="text-[10px] font-mono text-slate-400 border border-slate-200 dark:border-slate-800 rounded px-1.5 py-0.5">
                          ID: #{debate.id}
                        </span>
                      </div>
                    </div>

                    {/* Participants Display */}
                    <div className="flex items-center justify-center gap-4 mb-6 py-5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
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
                              className={`w-14 h-14 rounded-full border-2 flex items-center justify-center overflow-hidden ${
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
                            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center">
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
                            className="text-[10px] font-bold uppercase tracking-widest bg-slate-50 dark:bg-slate-800 text-slate-500 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Executive Summary Placeholder */}
                    <div className="mb-6 px-1">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                        Topic
                      </h4>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                        {debate.question}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 border-t border-slate-100 dark:border-slate-800 pt-5 mt-auto">
                      {debate.status === "active" ? (
                        <button
                          className="flex-1 bg-primary hover:bg-primary-hover text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                          onClick={() =>
                            navigate(`/debate/${debate.id}?autostart=true`)
                          }
                        >
                          <Play className="w-4 h-4 fill-current" />
                          <span className="text-sm">Resume Debate</span>
                        </button>
                      ) : (
                        <button
                          className="flex-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all"
                          onClick={() => navigate(`/debate/${debate.id}`)}
                        >
                          <FileText className="w-4 h-4" />
                          <span className="text-sm">Review Transcript</span>
                        </button>
                      )}

                      <button
                        className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            className="w-10 h-10 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white dark:bg-card border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
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
                            <AlertDialogCancel className="rounded-xl border-slate-200 dark:border-slate-800 h-10 px-4 font-medium">
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

          {/* Load More */}
          {filteredDebates && filteredDebates.length > 0 && (
            <div className="flex justify-center pt-8 pb-8">
              <button className="text-sm font-semibold text-slate-500 hover:text-primary transition-colors flex items-center gap-2 px-6 py-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                <HistoryIcon className="w-4 h-4" /> Load older debates
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
