import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  Target,
  Vote,
  Lightbulb,
  Drama,
  TrendingUp,
  Swords,
  Sparkles,
  Loader2,
  Medal,
  Activity,
  Award
} from "lucide-react";
import { AI_MODELS } from "../../../shared/models";
import { DashboardLayout } from "@/components/DashboardLayout";

export default function Leaderboard() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [timeFilter, setTimeFilter] = useState<"all" | "30days" | "week" | "10debates">("all");
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
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const timeFilterLabels = {
    all: "All Time",
    "30days": "Last 30 Days",
    week: "This Week",
    "10debates": "Last 10 Debates",
  };

  return (
    <DashboardLayout>
      <div className="min-h-full premium-bg p-6 lg:p-10">
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-[0.3em] mb-1">
                <Trophy className="h-4 w-4" />
                Performance Metrics
              </div>
              <h1 className="text-4xl font-black tracking-tight text-foreground">
                AI <span className="text-amber-500 italic">Leaderboard</span>
              </h1>
              <p className="text-muted-foreground text-sm max-w-md">
                Tracking model performance based on logic, dialectics, and peer review data.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as typeof timeFilter)}>
                <SelectTrigger className="w-[180px] bg-background/40 backdrop-blur-xl border-white/5 rounded-xl h-12 shadow-inner">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-panel border-white/10 rounded-xl">
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="10debates">Last 10 Debates</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="leaderboard" className="space-y-8">
            <div className="flex justify-center">
              <TabsList className="bg-background/40 backdrop-blur-2xl p-1.5 rounded-2xl border border-white/5 h-auto self-center">
                <TabsTrigger value="leaderboard" className="px-8 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 transition-all">Rankings</TabsTrigger>
                <TabsTrigger value="breakdown" className="px-8 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 transition-all">Breakdown</TabsTrigger>
                <TabsTrigger value="headtohead" className="px-8 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 transition-all">H2H</TabsTrigger>
              </TabsList>
            </div>

            {/* Main Leaderboard */}
            <TabsContent value="leaderboard" className="animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none">
              <Card className="glass-panel border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
                <CardHeader className="p-8 pb-4 border-b border-white/5">
                  <CardTitle className="flex items-center gap-3 text-xl font-black">
                    <Medal className="h-6 w-6 text-amber-500" />
                    {timeFilterLabels[timeFilter]} Global Ranking
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Calculating Scores...</span>
                    </div>
                  ) : !leaderboard || leaderboard.length === 0 ? (
                    <div className="py-20 text-center">
                      <p className="text-muted-foreground italic">No historical data found for this period.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground border-b border-white/5">
                            <th className="px-8 py-5 text-left">Pos</th>
                            <th className="px-8 py-5 text-left">Persona / Model</th>
                            <th className="px-8 py-5 text-right">ELO / Pts</th>
                            <th className="px-8 py-5 text-right">Sessions</th>
                            <th className="px-8 py-5 text-right">Efficiency</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {leaderboard.map((entry, idx) => {
                            const model = AI_MODELS.find(m => m.id === entry.modelId);
                            return (
                              <tr key={entry.modelId} className="group hover:bg-white/[0.02] transition-colors">
                                <td className="px-8 py-6">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${entry.rank === 1 ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                                      entry.rank === 2 ? "bg-slate-300/10 text-slate-300 border border-slate-300/20" :
                                        entry.rank === 3 ? "bg-amber-800/10 text-amber-800 border border-amber-800/20" :
                                          "text-muted-foreground"
                                    }`}>
                                    {entry.rank}
                                  </div>
                                </td>
                                <td className="px-8 py-6">
                                  <div className="flex items-center gap-4">
                                    <div className="text-3xl grayscale group-hover:grayscale-0 transition-all duration-300 scale-100 group-hover:scale-110">
                                      {model?.icon || "🤖"}
                                    </div>
                                    <div>
                                      <p className="font-bold text-lg group-hover:text-primary transition-colors">{entry.modelName}</p>
                                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{model?.id}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-8 py-6 text-right font-black text-xl tabular-nums">{entry.totalPoints}</td>
                                <td className="px-8 py-6 text-right font-bold text-slate-400 tabular-nums">{entry.totalDebates}</td>
                                <td className="px-8 py-6 text-right">
                                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-xs font-black border border-emerald-500/20">
                                    <TrendingUp className="h-3 w-3" />
                                    {entry.avgPointsPerDebate} PPD
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance Breakdown */}
            <TabsContent value="breakdown" className="animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none">
              <div className="grid gap-8 md:grid-cols-2">
                <Card className="glass-panel border-none rounded-[2rem] p-8 space-y-6 self-start">
                  <div className="space-y-2">
                    <h3 className="text-xl font-black">Analytical <span className="text-primary italic">Deep Dive</span></h3>
                    <p className="text-sm text-muted-foreground">Select a specific persona to evaluate their dialectic metrics.</p>
                  </div>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="h-16 bg-background/50 border-white/5 rounded-2xl text-lg px-6">
                      <SelectValue placeholder="Chose an AI Model..." />
                    </SelectTrigger>
                    <SelectContent className="glass-panel border-white/10 rounded-2xl">
                      {AI_MODELS.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{model.icon}</span>
                            <span className="font-bold">{model.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Card>

                {modelStats ? (
                  <Card className="glass-panel border-none rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                    <CardHeader className="p-8 pb-4 bg-primary/5 border-b border-white/5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-4xl">{AI_MODELS.find(m => m.id === modelStats.modelId)?.icon}</span>
                          <div>
                            <CardTitle className="text-2xl font-black">{modelStats.modelName}</CardTitle>
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Persona Profile</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground uppercase font-black tracking-widest">Global Rank</p>
                          <p className="text-3xl font-black text-primary italic">#1</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Score</p>
                          <p className="text-3xl font-black tabular-nums">{modelStats.totalPoints}</p>
                        </div>
                        <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Debate Limit</p>
                          <p className="text-3xl font-black tabular-nums">{modelStats.totalDebates}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 px-6 bg-background/40 rounded-2xl border border-white/5">
                          <span className="flex items-center gap-3 text-sm font-bold">
                            <Target className="w-5 h-5 text-red-500" />
                            Moderator Pick Rate
                          </span>
                          <span className="font-black text-lg text-red-500">
                            {modelStats.moderatorPickRate}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-4 px-6 bg-background/40 rounded-2xl border border-white/5">
                          <span className="flex items-center gap-3 text-sm font-bold">
                            <Vote className="w-5 h-5 text-blue-500" />
                            Peer Consensus (Votes)
                          </span>
                          <span className="font-black text-lg text-blue-500">{modelStats.totalPeerVotes}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 px-6 bg-background/40 rounded-2xl border border-white/5">
                          <span className="flex items-center gap-3 text-sm font-bold">
                            <Lightbulb className="w-5 h-5 text-yellow-500" />
                            Strong Arguments
                          </span>
                          <span className="font-black text-lg text-yellow-500">{modelStats.strongArgumentMentions}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="glass-panel rounded-[2.5rem] border-dashed border-white/10 flex flex-col items-center justify-center p-20 text-center space-y-4">
                    <Activity className="h-12 w-12 text-muted-foreground opacity-20" />
                    <p className="text-sm text-muted-foreground italic">Select a model to view detailed performance metrics.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Head-to-Head */}
            <TabsContent value="headtohead" className="animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none">
              <Card className="glass-panel border-none shadow-2xl rounded-[3rem] p-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                  {/* Model A */}
                  <div className="flex-1 w-full space-y-6 text-center">
                    <div className="relative group mx-auto w-32 h-32">
                      <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative w-full h-full bg-background/50 backdrop-blur-3xl border border-white/10 rounded-full flex items-center justify-center text-6xl shadow-2xl">
                        {AI_MODELS.find(m => m.id === selectedModelA)?.icon || "❔"}
                      </div>
                    </div>
                    <Select value={selectedModelA} onValueChange={setSelectedModelA}>
                      <SelectTrigger className="h-12 bg-white/5 border-white/5 rounded-xl font-bold">
                        <SelectValue placeholder="Select Challenger" />
                      </SelectTrigger>
                      <SelectContent className="glass-panel border-white/10 rounded-xl">
                        {AI_MODELS.map((model) => (
                          <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                      <Swords className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">VERSUS</span>
                  </div>

                  {/* Model B */}
                  <div className="flex-1 w-full space-y-6 text-center">
                    <div className="relative group mx-auto w-32 h-32">
                      <div className="absolute inset-0 bg-secondary/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative w-full h-full bg-background/50 backdrop-blur-3xl border border-white/10 rounded-full flex items-center justify-center text-6xl shadow-2xl">
                        {AI_MODELS.find(m => m.id === selectedModelB)?.icon || "❔"}
                      </div>
                    </div>
                    <Select value={selectedModelB} onValueChange={setSelectedModelB}>
                      <SelectTrigger className="h-12 bg-white/5 border-white/5 rounded-xl font-bold">
                        <SelectValue placeholder="Select Rival" />
                      </SelectTrigger>
                      <SelectContent className="glass-panel border-white/10 rounded-xl">
                        {AI_MODELS.filter(m => m.id !== selectedModelA).map((model) => (
                          <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {headToHead && headToHead.debatesTogether > 0 ? (
                  <div className="mt-16 space-y-10 animate-in fade-in zoom-in-95 duration-500">
                    <div className="text-center space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Direct Engagements</p>
                      <p className="text-5xl font-black text-primary italic tabular-nums">{headToHead.debatesTogether}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 flex flex-col items-center justify-center gap-4 text-center">
                        <Target className="h-8 w-8 text-red-500" />
                        <div className="flex items-center gap-6">
                          <span className="text-3xl font-black tabular-nums">{headToHead.modelA.moderatorPicks}</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">MODERATOR<br />PICKS</span>
                          <span className="text-3xl font-black tabular-nums">{headToHead.modelB.moderatorPicks}</span>
                        </div>
                      </div>
                      <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 flex flex-col items-center justify-center gap-4 text-center">
                        <Vote className="h-8 w-8 text-blue-500" />
                        <div className="flex items-center gap-6">
                          <span className="text-3xl font-black tabular-nums">{headToHead.modelA.peerVotes}</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">PEER<br />VOTES</span>
                          <span className="text-3xl font-black tabular-nums">{headToHead.modelB.peerVotes}</span>
                        </div>
                      </div>
                      <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 flex flex-col items-center justify-center gap-4 text-center">
                        <Award className="h-8 w-8 text-amber-500" />
                        <div className="flex items-center gap-6">
                          <span className="text-3xl font-black tabular-nums">{headToHead.modelA.totalPoints}</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">TOTAL<br />POINTS</span>
                          <span className="text-3xl font-black tabular-nums">{headToHead.modelB.totalPoints}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-16 text-center py-10 border-t border-white/5">
                    <p className="text-sm text-muted-foreground italic">
                      {selectedModelA && selectedModelB
                        ? "These analytical entities have not yet intersected in the dialectic arena."
                        : "Select two distinct personas to generate a comparative analysis."}
                    </p>
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  );
}
