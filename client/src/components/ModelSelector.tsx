import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Heart, Search, ChevronDown, Image as ImageIcon, Sparkles } from "lucide-react";
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

    return [...favModels, ...uniqueLeaders].slice(0, 8);
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
    <div className="space-y-4">
      {/* Quick-select bubbles (Leaders + Favorites) */}
      <div>
        <div className="text-sm text-muted-foreground mb-2">
          Quick Select ({selectedModels.length}/{maxSelection} selected)
        </div>
        <div className="flex flex-wrap gap-2">
          {quickSelectModels.map((model) => (
            <button
              key={model.openRouterId}
              onClick={() => toggleModel(model)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
                isSelected(model)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50 hover:bg-accent"
              )}
            >
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: model.color }}
              />
              <span className="text-sm font-medium">{model.name}</span>
              {model.supportsImages && (
                <ImageIcon className="w-3 h-3 text-muted-foreground" />
              )}
            </button>
          ))}

          {/* Browse More Button */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border hover:border-primary/50 hover:bg-accent transition-all">
                <ChevronDown className="w-4 h-4" />
                <span className="text-sm">Browse {allModelsData?.total || "200+"}+ models</span>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[85vh]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  All OpenRouter Models ({allModelsData?.total || 0})
                </DialogTitle>
              </DialogHeader>

              <div className="flex gap-4 mt-4">
                {/* Provider sidebar */}
                <div className="w-48 shrink-0">
                  <div className="text-sm font-medium mb-2">Providers</div>
                  <ScrollArea className="h-[50vh]">
                    <div className="space-y-1 pr-4">
                      <button
                        onClick={() => setSelectedProvider(null)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                          !selectedProvider ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                        )}
                      >
                        All Providers
                      </button>
                      {Object.entries(modelsByProvider).map(([provider, models]) => (
                        <button
                          key={provider}
                          onClick={() => setSelectedProvider(provider)}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex justify-between",
                            selectedProvider === provider ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                          )}
                        >
                          <span className="capitalize">{provider}</span>
                          <span className="text-muted-foreground">{models.length}</span>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Model list */}
                <div className="flex-1">
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search models..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  <ScrollArea className="h-[50vh]">
                    {isLoadingAll ? (
                      <div className="flex items-center justify-center h-32">
                        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
                      </div>
                    ) : (
                      <div className="space-y-1 pr-4">
                        {filteredModels.map((model) => (
                          <div
                            key={model.openRouterId}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer",
                              isSelected(model)
                                ? "border-primary bg-primary/10"
                                : "border-transparent hover:bg-accent"
                            )}
                            onClick={() => toggleModel(model)}
                          >
                            <Checkbox
                              checked={isSelected(model)}
                              onCheckedChange={() => toggleModel(model)}
                            />
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: model.color }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate">{model.name}</span>
                                {model.supportsImages && (
                                  <ImageIcon className="w-3 h-3 text-muted-foreground shrink-0" />
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {model.openRouterId}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(model);
                              }}
                              className={cn(
                                "p-1.5 rounded-md transition-colors",
                                isFavorite(model)
                                  ? "text-red-500 hover:bg-red-500/10"
                                  : "text-muted-foreground hover:text-red-500 hover:bg-accent"
                              )}
                              aria-label={
                                isFavorite(model)
                                  ? "Remove from favorites"
                                  : "Add to favorites"
                              }
                              title={
                                isFavorite(model)
                                  ? "Remove from favorites"
                                  : "Add to favorites"
                              }
                            >
                              <Heart
                                className="w-4 h-4"
                                fill={isFavorite(model) ? "currentColor" : "none"}
                              />
                            </button>
                          </div>
                        ))}

                        {filteredModels.length === 0 && (
                          <div className="text-center text-muted-foreground py-8">
                            No models found matching "{searchQuery}"
                          </div>
                        )}
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </div>

              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  {selectedModels.length} models selected
                </div>
                <Button onClick={() => setIsModalOpen(false)}>
                  Done
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Selected models display */}
      {selectedModels.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 bg-accent/50 rounded-lg">
          <span className="text-sm text-muted-foreground mr-2">Selected:</span>
          {selectedModels.map((modelId) => {
            const model = allModelsData?.models.find(m => m.openRouterId === modelId) ||
              quickSelectModels.find(m => m.openRouterId === modelId);
            return (
              <span
                key={modelId}
                className="inline-flex items-center gap-1 px-2 py-1 bg-background rounded-md text-sm"
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: model?.color || "#6B7280" }}
                />
                {model?.name || modelId}
                <button
                  onClick={() =>
                    onSelectionChange(selectedModels.filter((id) => id !== modelId))
                  }
                  className="ml-1 text-muted-foreground hover:text-foreground"
                  aria-label={`Remove ${model?.name || modelId} from selection`}
                  title="Remove"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Moderator selection (if enabled) */}
      {showModerator && onModeratorChange && (
        <div className="mt-4">
          <div className="text-sm text-muted-foreground mb-2">Moderator Model</div>
          <div className="flex flex-wrap gap-2">
            {quickSelectModels.slice(0, 4).map((model) => (
              <button
                key={model.openRouterId}
                onClick={() => onModeratorChange(model.openRouterId)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
                  moderatorModel === model.openRouterId
                    ? "border-amber-500 bg-amber-500/10 text-amber-500"
                    : "border-border hover:border-amber-500/50 hover:bg-accent"
                )}
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: model.color }}
                />
                <span className="text-sm font-medium">{model.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
