import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import {
  Plus,
  Trash2,
  Play,
  MessageSquare,
  Eye,
  ArrowRight,
  Clock,
  Search,
  History as HistoryIcon,
  StopCircle
} from "lucide-react";
import { toast } from "sonner";
import { AI_MODELS } from "../../../shared/models";
import DashboardLayout from "@/components/DashboardLayout";

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

  const filteredDebates = debates?.filter(debate =>
    debate.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    debate.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    debate.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="h-full flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display transition-colors duration-300 antialiased selection:bg-primary/30 min-h-full pb-20 p-6 lg:p-10">
        <div className="max-w-7xl mx-auto space-y-12">

          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-300 text-[10px] font-bold uppercase tracking-widest">
                <HistoryIcon className="h-3 w-3" />
                History Archives
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                Your Debate <span className="text-primary italic">Journey</span>
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl leading-relaxed">
                Review and continue your complex discussions. Every exploration is stored here for deep analysis and future reference.
              </p>
            </div>

            <Button
              onClick={() => navigate("/")}
              className="bg-primary hover:bg-blue-500 text-white h-14 px-8 rounded-2xl font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all flex items-center gap-2 group"
            >
              <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
              New Exploration
            </Button>
          </div>

          {/* Search Bar */}
          <div className="w-full relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-[2rem] blur opacity-10 group-focus-within:opacity-30 transition duration-1000"></div>
            <div className="relative bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800/60 rounded-[1.5rem] p-1 shadow-xl">
              <div className="relative flex items-center px-6 h-14 bg-slate-50 dark:bg-[#131b2e] rounded-[1.2rem]">
                <Search className="h-5 w-5 text-slate-400 mr-4" />
                <input
                  placeholder="Search your dialectic archives..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 font-medium"
                />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-[320px] rounded-[2rem] bg-slate-100 dark:bg-slate-800/50 animate-pulse"></div>
              ))}
            </div>
          ) : (!filteredDebates || filteredDebates.length === 0) ? (
            <div className="glass-panel py-32 rounded-[3rem] border-dashed border-slate-200 dark:border-slate-800 text-center space-y-8">
              <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800/50 rounded-3xl flex items-center justify-center mx-auto text-slate-400">
                <span className="material-symbols-outlined text-5xl">folder_off</span>
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
                <Button onClick={() => navigate("/")} variant="outline" className="rounded-2xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 h-14 px-10 font-bold text-lg">
                  Start First Debate
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredDebates.map((debate) => {
                const participantModels = debate.participantModels as string[];
                const tags = debate.tags as string[] | null;

                return (
                  <div
                    key={debate.id}
                    className="group relative bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden flex flex-col h-full shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 card-hover"
                  >
                    <div className="p-8 pb-4">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase border ${debate.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20'}`}>
                            {debate.status}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-widest">
                            <Clock className="h-3 w-3" />
                            {new Date(debate.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-2xl font-extrabold text-slate-900 dark:text-white">Delete Exploration?</AlertDialogTitle>
                              <AlertDialogDescription className="text-slate-500 dark:text-slate-400 text-lg">
                                This will permanently remove this dialectic session from your archives. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="mt-8 gap-3">
                              <AlertDialogCancel className="rounded-2xl border-slate-200 dark:border-slate-800 h-12 px-6 font-bold">Keep it</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={(e) => { e.stopPropagation(); deleteDebate.mutate({ debateId: debate.id }); }}
                                className="bg-red-500 hover:bg-red-600 text-white rounded-2xl h-12 px-8 font-bold"
                              >
                                Delete Forever
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>

                      <h3 className="text-xl font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-6 text-slate-900 dark:text-white">
                        {debate.title || debate.question}
                      </h3>

                      <div className="flex -space-x-2.5 mb-6">
                        {participantModels.slice(0, 5).map((modelId) => {
                          const model = AI_MODELS.find(m => m.id === modelId);
                          return (
                            <div key={modelId} className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 border-2 border-white dark:border-surface-dark flex items-center justify-center text-lg shadow-sm" title={model?.name}>
                              {model?.icon || "🤖"}
                            </div>
                          );
                        })}
                        {participantModels.length > 5 && (
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-surface-dark flex items-center justify-center text-[10px] font-bold text-slate-400">
                            +{participantModels.length - 5}
                          </div>
                        )}
                      </div>

                      {tags && tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-8">
                          {tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-[10px] font-bold uppercase tracking-widest bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-lg border border-slate-100 dark:border-slate-700/50">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="p-8 pt-0 mt-auto">
                      <div className="flex items-center gap-3 pt-6 border-t border-slate-100 dark:border-slate-800/50">
                        <button
                          className="flex-1 h-12 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                          onClick={() => navigate(`/debate/${debate.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                          Review
                        </button>

                        {debate.status === 'active' && (
                          <button
                            className="h-12 px-4 rounded-xl border border-red-200 dark:border-red-500/20 font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
                            onClick={() => endDebate.mutate({ debateId: debate.id, useUserApiKey: sessionStorage.getItem('useUserApiKey') === 'true' })}
                            disabled={endDebate.isPending}
                          >
                            <StopCircle className="h-4 w-4" />
                            End
                          </button>
                        )}

                        <button
                          className={`flex-1 h-12 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${debate.status === 'active' ? 'bg-primary text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500' : 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'}`}
                          onClick={() => navigate(`/debate/${debate.id}${debate.status === 'active' ? '?autostart=true' : ''}`)}
                        >
                          {debate.status === "active" ? (
                            <><Play className="h-4 w-4 fill-current" /> Resume</>
                          ) : (
                            <><ArrowRight className="h-4 w-4" /> Open</>
                          )}
                        </button>
                      </div>
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
