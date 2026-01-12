import { motion } from "framer-motion";
import { getModelById, AIModel } from "../../../../shared/models";
import { cn } from "@/lib/utils";

interface VisualDialecticMapProps {
    rounds: any[];
    currentRoundIndex: number;
    streamingModelId: string | null;
    className?: string;
    onNodeClick: (elementId: string) => void;
}

const MODEL_AVATARS: Record<string, string> = {
    "openai-gpt-4o": "https://lh3.googleusercontent.com/aida-public/AB6AXuBOLplKvByxhjgw-ZJuosAR4moNxr_ebdw8iz75WqDvb1WLTBQDgtzR5rU6by2ihYqQ-JM3K0igIW-qg2PGICMleA5upJHnwi81y0HWbc5rd4U6ibCfG4B0BsRAMITjdY-j9ZETivpcCwWGGzrOeO5z4W-JxJ21F4JIDiwm3-Gv9RUwWOEgltB-zndmeB4Gt4TJVU9NaHv5xds37L2ctxW1W3-pdcV7BhAAwz5eNHZjm8dYOZiIznjR6Y0U2YfJ_AJyZbyP7ANIAA8B",
    "openai-gpt-4o-mini": "https://lh3.googleusercontent.com/aida-public/AB6AXuBOLplKvByxhjgw-ZJuosAR4moNxr_ebdw8iz75WqDvb1WLTBQDgtzR5rU6by2ihYqQ-JM3K0igIW-qg2PGICMleA5upJHnwi81y0HWbc5rd4U6ibCfG4B0BsRAMITjdY-j9ZETivpcCwWGGzrOeO5z4W-JxJ21F4JIDiwm3-Gv9RUwWOEgltB-zndmeB4Gt4TJVU9NaHv5xds37L2ctxW1W3-pdcV7BhAAwz5eNHZjm8dYOZiIznjR6Y0U2YfJ_AJyZbyP7ANIAA8B",
    "anthropic-claude-3-5-sonnet": "https://lh3.googleusercontent.com/aida-public/AB6AXuBsUJG18pv_JyryLP8CN3kFy8q8A5rFB8qe8_I_WS5eTsNOTAnAkefEN2N5Z1AKhxFUGkMt22Mewrxj_vAMuWLaolyg_TCu0a5FhIsrtcKnWzdb0pCkX609ztnZnxPmiheizygBelezwUwGzlqXhWfR2_iqlSfT8-2PJZOMThcTZH2VEThvx0nJM4nE0i64QPwEC1NrZ8AkPb6TNCw6uN0mpyKhgg-rb_ACywvZf3r4IZQg0ikMgGgEMMysfGNVP0-XOuNfoHyoWr-o",
    "google-gemini-1-5-pro": "https://lh3.googleusercontent.com/aida-public/AB6AXuAUpqrdOCj1s-_X_d5Yz13RwUDd1QcYE0iRkzBirEl5DsCKdvWu_rYeMpjjF5hR4eU2gkhVuQC0PAjfExlfH2wGUEhaPHDFOCTbgLKrm9XtESlCZHumbNkihg_-fbjFhKDBDKqLWeYYIfPz7eJy88buAeiNym3tOtAn_27g2VoqkFjKIo5JLhDE7AAjLwSOS4Ps5Im7o-S3azVTG6ZcwOV4-r-71UaV_YY2UloWicenmcBfjrej_Lkjg4KFM7h33OZM218DTxTZ0pmR",
    "google-gemini-1-5-flash": "https://lh3.googleusercontent.com/aida-public/AB6AXuAUpqrdOCj1s-_X_d5Yz13RwUDd1QcYE0iRkzBirEl5DsCKdvWu_rYeMpjjF5hR4eU2gkhVuQC0PAjfExlfH2wGUEhaPHDFOCTbgLKrm9XtESlCZHumbNkihg_-fbjFhKDBDKqLWeYYIfPz7eJy88buAeiNym3tOtAn_27g2VoqkFjKIo5JLhDE7AAjLwSOS4Ps5Im7o-S3azVTG6ZcwOV4-r-71UaV_YY2UloWicenmcBfjrej_Lkjg4KFM7h33OZM218DTxTZ0pmR",
};

const getModelAvatar = (modelId: string) => {
    return MODEL_AVATARS[modelId] || `https://api.dicebear.com/7.x/bottts/svg?seed=${modelId}`;
};

export function VisualDialecticMap({
    rounds,
    currentRoundIndex,
    streamingModelId,
    className,
    onNodeClick,
}: VisualDialecticMapProps) {
    if (!rounds || rounds.length === 0) return null;

    return (
        <div className={cn("relative pl-4 py-4 select-none", className)}>
            {/* Vertical Spine */}
            <div className="absolute left-[27px] top-6 bottom-6 w-0.5 bg-slate-200 dark:bg-slate-800" />

            <div className="space-y-8 relative z-10">
                {rounds.map((round, rIndex) => (
                    <motion.div
                        key={round.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: rIndex * 0.1 }}
                        className="space-y-4"
                    >
                        {/* Round Node */}
                        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => onNodeClick(`round-${round.id}`)}>
                            <div className={cn(
                                "w-7 h-7 rounded-lg flex items-center justify-center border-2 transition-all shadow-sm z-20",
                                rIndex === currentRoundIndex
                                    ? "bg-blue-600 border-blue-600 text-white"
                                    : "bg-white dark:bg-background border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 group-hover:border-blue-500/50"
                            )}>
                                <span className="text-[10px] font-bold">{round.roundNumber}</span>
                            </div>
                            <div className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                Round {round.roundNumber}
                            </div>
                        </div>

                        {/* Responses Branch */}
                        <div className="pl-3.5 space-y-3 border-l-2 border-transparent">
                            {round.responses?.map((response: any) => (
                                <DialecticNode
                                    key={response.id}
                                    modelId={response.modelId}
                                    isStreaming={streamingModelId === response.modelId}
                                    isActive={true}
                                    isDevilsAdvocate={response.isDevilsAdvocate}
                                    onClick={() => onNodeClick(`response-${response.id}`)}
                                />
                            ))}

                            {/* Streaming Node Placeholder if active in this round */}
                            {rIndex === currentRoundIndex && streamingModelId && !round.responses?.find((r: any) => r.modelId === streamingModelId) && (
                                <DialecticNode
                                    modelId={streamingModelId}
                                    isStreaming={true}
                                    isActive={true}
                                    onClick={() => { }} // Placeholder doesn't scroll yet
                                />
                            )}
                        </div>

                        {/* Moderator Node */}
                        {round.moderatorSynthesis && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="pl-[14px] pt-2"
                            >
                                <div
                                    className="relative group cursor-pointer"
                                    onClick={() => onNodeClick(`moderator-${round.id}`)}
                                >
                                    <div className="absolute -left-[23px] top-1/2 -translate-y-1/2 w-4 h-0.5 bg-indigo-500/30"></div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rotate-45 bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform z-20">
                                            <span className="material-symbols-rounded text-white text-[14px] -rotate-45">analytics</span>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400">Synthesis</div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Connector to next round if exists */}
                        {rIndex < rounds.length - 1 && (
                            <div className="h-4"></div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

function DialecticNode({ modelId, isStreaming, isActive, isDevilsAdvocate, onClick }: {
    modelId: string,
    isStreaming?: boolean,
    isActive?: boolean,
    isDevilsAdvocate?: boolean,
    onClick: () => void
}) {
    const model = getModelById(modelId);
    const avatar = getModelAvatar(modelId);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative group cursor-pointer"
            onClick={onClick}
        >
            {/* Horizontal Connector */}
            <div className={cn(
                "absolute -left-[15px] top-1/2 -translate-y-1/2 h-0.5 transition-all",
                isStreaming ? "w-6 bg-blue-500 animate-pulse" : "w-4 bg-slate-200 dark:bg-slate-700 group-hover:w-6 group-hover:bg-blue-400/50"
            )} />

            <div className={cn(
                "flex items-center gap-2 p-1.5 rounded-lg border transition-all pl-2 relative overflow-hidden",
                isStreaming
                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                    : "bg-white dark:bg-card border-slate-100 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 shadow-sm"
            )}>
                {/* Active Indicator Glow */}
                {isStreaming && (
                    <div className="absolute inset-0 bg-blue-500/5 animate-pulse"></div>
                )}

                <img
                    src={avatar}
                    alt={model?.name}
                    className={cn(
                        "w-5 h-5 rounded object-cover z-10",
                        !isActive && "grayscale opacity-50"
                    )}
                />

                <span className={cn(
                    "text-[10px] font-bold truncate max-w-[120px] z-10 transition-colors",
                    isStreaming ? "text-blue-700 dark:text-blue-300" : "text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200"
                )}>
                    {model?.name || modelId}
                </span>

                {isDevilsAdvocate && (
                    <span className="text-[10px] z-10">🎭</span>
                )}
            </div>
        </motion.div>
    );
}
