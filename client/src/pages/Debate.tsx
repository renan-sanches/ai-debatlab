import { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useSearch } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  Download,
  Eye,
  MessageSquare,
  Coins,
  Pencil,
  Check,
  Trophy,
  Zap,
  Clock,
  Send,
  MoreVertical,
  Settings,
  PlusCircle,
  ArrowUp,
  ChevronDown,
  Map as MapIcon, // Renamed to avoid confusion if needed, though not strictly necessary
  HelpCircle
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { VisualDialecticMap } from "@/components/debate/VisualDialecticMap";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { AI_MODELS, getModelById } from "../../../shared/models";
import { useStreamingResponse } from "@/hooks/useStreamingResponse";

import { DiscourseAnalyticsWidget } from "@/components/debate/DiscourseAnalyticsWidget";
import { getModelAvatar } from "@/config/avatarConfig";

interface ResponseCardProps {
  modelId: string;
  modelName: string;
  content: string;
  isDevilsAdvocate: boolean;
  timestamp?: Date;
  voteCount?: number;
  isStreaming?: boolean;
  isActive?: boolean;
  score?: number | null;
  scoreReasoning?: string | null;
  modelAvatars?: Record<string, string> | null;
}

function ResponseCard({
  modelId,
  modelName,
  content,
  isDevilsAdvocate,
  timestamp,
  voteCount,
  isStreaming = false,
  isActive = false,
  score,
  scoreReasoning,
  modelAvatars
}: ResponseCardProps) {
  const model = AI_MODELS.find(m => m.id === modelId) || getModelById(modelId);
  const avatar = getModelAvatar(modelId, modelAvatars);

  // Debug: Log avatar information
  useEffect(() => {
    console.log('[Avatar Debug]', {
      modelId,
      modelName,
      modelAvatars,
      resolvedAvatar: avatar,
      isCustomAvatar: avatar.startsWith('/avatars/')
    });
  }, [modelId, modelAvatars, avatar, modelName]);

  return (
    <div className={`flex flex-col bg-white dark:bg-card rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all transform hover:scale-[1.005] shadow-xl relative z-10 ${isActive ? 'active-speaker' : 'dark:hover:shadow-black/40'}`}>
      <div className="p-4 border-b border-slate-200 dark:border-border-dark flex items-center justify-between bg-slate-50/50 dark:bg-surface-dark-lighter/30">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={avatar}
              alt={modelName}
              className={`w-10 h-10 rounded-lg shadow-sm object-cover ${!isActive && !isStreaming ? 'grayscale opacity-80' : ''}`}
              onError={(e) => {
                console.error('[Avatar Load Error]', {
                  modelId,
                  modelName,
                  attemptedSrc: avatar,
                  error: e
                });
              }}
            />
            {isActive && (
              <div className="absolute -bottom-1 -right-1 bg-blue-500 w-3 h-3 rounded-full border-2 border-white dark:border-[#151921]"></div>
            )}
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">{modelName}</h4>
            {isActive ? (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wide border border-blue-200 dark:border-blue-500/20">
                Current Speaker
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide border border-slate-200 dark:border-slate-700">
                {isStreaming ? 'Synthesizing...' : 'Waiting'}
              </span>
            )}
          </div>
        </div>


        {/* Score Badge */}
        {!isActive && !isStreaming && (
          <div className="flex items-center">
            {score !== undefined && score !== null ? (
              <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <div className="cursor-help flex flex-col items-end">
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-0.5 flex items-center gap-1">
                        AI Score
                      </div>
                      <div className={`text-2xl font-black ${score >= 8 ? 'text-green-500 dark:text-green-400' :
                          score >= 6 ? 'text-blue-500 dark:text-blue-400' :
                            'text-amber-500 dark:text-amber-400'
                        }`}>
                        {score.toFixed(1)}
                      </div>
                    </div>
                  </TooltipTrigger>
                  {scoreReasoning && (
                    <TooltipContent className="max-w-xs bg-slate-900 text-white border-slate-800 p-3 text-xs leading-normal">
                      <p className="font-bold mb-1 text-slate-300">Judge's Reasoning:</p>
                      {scoreReasoning}
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            ) : (
              <div className="flex flex-col items-end opacity-50">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5">Rating</div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Evaluating...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <div className={`p-6 flex-1 prose prose-slate dark:prose-invert max-w-none ${!isActive && !isStreaming ? 'opacity-80' : ''}`}>
        <div className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          <Streamdown>{content}</Streamdown>
          {isStreaming && <span className="inline-block w-2 h-4 ml-1 bg-blue-500 animate-pulse" />}
        </div>
      </div>
      <div className="p-4 border-t border-slate-200 dark:border-border-dark flex items-center justify-between bg-slate-50/30 dark:bg-surface-dark-lighter/10">
        <div className="flex gap-2">
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-green-500 dark:hover:text-green-400 transition-colors">
            <span className="material-symbols-rounded text-[20px]">thumb_up</span>
          </button>
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
            <span className="material-symbols-rounded text-[20px]">thumb_down</span>
          </button>
          {voteCount !== undefined && voteCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-lg">
              <span className="material-symbols-rounded text-amber-600 dark:text-amber-400 text-[16px]">emoji_events</span>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300">{voteCount} {voteCount === 1 ? 'vote' : 'votes'}</span>
            </div>
          )}
        </div>
        <button className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition-colors uppercase tracking-wide">
          View Logs <span className="material-symbols-rounded text-sm">open_in_new</span>
        </button>
      </div>
    </div >
  );
}

export default function Debate() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
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
  const [selectedRoundIndex, setSelectedRoundIndex] = useState<number | null>(null);
  const hasAutoStarted = useRef(false);
  const searchParams = useSearch();

  const useUserApiKey = sessionStorage.getItem('useUserApiKey') === 'true';

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

  const { data: debate, refetch } = trpc.debate.get.useQuery(
    { debateId },
    { enabled: debateId > 0 && isAuthenticated }
  );

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
  const [finalResults, setFinalResults] = useState<any>(null);

  const latestRoundIndex = debate?.rounds ? debate.rounds.length - 1 : 0;
  const activeRoundIndex = selectedRoundIndex ?? latestRoundIndex;
  const currentRound = debate?.rounds?.[activeRoundIndex];
  const isViewingLatestRound = activeRoundIndex === latestRoundIndex;
  const allResponsesComplete = currentRound?.responses?.length === debate?.participantModels?.length;

  // Calculate vote counts per model for current round
  const voteCountsByModel: Record<string, number> = {};
  if (currentRound?.votes) {
    currentRound.votes.forEach((vote: any) => {
      const votedForId = vote.votedForModelId;
      voteCountsByModel[votedForId] = (voteCountsByModel[votedForId] || 0) + 1;
    });
  }

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

  const handleStartGeneration = async () => {
    if (!debate || !currentRound) return;

    setIsGenerating(true);
    setCurrentModelIndex(0);
    setStreamingContent({});

    try {
      for (let i = 0; i < debate.participantModels.length; i++) {
        const modelId = debate.participantModels[i];
        setCurrentModelIndex(i);
        setStreamingModelId(modelId);
        setStreamingContent(prev => ({ ...prev, [modelId]: "" }));

        await startStreaming(
          debateId,
          currentRound.id,
          modelId,
          i + 1,
          useUserApiKey
        );

        setStreamingModelId(null);
        await refetch();
      }

      if (debate.votingEnabled) {
        toast.info("Generating votes...");
        await generateVotes.mutateAsync({
          debateId,
          roundId: currentRound.id,
          useUserApiKey,
        });
        await refetch();
      }

      toast.success("Round complete!");
    } catch (error) {
      toast.error("Error generating responses: " + (error as Error).message);
    } finally {
      setIsGenerating(false);
      setStreamingModelId(null);
    }
  };

  const handleShowModerator = async () => {
    if (!debate || !currentRound) return;
    setShowModerator(true);
    try {
      const result = await generateModerator.mutateAsync({
        debateId,
        roundId: currentRound.id,
        useUserApiKey,
      });
      if (result.usage) {
        setTotalUsage(prev => ({
          tokens: prev.tokens + result.usage!.totalTokens,
          cost: prev.cost + result.usage!.estimatedCost,
        }));
      }
      await refetch();
      toast.success("Moderator analysis complete!");
    } catch (error) {
      toast.error("Error: " + (error as Error).message);
    }
  };

  const handleStartNewRound = async (questionOverride?: string) => {
    const question = questionOverride || followUpQuestion;
    if (!debate || !question.trim()) {
      toast.error("Enter a follow-up question");
      return;
    }

    try {
      await startNewRound.mutateAsync({
        debateId,
        followUpQuestion: question.trim(),
      });
      setFollowUpQuestion("");
      setShowModerator(false);
      await refetch();
      toast.success("Next round started!");
    } catch (error) {
      toast.error("Error: " + (error as Error).message);
    }
  };

  const handleExport = () => {
    if (!debate) return;
    toast.info("Exporting transcript...");
  };

  if (!debate) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B0E14] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0E14] flex flex-col">
      {/* Custom Header */}
      <header className="bg-white dark:bg-card border-b border-slate-200 dark:border-border-dark px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600 dark:text-slate-400" />
          </button>
          <div>
            <h1 className="font-bold text-lg text-slate-900 dark:text-white">
              {debate.title || debate.question}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Moderated by: <strong>{user?.name || 'User'}</strong> • {debate.rounds?.length || 0} rounds
            </p>
          </div>
        </div>
        <button
          onClick={handleExport}
          className="px-4 py-2 rounded-lg border border-slate-200 dark:border-border-dark hover:bg-slate-50 dark:hover:bg-surface-dark-lighter text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 border-r border-slate-200 dark:border-border-dark hidden lg:flex flex-col p-4 bg-white dark:bg-background overflow-y-auto custom-scrollbar">
          <div className="mb-8">
            <button
              onClick={() => navigate("/")}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20 border border-blue-500/20"
            >
              <span className="material-symbols-rounded">add</span>
              New Debate
            </button>
          </div>

          <div className="flex-1 space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3 px-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Dialectic Map</h3>
              </div>
              <VisualDialecticMap
                rounds={debate.rounds || []}
                currentRoundIndex={activeRoundIndex}
                streamingModelId={streamingModelId}
                onNodeClick={(elementId) => {
                  const el = document.getElementById(elementId);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Flash effect could be added here
                  }
                }}
              />
            </div>

            {/* Collapsed Participants List (Optional or removed in favor of map) */}
            {/* Keeping it for now but maybe pushed down or made compact? 
                Actually, the map replaces the list for navigation, but we might want a simple list for managing models.
                Let's keep the map as the primary view.
            */}



            {/* Discourse Analytics Widget */}
            {currentRound?.discourseAnalytics && (
              <div className="mb-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3 px-2">Live Analytics</h3>
                <DiscourseAnalyticsWidget
                  analytics={currentRound.discourseAnalytics as any}
                  isLoading={false}
                />
              </div>
            )}

            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3 px-2">Moderation</h3>
              <div className="bg-slate-50 dark:bg-surface-dark rounded-xl p-4 border border-slate-200 dark:border-border-dark space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Turn Limit</span>
                  <span className="text-xs font-mono bg-slate-200 dark:bg-surface-dark-lighter dark:text-slate-300 border dark:border-slate-700 px-2 py-1 rounded-md">10</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-300">Response Time</span>
                  <span className="text-xs font-mono bg-slate-200 dark:bg-surface-dark-lighter dark:text-slate-300 border dark:border-slate-700 px-2 py-1 rounded-md">Fast</span>
                </div>
                <button
                  onClick={async () => {
                    toast.info("Ending debate session...");
                    try {
                      const result = await endDebate.mutateAsync({ debateId, useUserApiKey });
                      setFinalResults(result);
                      setShowFinalResults(true);
                      await refetch();
                      toast.success("Debate session ended successfully!");
                    } catch (error) {
                      toast.error("Failed to end debate: " + (error as Error).message);
                    }
                  }}
                  disabled={endDebate.status === "pending"}
                  className="w-full text-xs font-bold uppercase tracking-wide border border-red-500/20 text-red-500 py-2.5 rounded-lg hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {endDebate.status === "pending" ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Ending...
                    </>
                  ) : (
                    "End Session"
                  )}
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-[#0B0E14] premium-bg overflow-hidden relative">
          {/* Main Content Scrollable Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
            <div className="max-w-6xl mx-auto space-y-6 pb-24">
              {/* Debate Header Card */}
              <div className="flex items-center justify-between bg-white dark:bg-card p-5 rounded-2xl border border-slate-200 dark:border-border-dark shadow-sm dark:shadow-2xl">
                <div className="flex items-center gap-5 min-w-0">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-900/30 shrink-0">
                    <span className="material-symbols-rounded text-blue-600 dark:text-blue-400">forum</span>
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-bold text-lg text-slate-900 dark:text-white truncate">
                      Debate: {debate.question}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Moderated by: <strong className="text-slate-700 dark:text-slate-300">{user?.name || 'User'} (Admin)</strong> • {debate.rounds?.length || 0} rounds completed
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={handleExport}
                    className="px-4 py-2 rounded-lg border border-slate-200 dark:border-border-dark hover:bg-slate-50 dark:hover:bg-surface-dark-lighter text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    Export Transcript
                  </button>
                </div>
              </div>

              {/* Round Tabs if multiple rounds */}
              {debate.rounds && debate.rounds.length > 1 && (
                <div className="flex justify-center">
                  <div className="inline-flex items-center p-1 bg-white/50 dark:bg-card/50 backdrop-blur-xl border border-slate-200 dark:border-border-dark rounded-xl shadow-sm">
                    {debate.rounds.map((round, i) => (
                      <button
                        key={round.id}
                        onClick={() => setSelectedRoundIndex(i)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${i === activeRoundIndex
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                          }`}
                      >
                        ROUND {round.roundNumber}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Response Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id={`round-${currentRound?.id || 'start'}`}>
                {currentRound?.responses?.map((response) => (
                  <div key={response.id} id={`response-${response.id}`}>
                    <ResponseCard
                      modelId={response.modelId}
                      modelName={response.modelName}
                      content={response.content}
                      isDevilsAdvocate={response.isDevilsAdvocate}
                      timestamp={response.createdAt}
                      voteCount={voteCountsByModel[response.modelId] || 0}
                      score={response.score}
                      scoreReasoning={response.scoreReasoning}
                      modelAvatars={debate?.modelAvatars}
                    />
                  </div>
                ))}

                {/* Streaming Response */}
                {isViewingLatestRound && streamingModelId && streamingContent[streamingModelId] && (
                  <div id={`response-streaming-${streamingModelId}`}>
                    <ResponseCard
                      modelId={streamingModelId}
                      modelName={AI_MODELS.find(m => m.id === streamingModelId)?.name || getModelById(streamingModelId)?.name || streamingModelId}
                      content={streamingContent[streamingModelId]}
                      isDevilsAdvocate={debate.devilsAdvocateEnabled && debate.devilsAdvocateModel === streamingModelId}
                      isStreaming={true}
                      isActive={true}
                      voteCount={0}
                      modelAvatars={debate?.modelAvatars}
                    />
                  </div>
                )}

                {/* Initial Start Trigger */}
                {isViewingLatestRound && (!currentRound?.responses || currentRound.responses.length === 0) && !isGenerating && (
                  <div className="col-span-full py-12 flex flex-col items-center justify-center gap-6">
                    <div className="p-6 bg-white dark:bg-card rounded-3xl border border-slate-200 dark:border-border-dark shadow-xl text-center max-w-sm">
                      <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 dark:border-blue-900/30">
                        <span className="material-symbols-rounded text-3xl text-blue-600 dark:text-blue-400">play_circle</span>
                      </div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Ready to Start?</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Initiate the roundtable discussion between selected models.</p>
                      <Button
                        onClick={handleStartGeneration}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-12 rounded-xl shadow-lg shadow-blue-500/20"
                      >
                        Initiate Round {currentRound?.roundNumber || 1}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Moderator Synthesis Section */}
              {currentRound?.moderatorSynthesis && (
                <div className="mt-8 relative group" id={`moderator-${currentRound.id}`}>
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-20 blur-2xl rounded-3xl"></div>
                  <div className="relative bg-white dark:bg-card rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-2xl">
                    <div className="p-5 border-b border-slate-100 dark:border-border-dark bg-slate-50/50 dark:bg-surface-dark-lighter/30 flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                        <span className="material-symbols-rounded">analytics</span>
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm">Moderator Synthesis</h3>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Consolidated Dialectic Summary</p>
                      </div>
                    </div>
                    <div className="p-8 prose prose-slate dark:prose-invert max-w-none">
                      <Streamdown>{currentRound.moderatorSynthesis}</Streamdown>

                      {currentRound.suggestedFollowUp && (
                        <div className="mt-8 p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100/50 dark:border-blue-900/30">
                          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-widest mb-3">
                            <span className="material-symbols-rounded text-sm">lightbulb</span> Strategic Direction
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 italic text-lg leading-relaxed">"{currentRound.suggestedFollowUp}"</p>
                          {isViewingLatestRound && (
                            <button
                              onClick={() => handleStartNewRound(currentRound.suggestedFollowUp || '')}
                              className="mt-4 text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 underline underline-offset-4"
                            >
                              Accept & Initiate Next Round →
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Generate Synthesis Trigger */}
              {(allResponsesComplete && votingComplete && isViewingLatestRound && !moderatorComplete) && (
                <div className="flex justify-center py-8">
                  <Button
                    onClick={handleShowModerator}
                    className="h-14 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-xl shadow-indigo-500/20 gap-3 group"
                    disabled={generateModerator.status === "pending"}
                  >
                    {generateModerator.status === "pending" ? <Loader2 className="h-5 w-5 animate-spin" /> : <span className="material-symbols-rounded group-hover:scale-110 transition-transform">insights</span>}
                    Generate Final Synthesis
                  </Button>
                </div>
              )}

              {/* Concluded State */}
              {((showFinalResults && finalResults) || debateResult) && (
                <div className="pt-10 flex justify-center">
                  <div className="bg-white dark:bg-card border border-blue-200 dark:border-blue-900/30 rounded-3xl p-10 text-center shadow-2xl max-w-lg">
                    <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <span className="material-symbols-rounded text-4xl text-amber-500">emoji_events</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Debate Concluded</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-8">The dialectic process is complete. Detailed performance metrics have been recorded in the leaderboard.</p>
                    <Button
                      className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold h-12 rounded-xl"
                      onClick={() => navigate("/leaderboard")}
                    >
                      View Leaderboard Rankings
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Floating Input Area */}
          <div className="p-4 md:p-6 bg-white dark:bg-background border-t border-slate-200 dark:border-border-dark relative z-20 shadow-[0_-4px_24px_-12px_rgba(0,0,0,0.05)]">
            <div className="max-w-4xl mx-auto">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-10 group-focus-within:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-white dark:bg-card border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-xl">
                  <textarea
                    value={followUpQuestion}
                    onChange={(e) => setFollowUpQuestion(e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-0 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 resize-none min-h-[80px] text-lg font-light custom-scrollbar"
                    placeholder="Ask a question or moderate the current debate topic..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleStartNewRound();
                      }
                    }}
                  ></textarea>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-surface-dark-lighter border border-transparent dark:border-slate-700 rounded-full text-xs font-bold">
                        <span className="material-symbols-rounded text-blue-500 text-sm">auto_awesome</span>
                        <span className="text-slate-600 dark:text-slate-300">
                          {getModelById(debate.moderatorModel)?.name || debate.moderatorModel}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleStartNewRound()}
                      disabled={!followUpQuestion.trim() || isGenerating}
                      className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-rounded">arrow_upward</span>
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 mt-4 uppercase tracking-widest font-bold">AI DebateLab Dashboard v1.4.2 — Built for Researchers & Educators</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
