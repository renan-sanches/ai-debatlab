import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Heart, Search, ChevronDown, Image as ImageIcon, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AIModel } from "../../../shared/models";

interface ModelSelectorProps {
  selectedModels: string[];
  onSelectionChange: (models: string[]) => void;
  maxSelection?: number;
  showModerator?: boolean;
  moderatorModel?: string;
  onModeratorChange?: (model: string) => void;
}

export function ModelSelector({
  selectedModels,
  onSelectionChange,
  maxSelection = 6,
  showModerator = false,
  moderatorModel,
  onModeratorChange,
}: ModelSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  // Fetch leader models and all OpenRouter models
  const { data: leaderModels } = trpc.models.leaders.useQuery();
  const { data: allModelsData, isLoading: isLoadingAll } = trpc.models.all.useQuery();
  const { data: favorites } = trpc.models.favorites.useQuery();

  const addFavorite = trpc.models.addFavorite.useMutation();
  const removeFavorite = trpc.models.removeFavorite.useMutation();
  const utils = trpc.useUtils();

  // Combine leaders and favorites for quick-select bubbles
  const quickSelectModels = useMemo(() => {
    const leaders = leaderModels || [];
    const favs = favorites || [];

    // Convert favorites to AIModel format
    const favModels: AIModel[] = favs.map(f => ({
      id: f.openRouterId.replace(/\//g, "-"),
      name: f.modelName,
      provider: f.openRouterId.split("/")[0] || "unknown",
      openRouterId: f.openRouterId,
      icon: "❤️",
      color: "#EF4444",
      lens: "Your favorite model",
      isLeader: false,
    }));

    // Merge, removing duplicates (favorites take priority)
    const favIds = new Set(favModels.map(f => f.openRouterId));
    const uniqueLeaders = leaders.filter(l => !favIds.has(l.openRouterId));

    // Limit to 7 to fit the grid with the "Browse" card making it 8
    return [...favModels, ...uniqueLeaders].slice(0, 7);
  }, [leaderModels, favorites]);

  // Group all models by provider
  const modelsByProvider = useMemo(() => {
    if (!allModelsData?.models) return {};

    const grouped: Record<string, AIModel[]> = {};
    for (const model of allModelsData.models) {
      const provider = model.provider;
      if (!grouped[provider]) grouped[provider] = [];
      grouped[provider].push(model);
    }

    // Sort providers by model count
    return Object.fromEntries(
      Object.entries(grouped).sort((a, b) => b[1].length - a[1].length)
    );
  }, [allModelsData]);

  // Filter models based on search
  const filteredModels = useMemo(() => {
    if (!allModelsData?.models) return [];

    let models = allModelsData.models;

    if (selectedProvider) {
      models = models.filter(m => m.provider === selectedProvider);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      models = models.filter(m =>
        m.name.toLowerCase().includes(query) ||
        m.provider.toLowerCase().includes(query) ||
        m.openRouterId.toLowerCase().includes(query)
      );
    }

    return models;
  }, [allModelsData, searchQuery, selectedProvider]);

  const toggleModel = (model: AIModel) => {
    const modelId = model.openRouterId;
    if (selectedModels.includes(modelId)) {
      onSelectionChange(selectedModels.filter(id => id !== modelId));
    } else if (selectedModels.length < maxSelection) {
      onSelectionChange([...selectedModels, modelId]);
    }
  };

  const toggleFavorite = async (model: AIModel) => {
    const isFav = favorites?.some(f => f.openRouterId === model.openRouterId);
    if (isFav) {
      await removeFavorite.mutateAsync({ openRouterId: model.openRouterId });
    } else {
      await addFavorite.mutateAsync({ openRouterId: model.openRouterId, modelName: model.name });
    }
    utils.models.favorites.invalidate();
  };

  const isFavorite = (model: AIModel) => {
    return favorites?.some(f => f.openRouterId === model.openRouterId);
  };

  const isSelected = (model: AIModel) => {
    return selectedModels.includes(model.openRouterId);
  };

  return (
    <div className="space-y-6">
      {/* Quick-select Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickSelectModels.map((model) => (
          <button
            key={model.openRouterId}
            onClick={() => toggleModel(model)}
            className={cn(
              "relative flex flex-col items-start p-4 rounded-xl border-2 transition-all h-24 justify-center text-left group",
              isSelected(model)
                ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 shadow-[0_0_0_1px_rgba(59,130,246,0.1)]"
                : "border-border hover:border-blue-200 dark:hover:border-blue-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 bg-white dark:bg-[#0b101b]"
            )}
          >
            <div className="flex items-center gap-2 mb-1 w-full">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: model.color }}
              />
              <span className="font-semibold text-sm text-foreground truncate">{model.name}</span>
            </div>
            <div className="pl-4.5 flex items-center justify-between w-full">
               <span className="text-xs text-muted-foreground capitalize truncate max-w-[80%]">
                 {model.provider}
               </span>
               {model.supportsImages && (
                  <ImageIcon className="w-3.5 h-3.5 text-muted-foreground/70" />
               )}
            </div>

            {isSelected(model) && (
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500" />
            )}
          </button>
        ))}

        {/* Browse More Button Card */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <button className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all h-24 group bg-transparent">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-1">
                Browse {allModelsData?.total ? `${allModelsData.total}+` : "more"} models
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[85vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                All OpenRouter Models ({allModelsData?.total || 0})
              </DialogTitle>
            </DialogHeader>

            <div className="flex gap-4 mt-4 h-[60vh]">
              {/* Provider sidebar */}
              <div className="w-48 shrink-0 flex flex-col">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
                  Providers
                </div>
                <ScrollArea className="flex-1">
                  <div className="space-y-1 pr-3 pb-4">
                    <button
                      onClick={() => setSelectedProvider(null)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors font-medium",
                        !selectedProvider
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      All Providers
                    </button>
                    {Object.entries(modelsByProvider).map(([provider, models]) => (
                      <button
                        key={provider}
                        onClick={() => setSelectedProvider(provider)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex justify-between group",
                          selectedProvider === provider
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                      >
                        <span className="capitalize truncate">{provider}</span>
                        <span className={cn(
                          "text-xs px-1.5 py-0.5 rounded-full",
                          selectedProvider === provider
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "bg-muted text-muted-foreground group-hover:bg-background"
                        )}>
                          {models.length}
                        </span>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Model list */}
              <div className="flex-1 flex flex-col">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search models..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-accent/20 border-border/50"
                  />
                </div>

                <div className="flex-1 border border-border rounded-xl overflow-hidden bg-accent/10">
                  <ScrollArea className="h-full">
                    {isLoadingAll ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="flex flex-col items-center gap-2">
                          <div className="animate-spin w-8 h-8 border-3 border-primary border-t-transparent rounded-full" />
                          <p className="text-sm text-muted-foreground">Loading models...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {filteredModels.map((model) => (
                          <div
                            key={model.openRouterId}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer relative group",
                              isSelected(model)
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-transparent bg-background hover:border-border hover:shadow-sm"
                            )}
                            onClick={() => toggleModel(model)}
                          >
                            <Checkbox
                              checked={isSelected(model)}
                              onCheckedChange={() => toggleModel(model)}
                              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: model.color }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate text-sm">{model.name}</span>
                                {model.supportsImages && (
                                  <ImageIcon className="w-3 h-3 text-muted-foreground shrink-0" />
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                <span className="capitalize">{model.provider}</span>
                                <span className="text-[10px] opacity-50">•</span>
                                <span className="opacity-70">{model.openRouterId.split('/')[1]}</span>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(model);
                              }}
                              className={cn(
                                "p-1.5 rounded-md transition-colors opacity-0 group-hover:opacity-100",
                                isFavorite(model)
                                  ? "opacity-100 text-red-500 hover:bg-red-500/10"
                                  : "text-muted-foreground hover:text-red-500 hover:bg-accent"
                              )}
                            >
                              <Heart
                                className="w-4 h-4"
                                fill={isFavorite(model) ? "currentColor" : "none"}
                              />
                            </button>
                          </div>
                        ))}

                        {filteredModels.length === 0 && (
                          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                              <Search className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground font-medium">No models found</p>
                            <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filter</p>
                          </div>
                        )}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{selectedModels.length}</span> models selected
              </div>
              <Button onClick={() => setIsModalOpen(false)}>
                Done
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Selected models display (if any selected but not in quick view) - can be hidden if we trust the grid */}
      {/* Keeping it simple as per mockup request, but maybe we should remove the 'chips' below since the grid shows selection clearly?
          However, if a user selects a model from 'Browse' that is NOT in quick select, they won't see it in the grid.
          So we should probably keep the chips or add the selected model to the grid dynamically?
          The mockup implies the grid IS the selection interface.
          For now, I'll keep the chips but make them cleaner, or better yet, if a model is selected but not in quick view, maybe we can't easily show it in the grid without disrupting the layout.
          Let's keep the chips below for "overflow" selection visibility.
      */}

      {selectedModels.length > 0 && (
        <div className="flex flex-wrap gap-2">
           {/* Only show chips for models NOT in quick select to avoid duplication?
               Or show all for clarity. The mockup doesn't show chips.
               But functionally, if I select a model from the modal that isn't in the top 7, where does it go?
               I'll show chips for ALL selected models but keep them small.
           */}
           {selectedModels.map((modelId) => {
             // Check if it's already visible in the grid
             const isInGrid = quickSelectModels.some(m => m.openRouterId === modelId);
             if (isInGrid) return null; // Don't duplicate if in grid

             const model = allModelsData?.models.find(m => m.openRouterId === modelId) ||
               quickSelectModels.find(m => m.openRouterId === modelId);

             return (
              <span
                key={modelId}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent/50 border border-border rounded-full text-xs font-medium animate-in fade-in zoom-in-95"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: model?.color || "#6B7280" }}
                />
                {model?.name || modelId}
                <button
                  onClick={() =>
                    onSelectionChange(selectedModels.filter((id) => id !== modelId))
                  }
                  className="ml-1 text-muted-foreground hover:text-foreground p-0.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                >
                  <span className="sr-only">Remove</span>
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Moderator selection (if enabled) */}
      {showModerator && onModeratorChange && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Moderator Model</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickSelectModels.slice(0, 4).map((model) => (
              <button
                key={model.openRouterId}
                onClick={() => onModeratorChange(model.openRouterId)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left",
                  moderatorModel === model.openRouterId
                    ? "border-amber-500 bg-amber-50/50 dark:bg-amber-900/10 shadow-[0_0_0_1px_rgba(245,158,11,0.1)]"
                    : "border-border hover:border-amber-200 dark:hover:border-amber-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: model.color }}
                />
                <div className="flex flex-col">
                    <span className="font-medium text-sm">{model.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
