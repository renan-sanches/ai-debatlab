import { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useSearch } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ArrowLeft,
  Download,
  ThumbsUp,
  ThumbsDown,
  Trophy,
  ExternalLink,
  Plus,
  ArrowUp,
  Sparkles,
  ChevronDown,
  Globe,
  Play,
  Lightbulb,
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
  modelAvatars,
}: ResponseCardProps) {
  const model =
    AI_MODELS.find((m) => m.id === modelId) || getModelById(modelId);
  const avatar = getModelAvatar(modelId, modelAvatars);

  return (
    <article className="bg-white dark:bg-card border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={avatar}
              alt={modelName}
              className={`w-10 h-10 rounded-full object-cover ${
                !isActive && !isStreaming ? "grayscale opacity-70" : ""
              }`}
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/avatars/default.png";
              }}
            />
            {isActive && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-card" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">
              {modelName}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                  isActive
                    ? "bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20"
                    : isStreaming
                    ? "bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700"
                }`}
              >
                {isActive
                  ? "Speaking"
                  : isStreaming
                  ? "Synthesizing..."
                  : "Waiting"}
              </span>
            </div>
          </div>
        </div>

        {/* Score Badge */}
        {!isActive && !isStreaming && (
          <div className="text-right">
            {score !== undefined && score !== null ? (
              <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <div className="cursor-help">
                      <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                        Score
                      </span>
                      <span
                        className={`block text-2xl font-bold ${
                          score >= 8
                            ? "text-emerald-500"
                            : score >= 6
                            ? "text-blue-500"
                            : "text-amber-500"
                        }`}
                      >
                        {score.toFixed(1)}
                      </span>
                    </div>
                  </TooltipTrigger>
                  {scoreReasoning && (
                    <TooltipContent className="max-w-xs bg-slate-900 text-white border-slate-800 p-3 text-xs leading-normal">
                      <p className="font-bold mb-1 text-slate-300">
                        Judge's Reasoning:
                      </p>
                      {scoreReasoning}
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            ) : (
              <div className="opacity-50">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
                  Score
                </span>
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div
        className={`p-6 prose prose-slate dark:prose-invert prose-sm max-w-none ${
          !isActive && !isStreaming ? "opacity-80" : ""
        }`}
      >
        <div className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          <Streamdown>{content}</Streamdown>
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse rounded-sm" />
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-emerald-500 transition-colors">
            <ThumbsUp className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
            <ThumbsDown className="w-4 h-4" />
          </button>
          {voteCount !== undefined && voteCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/30 rounded-lg">
              <Trophy className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                {voteCount} {voteCount === 1 ? "vote" : "votes"}
              </span>
            </div>
          )}
        </div>
        <button className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors uppercase tracking-wide">
          View Logs <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </article>
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
  const [streamingContent, setStreamingContent] = useState<
    Record<string, string>
  >({});
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState("");
  const [selectedRoundIndex, setSelectedRoundIndex] = useState<number | null>(
    null
  );
  const hasAutoStarted = useRef(false);
  const searchParams = useSearch();

  const useUserApiKey = sessionStorage.getItem("useUserApiKey") === "true";

  const { startStreaming, isStreaming: isStreamingActive } =
    useStreamingResponse({
      onToken: (token, modelId) => {
        setStreamingContent((prev) => ({
          ...prev,
          [modelId]: (prev[modelId] || "") + token,
        }));
      },
      onComplete: (response) => {
        if (response.usage) {
          setTotalUsage((prev) => ({
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
  const allResponsesComplete =
    currentRound?.responses?.length === debate?.participantModels?.length;

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

  const votingComplete =
    !debate?.votingEnabled || (currentRound?.votes?.length || 0) > 0;
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
        setStreamingContent((prev) => ({ ...prev, [modelId]: "" }));

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
        setTotalUsage((prev) => ({
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
      <div className="min-h-screen bg-slate-50 dark:bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[300px] flex-shrink-0 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0a0d14] overflow-y-auto custom-scrollbar">
        {/* Sidebar Header */}
        <div className="p-6 pb-2 sticky top-0 bg-white dark:bg-[#0a0d14] z-10">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
              Debate<span className="text-primary">Lab</span>
            </span>
          </div>
          <button
            onClick={() => navigate("/")}
            className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-5 h-5" />
            <span>New Debate</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-2 space-y-1">
          <a
            href="/"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            <span className="material-symbols-rounded text-[20px]">
              dashboard
            </span>
            Dashboard
          </a>
          <a
            href="/library"
            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            <span className="material-symbols-rounded text-[20px]">history</span>
            History
          </a>
        </nav>

        <div className="my-4 mx-6 border-t border-slate-200 dark:border-slate-800" />

        {/* Dialectic Map */}
        <div className="px-6 flex-1">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
            Dialectic Map
          </h3>
          <VisualDialecticMap
            rounds={debate.rounds || []}
            currentRoundIndex={activeRoundIndex}
            streamingModelId={streamingModelId}
            onNodeClick={(elementId) => {
              const el = document.getElementById(elementId);
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" });
              }
            }}
          />

          {/* Discourse Analytics */}
          {currentRound?.discourseAnalytics && (
            <div className="mt-6">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Live Analytics
              </h3>
              <DiscourseAnalyticsWidget
                analytics={currentRound.discourseAnalytics as any}
                isLoading={false}
              />
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 mt-auto border-t border-slate-200 dark:border-slate-800">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">
                Turn Limit
              </span>
              <span className="text-xs font-mono bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-md">
                10
              </span>
            </div>
            <button
              onClick={async () => {
                toast.info("Ending debate session...");
                try {
                  const result = await endDebate.mutateAsync({
                    debateId,
                    useUserApiKey,
                  });
                  setFinalResults(result);
                  setShowFinalResults(true);
                  await refetch();
                  toast.success("Debate session ended successfully!");
                } catch (error) {
                  toast.error(
                    "Failed to end debate: " + (error as Error).message
                  );
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
          <p className="text-xs text-slate-500 mt-3 font-medium">
            DebateLab v1.4.2
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative h-full overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0a0d14]/80 backdrop-blur-xl flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/")}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Status: Ready
              </span>
            </div>
            <div className="flex items-center gap-2 pl-4 border-l border-slate-200 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                {user?.name?.[0] || "U"}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-slate-700 dark:text-white leading-tight">
                  {user?.name || "User"}
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  Premium Plan
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 pb-48 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {/* Debate Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <span className="material-symbols-rounded text-primary">
                      forum
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                    {debate.title || debate.question}
                  </h1>
                </div>
                <p className="text-sm text-slate-500 ml-11">
                  Moderated by:{" "}
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {user?.name || "User"} (Admin)
                  </span>{" "}
                  • {debate.rounds?.length || 0} rounds completed
                </p>
              </div>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Transcript
              </button>
            </div>

            {/* Round Tabs */}
            {debate.rounds && debate.rounds.length > 1 && (
              <div className="flex justify-center mb-8">
                <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                  {debate.rounds.map((round, i) => (
                    <button
                      key={round.id}
                      onClick={() => setSelectedRoundIndex(i)}
                      className={`px-5 py-1.5 text-sm font-medium rounded-lg transition-all ${
                        i === activeRoundIndex
                          ? "bg-primary text-white shadow-sm"
                          : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                      }`}
                    >
                      Round {round.roundNumber}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Response Grid */}
            <div
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              id={`round-${currentRound?.id || "start"}`}
            >
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
              {isViewingLatestRound &&
                streamingModelId &&
                streamingContent[streamingModelId] && (
                  <div id={`response-streaming-${streamingModelId}`}>
                    <ResponseCard
                      modelId={streamingModelId}
                      modelName={
                        AI_MODELS.find((m) => m.id === streamingModelId)?.name ||
                        getModelById(streamingModelId)?.name ||
                        streamingModelId
                      }
                      content={streamingContent[streamingModelId]}
                      isDevilsAdvocate={
                        debate.devilsAdvocateEnabled &&
                        debate.devilsAdvocateModel === streamingModelId
                      }
                      isStreaming={true}
                      isActive={true}
                      voteCount={0}
                      modelAvatars={debate?.modelAvatars}
                    />
                  </div>
                )}

              {/* Initial Start Trigger */}
              {isViewingLatestRound &&
                (!currentRound?.responses ||
                  currentRound.responses.length === 0) &&
                !isGenerating && (
                  <div className="col-span-full py-12 flex flex-col items-center justify-center gap-6">
                    <div className="bg-white dark:bg-card rounded-3xl border border-slate-200 dark:border-slate-800 p-10 text-center shadow-2xl max-w-sm">
                      <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 dark:border-blue-900/30">
                        <Play className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
                        Ready to Start?
                      </h3>
                      <p className="text-sm text-slate-500 mb-6">
                        Initiate the roundtable discussion between selected
                        models.
                      </p>
                      <Button
                        onClick={handleStartGeneration}
                        className="w-full bg-primary hover:bg-primary-hover text-white font-bold h-12 rounded-xl shadow-lg shadow-blue-500/20"
                      >
                        Initiate Round {currentRound?.roundNumber || 1}
                      </Button>
                    </div>
                  </div>
                )}
            </div>

            {/* Moderator Synthesis Section */}
            {currentRound?.moderatorSynthesis && (
              <div
                className="mt-8 relative group"
                id={`moderator-${currentRound.id}`}
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-20 blur-2xl rounded-3xl" />
                <div className="relative bg-white dark:bg-card rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl">
                  <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-sm">
                        Moderator Synthesis
                      </h3>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                        Consolidated Dialectic Summary
                      </p>
                    </div>
                  </div>
                  <div className="p-8 prose prose-slate dark:prose-invert max-w-none">
                    <Streamdown>{currentRound.moderatorSynthesis}</Streamdown>

                    {currentRound.suggestedFollowUp && (
                      <div className="mt-8 p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100/50 dark:border-blue-900/30">
                        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-3">
                          <Lightbulb className="w-4 h-4" /> Strategic Direction
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 italic text-lg leading-relaxed">
                          "{currentRound.suggestedFollowUp}"
                        </p>
                        {isViewingLatestRound && (
                          <button
                            onClick={() =>
                              handleStartNewRound(
                                currentRound.suggestedFollowUp || ""
                              )
                            }
                            className="mt-4 text-sm font-bold text-primary hover:text-primary-hover underline underline-offset-4"
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
            {allResponsesComplete &&
              votingComplete &&
              isViewingLatestRound &&
              !moderatorComplete && (
                <div className="flex justify-center py-8">
                  <Button
                    onClick={handleShowModerator}
                    className="h-14 px-10 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold shadow-xl shadow-indigo-500/20 gap-3 group"
                    disabled={generateModerator.status === "pending"}
                  >
                    {generateModerator.status === "pending" ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    )}
                    Generate Final Synthesis
                  </Button>
                </div>
              )}

            {/* Concluded State */}
            {((showFinalResults && finalResults) || debateResult) && (
              <div className="pt-10 flex justify-center">
                <div className="bg-white dark:bg-card border border-blue-200 dark:border-blue-900/30 rounded-3xl p-10 text-center shadow-2xl max-w-lg">
                  <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Trophy className="w-10 h-10 text-amber-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    Debate Concluded
                  </h2>
                  <p className="text-slate-500 mb-8">
                    The dialectic process is complete. Detailed performance
                    metrics have been recorded in the leaderboard.
                  </p>
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
        <div className="absolute bottom-6 left-0 right-0 px-6 pointer-events-none flex justify-center z-30">
          <div className="w-full max-w-3xl pointer-events-auto">
            <div className="bg-white dark:bg-card border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2 flex flex-col gap-2">
              <input
                type="text"
                value={followUpQuestion}
                onChange={(e) => setFollowUpQuestion(e.target.value)}
                className="w-full bg-transparent border-none text-slate-900 dark:text-white placeholder-slate-400 focus:ring-0 text-sm px-3 py-3 font-medium"
                placeholder="Ask a question or moderate the current debate topic..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleStartNewRound();
                  }
                }}
              />
              <div className="flex items-center justify-between px-2 pb-1">
                <div className="flex items-center gap-2">
                  <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                    <Plus className="w-5 h-5" />
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors border border-transparent dark:border-slate-700">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    {getModelById(debate.moderatorModel)?.name ||
                      debate.moderatorModel}
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors border border-transparent dark:border-slate-700">
                    <Globe className="w-3.5 h-3.5" />
                    Web
                  </button>
                </div>
                <button
                  onClick={() => handleStartNewRound()}
                  disabled={!followUpQuestion.trim() || isGenerating}
                  className="w-8 h-8 rounded-full bg-primary hover:bg-primary-hover text-white flex items-center justify-center transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="text-center mt-3">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                AI DebateLab Dashboard v1.4.2 — Built for Researchers & Educators
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
