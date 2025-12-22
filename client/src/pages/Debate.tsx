import { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useSearch } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2, Sparkles, ChevronDown, ChevronUp, ArrowLeft, Download, Eye, MessageSquare, Coins, Pencil, Check, X, Trophy, Target, Vote, Lightbulb, Drama, Flag } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { AI_MODELS } from "../../../shared/models";
import { useStreamingResponse } from "@/hooks/useStreamingResponse";

interface ResponseCardProps {
  modelId: string;
  modelName: string;
  content: string;
  isDevilsAdvocate: boolean;
  timestamp?: Date;
  voteCount?: number;
  isCollapsible?: boolean;
  isStreaming?: boolean;
}

function ResponseCard({ modelId, modelName, content, isDevilsAdvocate, timestamp, voteCount, isCollapsible = true, isStreaming = false }: ResponseCardProps) {
  const [isOpen, setIsOpen] = useState(true);
  const model = AI_MODELS.find(m => m.id === modelId);
  
  const cardContent = (
    <div className="prose-debate">
      <Streamdown>{content}</Streamdown>
    </div>
  );

  return (
    <Card className="response-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{model?.icon || "🤖"}</span>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {modelName}
                {isDevilsAdvocate && (
                  <span className="text-sm bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                    🎭 Devil's Advocate
                  </span>
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                {timestamp ? new Date(timestamp).toLocaleTimeString() : ""}
                {isStreaming && (
                  <span className="flex items-center gap-1 text-primary">
                    <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    Generating...
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {voteCount !== undefined && voteCount > 0 && (
              <span className="text-sm bg-primary/20 text-primary px-2 py-1 rounded-full">
                🗳️ {voteCount} vote{voteCount !== 1 ? "s" : ""}
              </span>
            )}
            {isCollapsible && (
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      {isCollapsible ? (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleContent>
            <CardContent>{cardContent}</CardContent>
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <CardContent>{cardContent}</CardContent>
      )}
    </Card>
  );
}

export default function Debate() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const debateId = parseInt(params.id || "0");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentModelIndex, setCurrentModelIndex] = useState(0);
  const [showModerator, setShowModerator] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [totalUsage, setTotalUsage] = useState({ tokens: 0, cost: 0 });
  const [streamingModelId, setStreamingModelId] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState<Record<string, string>>({});
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState("");
  const hasAutoStarted = useRef(false);
  const searchParams = useSearch();
  
  // Check if user wants to use their API key
  const useUserApiKey = sessionStorage.getItem('useUserApiKey') === 'true';
  
  // Streaming hook
  const { startStreaming, isStreaming: isStreamingActive } = useStreamingResponse({
    onToken: (token, modelId) => {
      setStreamingContent(prev => ({
        ...prev,
        [modelId]: (prev[modelId] || "") + token,
      }));
    },
    onComplete: (response) => {
      if (response.usage) {
        setTotalUsage(prev => ({
          tokens: prev.tokens + response.usage!.totalTokens,
          cost: prev.cost + response.usage!.estimatedCost,
        }));
      }
    },
  });
  
  // Fetch debate data
  const { data: debate, refetch } = trpc.debate.get.useQuery(
    { debateId },
    { enabled: debateId > 0 && isAuthenticated }
  );
  
  // Mutations
  const generateResponse = trpc.debate.generateResponse.useMutation();
  const generateVotes = trpc.debate.generateVotes.useMutation();
  const generateModerator = trpc.debate.generateModeratorSynthesis.useMutation();
  const startNewRound = trpc.debate.startNewRound.useMutation();
  const updateDebate = trpc.debate.update.useMutation();
  const endDebate = trpc.results.endDebate.useMutation();
  const { data: debateResult } = trpc.results.getResult.useQuery(
    { debateId },
    { enabled: debate?.status === "completed" }
  );
  
  const [showFinalResults, setShowFinalResults] = useState(false);
  const [finalResults, setFinalResults] = useState<{
    finalAssessment: string;
    synthesis: string | null;
    moderatorTopPick: string | null;
    peerVotes: Record<string, number>;
    strongestArguments: string[];
    devilsAdvocateSuccess: boolean;
    pointsAwarded: Record<string, {
      total: number;
      moderatorPick: number;
      peerVotes: number;
      strongArguments: number;
      devilsAdvocateBonus: number;
    }>;
  } | null>(null);

  const currentRound = debate?.rounds?.[debate.rounds.length - 1];
  const allResponsesComplete = currentRound?.responses?.length === debate?.participantModels?.length;

  // Auto-start debate if coming from home page with autostart param
  useEffect(() => {
    if (
      debate &&
      currentRound &&
      !hasAutoStarted.current &&
      searchParams.includes("autostart=true") &&
      (!currentRound.responses || currentRound.responses.length === 0) &&
      !isGenerating
    ) {
      hasAutoStarted.current = true;
      handleStartGeneration();
    }
  }, [debate, currentRound, searchParams]);
  const votingComplete = !debate?.votingEnabled || (currentRound?.votes?.length || 0) > 0;
  const moderatorComplete = !!currentRound?.moderatorSynthesis;

  // Calculate vote counts
  const getVoteCount = (modelId: string) => {
    return currentRound?.votes?.filter(v => v.votedForModelId === modelId).length || 0;
  };

  // Start generating responses with streaming
  const handleStartGeneration = async () => {
    if (!debate || !currentRound) return;
    
    setIsGenerating(true);
    setCurrentModelIndex(0);
    setStreamingContent({});
    
    try {
      // Generate responses sequentially with streaming
      for (let i = 0; i < debate.participantModels.length; i++) {
        const modelId = debate.participantModels[i];
        setCurrentModelIndex(i);
        setStreamingModelId(modelId);
        setStreamingContent(prev => ({ ...prev, [modelId]: "" }));
        
        // Use streaming endpoint
        const response = await startStreaming(
          debateId,
          currentRound.id,
          modelId,
          i + 1,
          useUserApiKey
        );
        
        setStreamingModelId(null);
        await refetch();
      }
      
      // Generate votes if enabled
      if (debate.votingEnabled) {
        toast.info("Generating votes...");
        await generateVotes.mutateAsync({
          debateId,
          roundId: currentRound.id,
          useUserApiKey,
        });
        await refetch();
      }
      
      toast.success("All responses generated!");
    } catch (error) {
      toast.error("Error generating responses: " + (error as Error).message);
    } finally {
      setIsGenerating(false);
      setStreamingModelId(null);
    }
  };

  // Generate moderator synthesis
  const handleShowModerator = async () => {
    if (!debate || !currentRound) return;
    
    setShowModerator(true);
    
    try {
      const result = await generateModerator.mutateAsync({
        debateId,
        roundId: currentRound.id,
        useUserApiKey,
      });
      
      // Track usage
      if (result.usage) {
        setTotalUsage(prev => ({
          tokens: prev.tokens + result.usage!.totalTokens,
          cost: prev.cost + result.usage!.estimatedCost,
        }));
      }
      await refetch();
      toast.success("Moderator analysis complete!");
    } catch (error) {
      toast.error("Error generating moderator analysis: " + (error as Error).message);
    }
  };

  // Start new round
  const handleStartNewRound = async () => {
    if (!debate || !followUpQuestion.trim()) {
      toast.error("Please enter a follow-up question");
      return;
    }
    
    try {
      await startNewRound.mutateAsync({
        debateId,
        followUpQuestion: followUpQuestion.trim(),
      });
      setFollowUpQuestion("");
      setShowModerator(false);
      await refetch();
      toast.success("New round started!");
    } catch (error) {
      toast.error("Error starting new round: " + (error as Error).message);
    }
  };

  // Export debate
  const handleExport = (format: "markdown" | "pdf") => {
    if (!debate) return;
    
    let content = `# ${debate.question}\n\n`;
    content += `*Created: ${new Date(debate.createdAt).toLocaleString()}*\n\n`;
    
    debate.rounds?.forEach((round, roundIndex) => {
      content += `## Round ${round.roundNumber}\n\n`;
      if (round.followUpQuestion) {
        content += `**Follow-up Question:** ${round.followUpQuestion}\n\n`;
      }
      
      round.responses?.forEach((response) => {
        const daLabel = response.isDevilsAdvocate ? " 🎭 (Devil's Advocate)" : "";
        content += `### ${response.modelName}${daLabel}\n\n`;
        content += `${response.content}\n\n`;
      });
      
      if (round.votes && round.votes.length > 0) {
        content += `### Voting Results\n\n`;
        round.votes.forEach((vote) => {
          const voterModel = AI_MODELS.find(m => m.id === vote.voterModelId);
          const votedModel = AI_MODELS.find(m => m.id === vote.votedForModelId);
          content += `- **${voterModel?.name}** voted for **${votedModel?.name}**: ${vote.reason}\n`;
        });
        content += "\n";
      }
      
      if (round.moderatorSynthesis) {
        content += `### Moderator Analysis\n\n`;
        content += `${round.moderatorSynthesis}\n\n`;
      }
    });
    
    if (format === "markdown") {
      const blob = new Blob([content], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `debate-${debateId}.md`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Debate exported as Markdown!");
    } else {
      // For PDF, we'll use a simple approach
      toast.info("PDF export coming soon - use Markdown for now");
    }
  };

  if (!debate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              {isEditingQuestion ? (
                <div className="flex items-center gap-2">
                  <Textarea
                    value={editedQuestion}
                    onChange={(e) => setEditedQuestion(e.target.value)}
                    className="min-h-[40px] text-base"
                    autoFocus
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={async () => {
                      if (editedQuestion.trim()) {
                        await updateDebate.mutateAsync({
                          debateId,
                          title: editedQuestion.trim(),
                        });
                        await refetch();
                        setIsEditingQuestion(false);
                        toast.success("Question updated! Start a new round to use it.");
                      }
                    }}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsEditingQuestion(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-foreground line-clamp-1">
                    {debate.question}
                  </h1>
                  {(!currentRound?.responses || currentRound.responses.length === 0) && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => {
                        setEditedQuestion(debate.question);
                        setIsEditingQuestion(true);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Round {currentRound?.roundNumber || 1} • {debate.participantModels.length} participants
                {totalUsage.tokens > 0 && (
                  <span className="ml-2">
                    • {totalUsage.tokens.toLocaleString()} tokens
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {totalUsage.cost > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 px-3 py-1 bg-accent rounded-full text-sm">
                    <Coins className="h-4 w-4" />
                    <span>${totalUsage.cost.toFixed(4)}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Estimated API cost for this session</p>
                  <p className="text-xs text-muted-foreground">{totalUsage.tokens.toLocaleString()} tokens used</p>
                </TooltipContent>
              </Tooltip>
            )}
            <Button variant="outline" size="sm" onClick={() => handleExport("markdown")}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Round indicator */}
          {debate.rounds && debate.rounds.length > 1 && (
            <div className="flex items-center gap-2 mb-4">
              {debate.rounds.map((round, i) => (
                <div
                  key={round.id}
                  className={`px-3 py-1 rounded-full text-sm ${
                    i === debate.rounds!.length - 1
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  Round {round.roundNumber}
                </div>
              ))}
            </div>
          )}

          {/* Follow-up question display */}
          {currentRound?.followUpQuestion && (
            <Card className="bg-accent/50 border-accent">
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground mb-1">Follow-up Question:</p>
                <p className="text-foreground font-medium">{currentRound.followUpQuestion}</p>
              </CardContent>
            </Card>
          )}

          {/* Start generation button */}
          {(!currentRound?.responses || currentRound.responses.length === 0) && !isGenerating && (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Ready to Start the Debate</h3>
                <p className="text-muted-foreground mb-6">
                  Click below to have the AI models respond sequentially
                </p>
                <Button size="lg" onClick={handleStartGeneration}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Responses
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Streaming response card */}
          {streamingModelId && streamingContent[streamingModelId] && (
            <ResponseCard
              modelId={streamingModelId}
              modelName={AI_MODELS.find(m => m.id === streamingModelId)?.name || streamingModelId}
              content={streamingContent[streamingModelId]}
              isDevilsAdvocate={debate.devilsAdvocateEnabled && debate.devilsAdvocateModel === streamingModelId}
              isStreaming={true}
              isCollapsible={false}
            />
          )}

          {/* Loading state for next model */}
          {isGenerating && !streamingContent[debate.participantModels[currentModelIndex]] && (
            <Card className="border-primary/50">
              <CardContent className="py-6">
                <div className="flex items-center gap-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <div>
                    <p className="font-medium">
                      Preparing {AI_MODELS.find(m => m.id === debate.participantModels[currentModelIndex])?.name}...
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {currentModelIndex + 1} of {debate.participantModels.length} models
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Responses */}
          {currentRound?.responses?.map((response) => (
            <ResponseCard
              key={response.id}
              modelId={response.modelId}
              modelName={response.modelName}
              content={response.content}
              isDevilsAdvocate={response.isDevilsAdvocate}
              timestamp={response.createdAt}
              voteCount={getVoteCount(response.modelId)}
            />
          ))}

          {/* Voting Results Summary */}
          {debate.votingEnabled && currentRound?.votes && currentRound.votes.length > 0 && (
            <Card className="bg-accent/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  🗳️ Voting Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {currentRound.votes.map((vote, i) => {
                    const voterModel = AI_MODELS.find(m => m.id === vote.voterModelId);
                    const votedModel = AI_MODELS.find(m => m.id === vote.votedForModelId);
                    return (
                      <div key={i} className="text-sm">
                        <span className="font-medium">{voterModel?.name}</span>
                        <span className="text-muted-foreground"> voted for </span>
                        <span className="font-medium">{votedModel?.name}</span>
                        {vote.reason && (
                          <p className="text-muted-foreground ml-4 mt-1 text-xs">
                            "{vote.reason}"
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Show Moderator Button */}
          {allResponsesComplete && votingComplete && !moderatorComplete && !generateModerator.isPending && (
            <div className="flex justify-center py-4">
              <Button size="lg" onClick={handleShowModerator}>
                <Eye className="h-4 w-4 mr-2" />
                Show Moderator Analysis
              </Button>
            </div>
          )}

          {/* Moderator Loading */}
          {generateModerator.isPending && (
            <Card className="moderator-section">
              <CardContent className="py-6">
                <div className="flex items-center gap-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <div>
                    <p className="font-medium">Generating moderator analysis...</p>
                    <p className="text-sm text-muted-foreground">
                      {AI_MODELS.find(m => m.id === debate.moderatorModel)?.name} is synthesizing the debate
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Moderator Synthesis */}
          {currentRound?.moderatorSynthesis && (
            <Card className="moderator-section">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚖️</span>
                  <div>
                    <CardTitle className="text-lg">Moderator Analysis</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {AI_MODELS.find(m => m.id === debate.moderatorModel)?.name}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose-debate">
                  <Streamdown>{currentRound.moderatorSynthesis}</Streamdown>
                </div>
                
                {currentRound.suggestedFollowUp && (
                  <div className="mt-6 p-4 bg-background/50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Suggested follow-up:</p>
                    <p className="text-foreground italic">"{currentRound.suggestedFollowUp}"</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => setFollowUpQuestion(currentRound.suggestedFollowUp || "")}
                    >
                      Use this question
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Follow-up Question Input */}
          {moderatorComplete && debate?.status !== "completed" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Continue the Debate</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Enter a follow-up question to explore further..."
                  value={followUpQuestion}
                  onChange={(e) => setFollowUpQuestion(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex gap-3">
                  <Button
                    onClick={handleStartNewRound}
                    disabled={!followUpQuestion.trim() || startNewRound.isPending}
                  >
                    {startNewRound.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Starting Round...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Start Round {(currentRound?.roundNumber || 1) + 1}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        const result = await endDebate.mutateAsync({
                          debateId,
                          useUserApiKey,
                        });
                        setFinalResults(result);
                        setShowFinalResults(true);
                        await refetch();
                        toast.success("Debate ended! Final results are ready.");
                      } catch (error) {
                        toast.error("Error ending debate: " + (error as Error).message);
                      }
                    }}
                    disabled={endDebate.isPending}
                  >
                    {endDebate.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating Final Assessment...
                      </>
                    ) : (
                      <>
                        <Flag className="h-4 w-4 mr-2" />
                        End Debate
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Final Results Display */}
          {(showFinalResults && finalResults) || debateResult ? (
            <Card className="border-2 border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-transparent">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-3">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                  Debate Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Final Assessment */}
                <div className="prose-debate">
                  <Streamdown>{(finalResults?.finalAssessment || debateResult?.finalAssessment) || ""}</Streamdown>
                </div>

                {/* Points Awarded */}
                <div className="bg-background/50 rounded-lg p-4">
                  <h3 className="font-bold text-lg flex items-center gap-2 mb-4">
                    <Target className="h-5 w-5 text-red-500" />
                    Points Awarded
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(finalResults?.pointsAwarded || debateResult?.pointsAwarded || {})
                      .sort(([, a], [, b]) => (b as any).total - (a as any).total)
                      .map(([modelId, points]) => {
                        const model = AI_MODELS.find(m => m.id === modelId || m.name === modelId);
                        const p = points as any;
                        return (
                          <div key={modelId} className="flex items-start justify-between py-2 border-b border-border/50 last:border-0">
                            <div>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: model?.color || "#888" }}
                                />
                                <span className="font-medium">{model?.name || modelId}</span>
                                <span className="text-lg font-bold text-primary">+{p.total} points</span>
                              </div>
                              <div className="ml-5 mt-1 text-sm text-muted-foreground space-y-0.5">
                                {p.moderatorPick > 0 && (
                                  <p className="flex items-center gap-1">
                                    <Target className="h-3 w-3" /> Moderator's Top Pick: +{p.moderatorPick}
                                  </p>
                                )}
                                {p.peerVotes > 0 && (
                                  <p className="flex items-center gap-1">
                                    <Vote className="h-3 w-3" /> Peer Votes ({p.peerVotes}): +{p.peerVotes}
                                  </p>
                                )}
                                {p.strongArguments > 0 && (
                                  <p className="flex items-center gap-1">
                                    <Lightbulb className="h-3 w-3" /> Strongest Arguments: +{p.strongArguments}
                                  </p>
                                )}
                                {p.devilsAdvocateBonus > 0 && (
                                  <p className="flex items-center gap-1">
                                    <Drama className="h-3 w-3" /> Devil's Advocate Bonus: +{p.devilsAdvocateBonus}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* View Leaderboard Link */}
                <div className="text-center pt-4">
                  <Button variant="outline" onClick={() => navigate("/leaderboard")}>
                    <Trophy className="h-4 w-4 mr-2" />
                    View Updated Leaderboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </main>
    </div>
  );
}
