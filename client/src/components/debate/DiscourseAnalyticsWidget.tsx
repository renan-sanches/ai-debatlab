import React from 'react';

interface TensionPoint {
    claim: string;
    tensionLevel: number;
    description: string;
}

interface DiscourseAnalytics {
    consensusScore: number;
    tensionPoints: TensionPoint[];
}

interface DiscourseAnalyticsWidgetProps {
    analytics: DiscourseAnalytics | null;
    isLoading?: boolean;
}

export function DiscourseAnalyticsWidget({ analytics, isLoading }: DiscourseAnalyticsWidgetProps) {
    if (isLoading) {
        return (
            <div className="animate-pulse space-y-4 p-4 border border-slate-200 dark:border-border-dark rounded-xl bg-slate-50 dark:bg-surface-dark">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
            </div>
        );
    }

    if (!analytics) return null;

    // Sophisticated color palette: rose -> indigo -> teal
    const getScoreColor = (score: number) => {
        if (score < 40) return 'text-rose-500';
        if (score < 70) return 'text-indigo-400';
        return 'text-teal-400';
    };

    const getProgressBarColor = (score: number) => {
        if (score < 40) return 'bg-gradient-to-r from-rose-500 to-pink-500';
        if (score < 70) return 'bg-gradient-to-r from-blue-500 to-indigo-500';
        return 'bg-gradient-to-r from-teal-500 to-cyan-500';
    };

    return (
        <div className="space-y-6">
            <div className="border border-slate-200 dark:border-border-dark rounded-xl bg-slate-50 dark:bg-surface-dark p-4 overflow-hidden relative">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">Consensus Meter</h3>
                    <span className={`text-xl font-black ${getScoreColor(analytics.consensusScore)}`}>
                        {analytics.consensusScore}%
                    </span>
                </div>

                {/* Progress Bar */}
                <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                    <div
                        className={`h-full ${getProgressBarColor(analytics.consensusScore)} transition-all duration-1000 ease-out`}
                        style={{ width: `${analytics.consensusScore}%` }}
                    ></div>
                </div>

                <p className={`text-[10px] font-medium text-right ${analytics.consensusScore < 30 ? "text-rose-400" :
                        analytics.consensusScore < 70 ? "text-indigo-400" :
                            "text-teal-400"
                    }`}>
                    {analytics.consensusScore < 30 ? "High Divergence" :
                        analytics.consensusScore < 70 ? "Moderate Agreement" :
                            "Strong Consensus"}
                </p>
            </div>

            <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3 px-1">Tension Indicators</h3>
                <div className="space-y-3">
                    {analytics.tensionPoints.map((point, idx) => (
                        <div key={idx} className="group relative bg-white dark:bg-[#151921] border border-slate-200 dark:border-border-dark rounded-xl p-3 hover:border-purple-400/50 dark:hover:border-purple-500/30 transition-colors">
                            <div className="flex justify-between items-start mb-2 gap-2">
                                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                                    {point.claim}
                                </h4>
                                <span className="shrink-0 text-[10px] font-mono font-bold bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded">
                                    {point.tensionLevel}% Tension
                                </span>
                            </div>

                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                                {point.description}
                            </p>

                            {/* Heat Bar */}
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                                    style={{ width: `${point.tensionLevel}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
