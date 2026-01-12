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
  Loader2,
  Search,
  Trash2,
  Play,
  Calendar,
  MessageSquare,
  Eye,
  Plus,
  BookOpen,
  ArrowRight,
  Clock
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

  const filteredDebates = debates?.filter(debate =>
    debate.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    debate.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    debate.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="h-full flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-full premium-bg p-6 lg:p-10">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-[0.3em] mb-1">
                <BookOpen className="h-4 w-4" />
                Knowledge Base
              </div>
              <h1 className="text-4xl font-black tracking-tight text-foreground">
                Debate <span className="text-primary italic">Library</span>
              </h1>
              <p className="text-muted-foreground text-sm max-w-md">
                Review and continue your previous dialectic sessions. Manage your collection of AI-powered explorations.
              </p>
            </div>

            <Button onClick={() => navigate("/")} className="bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-xl shadow-lg shadow-primary/20 gap-2">
              <Plus className="h-5 w-5" />
              New Exploration
            </Button>
          </div>

          {/* Search & Stats */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
              <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-2xl"></div>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <Input
                placeholder="Search by topic, model, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 bg-background/40 backdrop-blur-xl border-white/5 rounded-2xl text-lg focus:ring-primary focus:border-primary/50 transition-all shadow-inner"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Indexing Archives...</p>
            </div>
          ) : (!filteredDebates || filteredDebates.length === 0) ? (
            <div className="glass-panel py-24 rounded-[2.5rem] border-dashed border-white/10 text-center space-y-6">
              <div className="bg-white/5 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto text-muted-foreground">
                <MessageSquare className="h-10 w-10" />
              </div>
              <div className="max-w-xs mx-auto space-y-2">
                <h3 className="text-xl font-bold">
                  {searchQuery ? "No matches found" : "Your library is empty"}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {searchQuery
                    ? "Try adjusting your search filters or browse all debates."
                    : "Begin your journey into the dialectic and build your personal knowledge base."}
                </p>
              </div>
              {!searchQuery && (
                <Button onClick={() => navigate("/")} variant="outline" className="rounded-xl border-white/10 hover:bg-white/5 h-12 px-8 font-bold">
                  Start First Debate
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDebates.map((debate) => {
                const participantModels = debate.participantModels as string[];
                const tags = debate.tags as string[] | null;

                return (
                  <Card key={debate.id} className="group relative glass-panel border-none shadow-xl hover:shadow-primary/5 hover:translate-y-[-4px] transition-all duration-300 rounded-[2rem] overflow-hidden flex flex-col h-full">
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/40 hover:text-destructive hover:bg-destructive/10 rounded-lg" onClick={(e) => e.stopPropagation()}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="glass-panel border-white/10 rounded-3xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl font-black">Erasure requested?</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-300">
                              This will permanently remove this dialectic exploration from the archives. This action is irreversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl border-white/10">Keep it</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={(e) => { e.stopPropagation(); deleteDebate.mutate({ debateId: debate.id }); }}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                            >
                              Delete Forever
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    <CardHeader className="p-6 pb-2">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant={debate.status === "completed" ? "secondary" : "default"} className={`rounded-md text-[10px] font-black tracking-widest uppercase px-2 py-0.5 ${debate.status === 'completed' ? 'bg-white/5 text-slate-400' : 'bg-primary/20 text-primary border-primary/20'}`}>
                          {debate.status}
                        </Badge>
                        <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 uppercase tracking-tighter">
                          <Clock className="h-3 w-3" />
                          {new Date(debate.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <CardTitle className="text-lg font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {debate.title || debate.question}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="p-6 pt-2 flex-1 flex flex-col justify-between gap-6">
                      <div className="space-y-4">
                        <div className="flex -space-x-2">
                          {participantModels.slice(0, 5).map((modelId) => {
                            const model = AI_MODELS.find(m => m.id === modelId);
                            return (
                              <div key={modelId} className="w-8 h-8 rounded-full bg-background border-2 border-slate-900 flex items-center justify-center text-sm shadow-sm" title={model?.name}>
                                {model?.icon || "🤖"}
                              </div>
                            );
                          })}
                          {participantModels.length > 5 && (
                            <div className="w-8 h-8 rounded-full bg-background border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                              +{participantModels.length - 5}
                            </div>
                          )}
                        </div>

                        {tags && tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="text-[10px] font-bold uppercase tracking-widest bg-white/5 text-slate-400 px-2 py-1 rounded-md border border-white/5">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-white/5 mt-auto">
                        <Button
                          variant="ghost"
                          className="flex-1 rounded-xl h-11 font-bold group/btn"
                          onClick={() => navigate(`/debate/${debate.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2 opacity-50 group-hover/btn:opacity-100 group-hover/btn:scale-110 transition-all" />
                          Review
                        </Button>

                        {debate.status === "active" ? (
                          <Button
                            className="flex-1 bg-primary hover:bg-primary/90 text-white rounded-xl h-11 font-bold shadow-lg shadow-primary/10 group/btn"
                            onClick={() => navigate(`/debate/${debate.id}?autostart=true`)}
                          >
                            <Play className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-all fill-current" />
                            Resume
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            className="flex-1 border-white/5 hover:bg-white/5 rounded-xl h-11 font-bold group/btn"
                            onClick={() => navigate(`/debate/${debate.id}`)}
                          >
                            <ArrowRight className="h-4 w-4 mr-2 group-hover/btn:translate-x-1 transition-all" />
                            Open
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
