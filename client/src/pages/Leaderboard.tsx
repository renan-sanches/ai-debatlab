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
  ChevronDown
} from "lucide-react";
import { AI_MODELS } from "../../../shared/models";
import DashboardLayout from "@/components/DashboardLayout";

// Custom Segmented Control instead of basic Tabs
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
    { enabled: isAuthenticated && !!selectedModelA && !!selectedModelB && selectedModelA !== selectedModelB }
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

  const timeFilterLabels: Record<TimeFilter, string> = {
    all: "All Time",
    "30days": "Last 30 Days",
    week: "This Week",
    "10debates": "Last 10 Sessions",
  };

  return (
    <DashboardLayout>
      <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display transition-colors duration-300 antialiased selection:bg-primary/30 min-h-full pb-20 p-6 lg:p-10">
        <div className="max-w-7xl mx-auto space-y-12">

          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50/50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-widest">
                <Trophy className="h-3 w-3" />
                Performance Metrics
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                AI <span className="text-amber-500 italic">Leaderboard</span>
              </h1>
              <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl leading-relaxed">
                Objective rankings based on logic, dialectics, and peer review. See which models dominate the arena.
              </p>
            </div>

            <div className="relative group">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
                className="appearance-none bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-2xl h-14 pl-6 pr-12 font-bold text-slate-700 dark:text-slate-200 focus:ring-amber-500 focus:border-amber-500 min-w-[200px] shadow-sm cursor-pointer"
              >
                {Object.entries(timeFilterLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Navigation Toggle */}
          <div className="flex justify-center">
            <div className="inline-flex items-center bg-slate-100 dark:bg-surface-dark p-1.5 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-inner">
              <button
                onClick={() => setActiveTab("rankings")}
                className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === "rankings" ? "bg-white dark:bg-slate-700 shadow-lg text-slate-900 dark:text-white ring-1 ring-black/5 dark:ring-white/10" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}
              >
                Rankings
              </button>
              <button
                onClick={() => setActiveTab("breakdown")}
                className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === "breakdown" ? "bg-white dark:bg-slate-700 shadow-lg text-slate-900 dark:text-white ring-1 ring-black/5 dark:ring-white/10" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}
              >
                Detailed Breakdown
              </button>
              <button
                onClick={() => setActiveTab("h2h")}
                className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === "h2h" ? "bg-white dark:bg-slate-700 shadow-lg text-slate-900 dark:text-white ring-1 ring-black/5 dark:ring-white/10" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}
              >
                Head-to-Head
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="mt-8">
            {activeTab === "rankings" && (
              <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                    <Medal className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{timeFilterLabels[timeFilter]} Rankings</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/40 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 dark:border-slate-800">
                        <th className="px-8 py-5 text-left">Pos</th>
                        <th className="px-8 py-5 text-left">Persona / Entity</th>
                        <th className="px-8 py-5 text-right">ELO Points</th>
                        <th className="px-8 py-5 text-right">Engagements</th>
                        <th className="px-8 py-5 text-right">Efficiency (PPD)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                      {isLoading ? (
                        <tr>
                          <td colSpan={5} className="py-20 text-center">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                          </td>
                        </tr>
                      ) : !leaderboard || leaderboard.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-20 text-center text-slate-500 italic">No historical data found for this period.</td>
                        </tr>
                      ) : (
                        leaderboard.map((entry) => {
                          const model = AI_MODELS.find(m => m.id === entry.modelId);
                          const isTop3 = entry.rank <= 3;
                          const rankColors = {
                            1: "bg-amber-500/10 text-amber-500 border-amber-500/30",
                            2: "bg-slate-300/10 text-slate-400 border-slate-300/30",
                            3: "bg-orange-800/10 text-orange-600 border-orange-800/30"
                          }[entry.rank as 1 | 2 | 3] || "text-slate-400";

                          return (
                            <tr key={entry.modelId} className="group hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                              <td className="px-8 py-6">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm border transition-all ${rankColors}`}>
                                  {entry.rank}
                                </div>
                              </td>
                              <td className="px-8 py-6">
                                <div className="flex items-center gap-5">
                                  <div className={`w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-3xl shadow-sm transition-transform group-hover:scale-110 duration-500 ${!isTop3 && 'grayscale group-hover:grayscale-0'}`}>
                                    {model?.icon || "🤖"}
                                  </div>
                                  <div>
                                    <p className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-primary transition-colors">{entry.modelName}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{model?.id}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-6 text-right font-black text-2xl tabular-nums text-slate-900 dark:text-white">{entry.totalPoints}</td>
                              <td className="px-8 py-6 text-right font-bold text-slate-500 tabular-nums">{entry.totalDebates}</td>
                              <td className="px-8 py-6 text-right">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-black tracking-widest border border-emerald-100 dark:border-emerald-500/20 uppercase">
                                  <TrendingUp className="h-3 w-3" />
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
              </div>
            )}

            {activeTab === "breakdown" && (
              <div className="grid gap-10 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10 space-y-8 self-start shadow-lg">
                  <div className="space-y-3">
                    <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">Persona <span className="text-primary italic">Deep Dive</span></h3>
                    <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed">Select a specific AI entity to explore its dialectic performance spectrum.</p>
                  </div>

                  <div className="relative group">
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="appearance-none w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl h-20 px-8 text-xl font-bold focus:ring-primary focus:border-primary shadow-inner cursor-pointer"
                    >
                      <option value="">Select AI Entity...</option>
                      {AI_MODELS.map((model) => (
                        <option key={model.id} value={model.id}>{model.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {modelStats ? (
                  <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
                    <div className="p-10 pb-6 bg-primary/5 border-b border-slate-100 dark:border-slate-800/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center text-5xl shadow-xl border border-slate-100 dark:border-slate-700">
                            {AI_MODELS.find(m => m.id === modelStats.modelId)?.icon}
                          </div>
                          <div>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white">{modelStats.modelName}</h3>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Analytical Profile</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Efficiency</p>
                          <p className="text-4xl font-black text-primary italic">A+</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-10 space-y-10">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lifetime Points</p>
                          <p className="text-4xl font-black tabular-nums text-slate-900 dark:text-white">{modelStats.totalPoints}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Sessions</p>
                          <p className="text-4xl font-black tabular-nums text-slate-900 dark:text-white">{modelStats.totalDebates}</p>
                        </div>
                      </div>

                      <div className="space-y-5">
                        <StatItem icon={<Target className="text-red-500" />} label="Moderator Pick Rate" value={`${modelStats.moderatorPickRate}%`} color="red" />
                        <StatItem icon={<Vote className="text-blue-500" />} label="Peer Consensus" value={modelStats.totalPeerVotes} color="blue" />
                        <StatItem icon={<Lightbulb className="text-amber-500" />} label="Strong Argument Index" value={modelStats.strongArgumentMentions} color="amber" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-surface-dark rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-20 text-center space-y-6 shadow-inner">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center">
                      <Activity className="h-8 w-8 text-slate-300 animate-pulse" />
                    </div>
                    <p className="text-lg text-slate-400 font-medium leading-relaxed max-w-xs italic">Select a persona from the panel to view its real-time analytical performance spectrum.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "h2h" && (
              <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 rounded-[3rem] p-12 shadow-2xl animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -z-10"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/5 rounded-full blur-[100px] -z-10"></div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-16 relative z-10">
                  <ModelSelectCard label="Challenger" modelId={selectedModelA} onSelect={setSelectedModelA} color="primary" />

                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-inner group">
                      <Swords className="h-8 w-8 text-slate-400 group-hover:rotate-12 transition-transform" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">VS</span>
                  </div>

                  <ModelSelectCard label="Rival" modelId={selectedModelB} onSelect={setSelectedModelB} color="secondary" />
                </div>

                {headToHead && headToHead.debatesTogether > 0 ? (
                  <div className="mt-20 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="text-center space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Arena Engagements</p>
                      <p className="text-6xl font-black text-slate-900 dark:text-white italic tabular-nums leading-none">{headToHead.debatesTogether}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <MetricDisplay icon={<Target className="h-8 w-8 text-red-500" />} label="MODERATOR SELECTIONS" valA={headToHead.modelA.moderatorPicks} valB={headToHead.modelB.moderatorPicks} />
                      <MetricDisplay icon={<Vote className="h-8 w-8 text-blue-500" />} label="PEER CONSENSUS" valA={headToHead.modelA.peerVotes} valB={headToHead.modelB.peerVotes} />
                      <MetricDisplay icon={<Award className="h-8 w-8 text-amber-500" />} label="SESSION POINTS" valA={headToHead.modelA.totalPoints} valB={headToHead.modelB.totalPoints} />
                    </div>
                  </div>
                ) : (
                  <div className="mt-24 text-center py-12 border-t border-slate-100 dark:border-slate-800/50">
                    <p className="text-lg text-slate-400 font-medium italic">
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

function StatItem({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color: string }) {
  return (
    <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800/50 hover:border-primary/20 transition-all group">
      <div className="flex items-center gap-4">
        <div className="p-2 transition-transform group-hover:scale-110">
          {icon}
        </div>
        <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{label}</span>
      </div>
      <span className={`font-black text-2xl tabular-nums ${color === 'red' ? 'text-red-500' : color === 'blue' ? 'text-blue-500' : 'text-amber-500'}`}>
        {value}
      </span>
    </div>
  );
}

function ModelSelectCard({ label, modelId, onSelect, color }: { label: string, modelId: string, onSelect: (v: string) => void, color: "primary" | "secondary" }) {
  const model = AI_MODELS.find(m => m.id === modelId);
  return (
    <div className="flex-1 w-full space-y-8 text-center bg-slate-50 dark:bg-slate-900/30 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800/50 shadow-sm">
      <div className="relative group mx-auto w-36 h-36">
        <div className={`absolute inset-0 bg-${color}/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity`}></div>
        <div className="relative w-full h-full bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/50 rounded-full flex items-center justify-center text-7xl shadow-2xl transition-transform group-hover:scale-110 duration-500">
          {model?.icon || "❔"}
        </div>
      </div>

      <div className="relative group">
        <select
          value={modelId}
          onChange={(e) => onSelect(e.target.value)}
          className="appearance-none w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl h-14 px-6 text-sm font-bold focus:ring-primary shadow-sm cursor-pointer"
        >
          <option value="">{label} Select...</option>
          {AI_MODELS.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
      </div>
    </div>
  );
}

function MetricDisplay({ icon, label, valA, valB }: { icon: React.ReactNode, label: string, valA: number, valB: number }) {
  const winner = valA > valB ? 'left' : valB > valA ? 'right' : 'tie';
  return (
    <div className="bg-slate-50 dark:bg-slate-900/60 p-10 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center gap-6 text-center shadow-lg group">
      <div className="transition-transform group-hover:scale-125 duration-500">
        {icon}
      </div>
      <div className="flex items-center gap-8 w-full">
        <span className={`text-4xl font-black tabular-nums flex-1 ${winner === 'left' ? 'text-primary' : 'text-slate-400'}`}>{valA}</span>
        <div className="w-px h-12 bg-slate-200 dark:bg-slate-800 opacity-50"></div>
        <span className={`text-4xl font-black tabular-nums flex-1 ${winner === 'right' ? 'text-secondary' : 'text-slate-400'}`}>{valB}</span>
      </div>
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 leading-tight">{label}</span>
    </div>
  );
}
