import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Target, Vote, Lightbulb, Drama, TrendingUp, Swords, ArrowLeft, Sparkles, BookOpen } from "lucide-react";
import { getLoginUrl } from "@/const";
import { AI_MODELS } from "../../../shared/models";

export default function Leaderboard() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Trophy className="w-16 h-16 text-yellow-500" />
        <h1 className="text-2xl font-bold">AI Leaderboard</h1>
        <p className="text-muted-foreground">Sign in to view your AI model rankings</p>
        <Button asChild>
          <a href={getLoginUrl()}>Sign In</a>
        </Button>
      </div>
    );
  }

  const timeFilterLabels = {
    all: "All Time",
    "30days": "Last 30 Days",
    week: "This Week",
    "10debates": "Last 10 Debates",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80">
              <Sparkles className="w-6 h-6" />
              <span className="font-bold text-lg">AI DebateLab</span>
            </Link>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <Sparkles className="w-4 h-4 mr-2" />
                New Debate
              </Button>
            </Link>
            <Link href="/library">
              <Button variant="ghost" size="sm">
                <BookOpen className="w-4 h-4 mr-2" />
                Library
              </Button>
            </Link>
            <span className="text-sm text-muted-foreground">{user?.name}</span>
          </nav>
        </div>
      </header>

      <main className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-500" />
              AI Leaderboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Track which AI models perform best in your debates
            </p>
          </div>
          <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as typeof timeFilter)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="10debates">Last 10 Debates</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="leaderboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="leaderboard">Rankings</TabsTrigger>
            <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
            <TabsTrigger value="headtohead">Head-to-Head</TabsTrigger>
          </TabsList>

          {/* Main Leaderboard */}
          <TabsContent value="leaderboard">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  {timeFilterLabels[timeFilter]} Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : !leaderboard || leaderboard.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No debate data yet</p>
                    <Link href="/">
                      <Button>Start Your First Debate</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border text-left text-sm text-muted-foreground">
                          <th className="pb-3 pr-4">Rank</th>
                          <th className="pb-3 pr-4">Model</th>
                          <th className="pb-3 pr-4 text-right">Points</th>
                          <th className="pb-3 pr-4 text-right">Debates</th>
                          <th className="pb-3 text-right">Avg/PPD</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.map((entry) => (
                          <tr key={entry.modelId} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="py-4 pr-4">
                              <span className={`font-bold ${
                                entry.rank === 1 ? "text-yellow-500" :
                                entry.rank === 2 ? "text-gray-400" :
                                entry.rank === 3 ? "text-amber-600" :
                                "text-muted-foreground"
                              }`}>
                                {entry.rank}
                              </span>
                            </td>
                            <td className="py-4 pr-4">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: entry.modelColor }}
                                />
                                <span className="font-medium">{entry.modelName}</span>
                              </div>
                            </td>
                            <td className="py-4 pr-4 text-right font-bold">{entry.totalPoints}</td>
                            <td className="py-4 pr-4 text-right text-muted-foreground">{entry.totalDebates}</td>
                            <td className="py-4 text-right text-muted-foreground">{entry.avgPointsPerDebate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Breakdown */}
          <TabsContent value="breakdown">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Select Model</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a model..." />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_MODELS.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: model.color }}
                            />
                            {model.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {modelStats && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="w-5 h-5" />
                      Performance Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-border">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: modelStats.modelColor }}
                      />
                      <span className="font-bold text-lg">{modelStats.modelName}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Points</p>
                        <p className="text-2xl font-bold">{modelStats.totalPoints}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Debates</p>
                        <p className="text-2xl font-bold">{modelStats.totalDebates}</p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm">
                          <Target className="w-4 h-4 text-red-500" />
                          Moderator Picks
                        </span>
                        <span className="font-medium">
                          {modelStats.moderatorPicks} ({modelStats.moderatorPickRate}%)
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm">
                          <Vote className="w-4 h-4 text-blue-500" />
                          Total Peer Votes
                        </span>
                        <span className="font-medium">{modelStats.totalPeerVotes}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm">
                          <Lightbulb className="w-4 h-4 text-yellow-500" />
                          Strong Arguments
                        </span>
                        <span className="font-medium">{modelStats.strongArgumentMentions}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm">
                          <Drama className="w-4 h-4 text-purple-500" />
                          Devil's Advocate Wins
                        </span>
                        <span className="font-medium">{modelStats.devilsAdvocateWins}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border">
                      <p className="text-sm text-muted-foreground">Recent Form</p>
                      <p className="flex items-center gap-1 text-lg font-medium">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        +{modelStats.recentPoints} points (last 3 debates)
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Head-to-Head */}
          <TabsContent value="headtohead">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Swords className="w-5 h-5" />
                  Head-to-Head Comparison
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Select value={selectedModelA} onValueChange={setSelectedModelA}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select first model..." />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_MODELS.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: model.color }}
                            />
                            {model.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedModelB} onValueChange={setSelectedModelB}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select second model..." />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_MODELS.filter(m => m.id !== selectedModelA).map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: model.color }}
                            />
                            {model.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {headToHead && headToHead.debatesTogether > 0 ? (
                  <div className="space-y-6">
                    <div className="text-center py-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground">Debates Together</p>
                      <p className="text-3xl font-bold">{headToHead.debatesTogether}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div 
                          className="w-4 h-4 rounded-full mx-auto mb-2" 
                          style={{ backgroundColor: headToHead.modelA.color }}
                        />
                        <p className="font-medium text-sm">{headToHead.modelA.name}</p>
                      </div>
                      <div className="text-muted-foreground text-sm pt-6">vs</div>
                      <div>
                        <div 
                          className="w-4 h-4 rounded-full mx-auto mb-2" 
                          style={{ backgroundColor: headToHead.modelB.color }}
                        />
                        <p className="font-medium text-sm">{headToHead.modelB.name}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-3 border-b border-border">
                        <span className="font-bold text-lg">{headToHead.modelA.moderatorPicks}</span>
                        <span className="text-sm text-muted-foreground">Moderator Picks</span>
                        <span className="font-bold text-lg">{headToHead.modelB.moderatorPicks}</span>
                      </div>
                      <div className="flex items-center justify-between py-3 border-b border-border">
                        <span className="font-bold text-lg">{headToHead.modelA.peerVotes}</span>
                        <span className="text-sm text-muted-foreground">Peer Votes</span>
                        <span className="font-bold text-lg">{headToHead.modelB.peerVotes}</span>
                      </div>
                      <div className="flex items-center justify-between py-3">
                        <span className="font-bold text-lg">{headToHead.modelA.totalPoints}</span>
                        <span className="text-sm text-muted-foreground">Total Points</span>
                        <span className="font-bold text-lg">{headToHead.modelB.totalPoints}</span>
                      </div>
                    </div>
                  </div>
                ) : selectedModelA && selectedModelB && selectedModelA !== selectedModelB ? (
                  <div className="text-center py-8 text-muted-foreground">
                    These models haven't debated together yet
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Select two different models to compare
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
