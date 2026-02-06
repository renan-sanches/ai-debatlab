import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  Trophy,
  Target,
  Vote,
  Lightbulb,
  TrendingUp,
  Swords,
  Activity,
  Award,
  Medal,
  ChevronDown,
  MessageSquare,
  Bot,
  Loader2,
} from "lucide-react";
import { AI_MODELS } from "../../../shared/models";
import DashboardLayout from "@/components/DashboardLayout";
import { getModelAvatar } from "@/config/avatarConfig";

type LeaderboardTab = "rankings" | "breakdown" | "h2h";
type TimeFilter = "all" | "30days" | "week" | "10debates";

export default function Leaderboard() {
  const { loading: authLoading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<LeaderboardTab>("rankings");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [selectedModelA, setSelectedModelA] = useState<string>("");
  const [selectedModelB, setSelectedModelB] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");

  const { data: leaderboard, isLoading } = trpc.leaderboard.get.useQuery(
    { timeFilter },
    { enabled: isAuthenticated }
  );

  const { data: modelStats } = trpc.leaderboard.getModelStats.useQuery(
    { modelId: selectedModel },
    { enabled: isAuthenticated && !!selectedModel }
  );

  const { data: headToHead } = trpc.leaderboard.headToHead.useQuery(
    { modelA: selectedModelA, modelB: selectedModelB },
    {
      enabled:
        isAuthenticated &&
        !!selectedModelA &&
        !!selectedModelB &&
        selectedModelA !== selectedModelB,
    }
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

  const timeFilterLabels: Record<TimeFilter, string> = {
    all: "All Time",
    "30days": "Last 30 Days",
    week: "This Week",
    "10debates": "Last 10 Sessions",
  };

  // Calculate stats from leaderboard
  const totalDebates = leaderboard?.reduce((acc, e) => acc + e.totalDebates, 0) || 0;
  const activeModels = leaderboard?.length || 0;
  const topPerformer = leaderboard?.[0]?.modelName || "N/A";

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-semibold uppercase tracking-wide mb-4 w-fit">
                <Trophy className="w-3.5 h-3.5" />
                Performance Metrics
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
                AI{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
                  Leaderboard
                </span>
              </h1>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl text-lg leading-relaxed">
                Objective rankings based on logic, dialectics, and peer review.
                See which models dominate the arena in real-time debates.
              </p>
            </div>
            <div className="relative group">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
                className="appearance-none bg-white dark:bg-card border border-slate-200 dark:border-slate-800 rounded-xl h-12 pl-4 pr-10 font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/50 focus:border-primary min-w-[160px] shadow-sm cursor-pointer text-sm"
              >
                {Object.entries(timeFilterLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Navigation Toggle */}
          <div className="flex justify-center md:justify-start border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
              <button
                onClick={() => setActiveTab("rankings")}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === "rankings"
                    ? "bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                Rankings
              </button>
              <button
                onClick={() => setActiveTab("breakdown")}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === "breakdown"
                    ? "bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                Detailed Breakdown
              </button>
              <button
                onClick={() => setActiveTab("h2h")}
                className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === "h2h"
                    ? "bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                Head-to-Head
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="mt-8">
            {activeTab === "rankings" && (
              <div className="space-y-6">
                {/* Rankings Table */}
                <div className="bg-white dark:bg-card border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
                    <div className="flex items-center gap-2">
                      <Medal className="w-5 h-5 text-amber-500" />
                      <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
                        {timeFilterLabels[timeFilter]} Rankings
                      </h3>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-transparent">
                          <th className="px-6 py-4 text-left font-semibold w-20">
                            Pos
                          </th>
                          <th className="px-6 py-4 text-left font-semibold">
                            Persona / Entity
                          </th>
                          <th className="px-6 py-4 text-center font-semibold">
                            Elo Points
                          </th>
                          <th className="px-6 py-4 text-center font-semibold">
                            Engagements
                          </th>
                          <th className="px-6 py-4 text-right font-semibold">
                            Efficiency (PPD)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                        {isLoading ? (
                          <tr>
                            <td colSpan={5} className="py-20 text-center">
                              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                            </td>
                          </tr>
                        ) : !leaderboard || leaderboard.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="py-20 text-center text-slate-500 italic"
                            >
                              No historical data found for this period.
                            </td>
                          </tr>
                        ) : (
                          leaderboard.map((entry) => {
                            const model = AI_MODELS.find(
                              (m) => m.id === entry.modelId
                            );
                            const avatar = getModelAvatar(entry.modelId, null);
                            const rankColors = {
                              1: "bg-amber-500/10 text-amber-500 border-amber-500/30",
                              2: "bg-slate-200/50 dark:bg-slate-700/50 text-slate-500 border-slate-300/30 dark:border-slate-600/30",
                              3: "bg-orange-500/10 text-orange-600 border-orange-500/30",
                            }[entry.rank as 1 | 2 | 3] ||
                              "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700";

                            return (
                              <tr
                                key={entry.modelId}
                                className="group hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors"
                              >
                                <td className="px-6 py-4">
                                  <div
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm border ${rankColors}`}
                                  >
                                    {entry.rank}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                                      <img
                                        src={avatar}
                                        alt={entry.modelName}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src =
                                            "/avatars/default.png";
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <p className="font-semibold text-slate-900 dark:text-white text-base">
                                        {entry.modelName}
                                      </p>
                                      <p className="text-xs text-slate-500 uppercase tracking-wide">
                                        {model?.id || entry.modelId}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                                    {entry.totalPoints}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className="text-sm font-medium text-slate-500 tabular-nums">
                                    {entry.totalDebates}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                                    <TrendingUp className="w-3 h-3" />
                                    {entry.avgPointsPerDebate} PPD
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
                    <span className="text-xs text-slate-500">
                      Showing {leaderboard?.length || 0} models
                    </span>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 dark:bg-card">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
                          Total Debates
                        </p>
                        <h4 className="text-3xl font-bold text-slate-900 dark:text-white">
                          {totalDebates}
                        </h4>
                      </div>
                      <span className="p-2 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400">
                        <MessageSquare className="w-5 h-5" />
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      All time engagements
                    </p>
                  </div>
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 dark:bg-card">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-1">
                          Active Models
                        </p>
                        <h4 className="text-3xl font-bold text-slate-900 dark:text-white">
                          {activeModels}
                        </h4>
                      </div>
                      <span className="p-2 rounded-lg bg-purple-500/20 text-purple-600 dark:text-purple-400">
                        <Bot className="w-5 h-5" />
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Participating in debates
                    </p>
                  </div>
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 dark:bg-card">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
                          Top Performer
                        </p>
                        <h4 className="text-2xl font-bold text-slate-900 dark:text-white truncate">
                          {topPerformer}
                        </h4>
                      </div>
                      <span className="p-2 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
                        <Trophy className="w-5 h-5" />
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Current leader
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "breakdown" && (
              <div className="grid gap-10 md:grid-cols-2">
                <div className="bg-white dark:bg-card border border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-6 self-start shadow-sm">
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                      Persona{" "}
                      <span className="text-primary italic">Deep Dive</span>
                    </h3>
                    <p className="text-slate-500 text-base leading-relaxed">
                      Select a specific AI entity to explore its dialectic
                      performance spectrum.
                    </p>
                  </div>

                  <div className="relative group">
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="appearance-none w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl h-14 px-6 text-base font-medium focus:ring-2 focus:ring-primary/50 focus:border-primary shadow-inner cursor-pointer"
                    >
                      <option value="">Select AI Entity...</option>
                      {AI_MODELS.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {modelStats ? (
                  <div className="bg-white dark:bg-card border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                    <div className="p-8 pb-6 bg-primary/5 border-b border-slate-100 dark:border-slate-800/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg border border-slate-100 dark:border-slate-700">
                            <img
                              src={getModelAvatar(modelStats.modelId, null)}
                              alt={modelStats.modelName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "/avatars/default.png";
                              }}
                            />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                              {modelStats.modelName}
                            </h3>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                              Analytical Profile
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                            PPD
                          </p>
                          <p className="text-3xl font-bold text-primary italic">
                            {modelStats.totalDebates > 0
                              ? (modelStats.totalPoints / modelStats.totalDebates).toFixed(1)
                              : "—"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-8 space-y-8">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Lifetime Points
                          </p>
                          <p className="text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
                            {modelStats.totalPoints}
                          </p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Total Sessions
                          </p>
                          <p className="text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
                            {modelStats.totalDebates}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <StatItem
                          icon={<Target className="text-red-500 w-5 h-5" />}
                          label="Moderator Pick Rate"
                          value={`${modelStats.moderatorPickRate}%`}
                          color="red"
                        />
                        <StatItem
                          icon={<Vote className="text-blue-500 w-5 h-5" />}
                          label="Peer Consensus"
                          value={modelStats.totalPeerVotes}
                          color="blue"
                        />
                        <StatItem
                          icon={
                            <Lightbulb className="text-amber-500 w-5 h-5" />
                          }
                          label="Strong Argument Index"
                          value={modelStats.strongArgumentMentions}
                          color="amber"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-card rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-16 text-center space-y-6 shadow-inner">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                      <Activity className="h-8 w-8 text-slate-300 animate-pulse" />
                    </div>
                    <p className="text-base text-slate-400 font-medium leading-relaxed max-w-xs italic">
                      Select a persona from the panel to view its real-time
                      analytical performance spectrum.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "h2h" && (
              <div className="bg-white dark:bg-card border border-slate-200 dark:border-slate-800 rounded-2xl p-10 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -z-10" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[100px] -z-10" />

                <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
                  <ModelSelectCard
                    label="Challenger"
                    modelId={selectedModelA}
                    onSelect={setSelectedModelA}
                    color="primary"
                  />

                  <div className="flex flex-col items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-inner group">
                      <Swords className="h-7 w-7 text-slate-400 group-hover:rotate-12 transition-transform" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">
                      VS
                    </span>
                  </div>

                  <ModelSelectCard
                    label="Rival"
                    modelId={selectedModelB}
                    onSelect={setSelectedModelB}
                    color="secondary"
                  />
                </div>

                {headToHead && headToHead.debatesTogether > 0 ? (
                  <div className="mt-16 space-y-10">
                    <div className="text-center space-y-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                        Arena Engagements
                      </p>
                      <p className="text-5xl font-bold text-slate-900 dark:text-white italic tabular-nums leading-none">
                        {headToHead.debatesTogether}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <MetricDisplay
                        icon={<Target className="h-7 w-7 text-red-500" />}
                        label="MODERATOR SELECTIONS"
                        valA={headToHead.modelA.moderatorPicks}
                        valB={headToHead.modelB.moderatorPicks}
                      />
                      <MetricDisplay
                        icon={<Vote className="h-7 w-7 text-blue-500" />}
                        label="PEER CONSENSUS"
                        valA={headToHead.modelA.peerVotes}
                        valB={headToHead.modelB.peerVotes}
                      />
                      <MetricDisplay
                        icon={<Award className="h-7 w-7 text-amber-500" />}
                        label="SESSION POINTS"
                        valA={headToHead.modelA.totalPoints}
                        valB={headToHead.modelB.totalPoints}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="mt-20 text-center py-10 border-t border-slate-100 dark:border-slate-800/50">
                    <p className="text-base text-slate-400 font-medium italic">
                      {selectedModelA && selectedModelB
                        ? "These analytical entities have not yet intersected in the dialectic arena."
                        : "Select two distinct personas to generate a comparative analysis."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function StatItem({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800/50 hover:border-primary/20 transition-all group">
      <div className="flex items-center gap-3">
        <div className="transition-transform group-hover:scale-110">{icon}</div>
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {label}
        </span>
      </div>
      <span
        className={`font-bold text-xl tabular-nums ${
          color === "red"
            ? "text-red-500"
            : color === "blue"
            ? "text-blue-500"
            : "text-amber-500"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function ModelSelectCard({
  label,
  modelId,
  onSelect,
  color,
}: {
  label: string;
  modelId: string;
  onSelect: (v: string) => void;
  color: "primary" | "secondary";
}) {
  const model = AI_MODELS.find((m) => m.id === modelId);
  const avatar = modelId ? getModelAvatar(modelId, null) : null;

  return (
    <div className="flex-1 w-full space-y-6 text-center bg-slate-50 dark:bg-slate-900/30 p-8 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm">
      <div className="relative group mx-auto w-28 h-28">
        <div
          className={`absolute inset-0 bg-${color}/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity`}
        />
        <div className="relative w-full h-full bg-white dark:bg-card border border-slate-200 dark:border-slate-700/50 rounded-full flex items-center justify-center overflow-hidden shadow-xl transition-transform group-hover:scale-110 duration-500">
          {avatar ? (
            <img
              src={avatar}
              alt={model?.name || "Select"}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/avatars/default.png";
              }}
            />
          ) : (
            <span className="text-5xl">❔</span>
          )}
        </div>
      </div>

      <div className="relative group">
        <select
          value={modelId}
          onChange={(e) => onSelect(e.target.value)}
          className="appearance-none w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl h-12 px-4 text-sm font-medium focus:ring-2 focus:ring-primary/50 shadow-sm cursor-pointer"
        >
          <option value="">{label} Select...</option>
          {AI_MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}

function MetricDisplay({
  icon,
  label,
  valA,
  valB,
}: {
  icon: React.ReactNode;
  label: string;
  valA: number;
  valB: number;
}) {
  const winner = valA > valB ? "left" : valB > valA ? "right" : "tie";
  return (
    <div className="bg-slate-50 dark:bg-slate-900/60 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center gap-5 text-center shadow-sm group">
      <div className="transition-transform group-hover:scale-125 duration-500">
        {icon}
      </div>
      <div className="flex items-center gap-6 w-full">
        <span
          className={`text-3xl font-bold tabular-nums flex-1 ${
            winner === "left" ? "text-primary" : "text-slate-400"
          }`}
        >
          {valA}
        </span>
        <div className="w-px h-10 bg-slate-200 dark:bg-slate-800 opacity-50" />
        <span
          className={`text-3xl font-bold tabular-nums flex-1 ${
            winner === "right" ? "text-purple-500" : "text-slate-400"
          }`}
        >
          {valB}
        </span>
      </div>
      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 leading-tight">
        {label}
      </span>
    </div>
  );
}
