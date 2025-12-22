import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Sparkles, ArrowLeft, Search, Trash2, Play, Calendar, MessageSquare, LogIn } from "lucide-react";
import { toast } from "sonner";
import { AI_MODELS } from "../../../shared/models";

export default function Library() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch debates
  const { data: debates, isLoading, refetch } = trpc.debate.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  
  // Delete mutation
  const deleteDebate = trpc.debate.delete.useMutation({
    onSuccess: () => {
      toast.success("Debate deleted");
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to delete debate: " + error.message);
    },
  });

  // Filter debates by search
  const filteredDebates = debates?.filter(debate => 
    debate.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    debate.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    debate.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="container py-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Debate Library</h1>
            </div>
          </div>
        </header>
        <main className="container py-16">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle>Sign in to View Library</CardTitle>
              <CardDescription>
                Access your saved debates and continue previous discussions.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button size="lg" onClick={() => window.location.href = getLoginUrl()}>
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Debate Library</h1>
            </div>
          </div>
          <Button onClick={() => navigate("/")}>
            <Sparkles className="h-4 w-4 mr-2" />
            New Debate
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="max-w-4xl mx-auto">
          {/* Search */}
          <div className="relative mb-8">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search debates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Empty State */}
          {!isLoading && (!filteredDebates || filteredDebates.length === 0) && (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">
                  {searchQuery ? "No debates found" : "No debates yet"}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery 
                    ? "Try a different search term" 
                    : "Start your first AI debate to see it here"}
                </p>
                {!searchQuery && (
                  <Button onClick={() => navigate("/")}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Start First Debate
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Debate List */}
          <div className="space-y-4">
            {filteredDebates?.map((debate) => {
              const participantModels = debate.participantModels as string[];
              const tags = debate.tags as string[] | null;
              
              return (
                <Card key={debate.id} className="hover:border-primary/30 transition-colors">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground line-clamp-2 mb-2">
                          {debate.title || debate.question}
                        </h3>
                        
                        {/* Metadata */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(debate.createdAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5" />
                            {participantModels.length} participants
                          </span>
                          <Badge variant={debate.status === "completed" ? "secondary" : "default"}>
                            {debate.status}
                          </Badge>
                        </div>
                        
                        {/* Participants */}
                        <div className="flex items-center gap-2 mb-3">
                          {participantModels.slice(0, 4).map((modelId) => {
                            const model = AI_MODELS.find(m => m.id === modelId);
                            return (
                              <span key={modelId} className="text-lg" title={model?.name}>
                                {model?.icon || "🤖"}
                              </span>
                            );
                          })}
                          {participantModels.length > 4 && (
                            <span className="text-sm text-muted-foreground">
                              +{participantModels.length - 4} more
                            </span>
                          )}
                        </div>
                        
                        {/* Tags */}
                        {tags && tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/debate/${debate.id}`)}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Continue
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Debate?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this debate and all its rounds. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteDebate.mutate({ debateId: debate.id })}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
