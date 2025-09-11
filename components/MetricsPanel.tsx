/**
 * @fileoverview A component to display real-time metrics and configuration details.
 */
import React from 'react';
import type { Metrics } from '../App';
import CloseIcon from './icons/CloseIcon';

/**
 * Props for the MetricsPanel component.
 */
interface MetricsPanelProps {
  /** The metrics data object to display. */
  metrics: Metrics;
  /** Callback function to close the panel. */
  onClose: () => void;
}

/**
 * A small, reusable component for displaying a single metric.
 */
const MetricDisplay: React.FC<{ label: string; value: string | number | null; unit?: string }> = ({ label, value, unit }) => (
    <div className="flex justify-between items-baseline">
        <p className="text-gray-400">{label}:</p>
        <p className="font-mono text-cyan-300">
            {value ?? '...'}
            {value !== null && unit && <span className="text-gray-500 ml-1">{unit}</span>}
        </p>
    </div>
);

/**
 * A panel that displays performance metrics, token usage, and estimated cost.
 */
const MetricsPanel: React.FC<MetricsPanelProps> = ({ metrics, onClose }) => {
    
    // Formatters for displaying values consistently.
    const formatMs = (time: number | null) => time !== null ? time.toFixed(0) : null;
    const formatCost = (cost: number) => `$${cost.toFixed(6)}`;
    const totalSessionTokens = metrics.sessionPromptTokens + metrics.sessionResponseTokens;

    return (
        // Backdrop overlay
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="metrics-panel-title"
        >
            {/* Panel container */}
            <div
                className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-md transform transition-all"
                onClick={(e) => e.stopPropagation()} // Prevent clicks inside the panel from closing it
            >
                {/* Header */}
                <header className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h2 id="metrics-panel-title" className="text-lg font-bold text-cyan-400">
                        Session Metrics & Info
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        aria-label="Close metrics panel"
                    >
                        <CloseIcon className="w-6 h-6" />
                    </button>
                </header>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Live Metrics Section */}
                    <section>
                        <h3 className="text-md font-semibold text-gray-200 mb-3 border-b border-gray-700 pb-2">
                            Last Interaction
                        </h3>
                        <div className="space-y-2 text-sm">
                            <MetricDisplay label="Time to First Chunk" value={formatMs(metrics.timeToFirstChunk)} unit="ms" />
                            <MetricDisplay label="Total Response Time" value={formatMs(metrics.totalResponseTime)} unit="ms" />
                            <MetricDisplay label="Prompt Tokens (est.)" value={metrics.lastPromptTokens} />
                            <MetricDisplay label="Response Tokens (est.)" value={metrics.lastResponseTokens} />
                        </div>
                    </section>

                    {/* Session Totals Section */}
                    <section>
                        <h3 className="text-md font-semibold text-gray-200 mb-3 border-b border-gray-700 pb-2">
                            Session Totals
                        </h3>
                        <div className="space-y-2 text-sm">
                            <MetricDisplay label="Prompt Tokens (est.)" value={metrics.sessionPromptTokens} />
                            <MetricDisplay label="Response Tokens (est.)" value={metrics.sessionResponseTokens} />
                             <MetricDisplay label="Total Tokens (est.)" value={totalSessionTokens} />
                            <MetricDisplay label="Estimated Cost" value={formatCost(metrics.estimatedCost)} />
                        </div>
                    </section>
                    
                    {/* API Config Section */}
                     <section>
                        <h3 className="text-md font-semibold text-gray-200 mb-3 border-b border-gray-700 pb-2">
                           API Configuration
                        </h3>
                        <div className="space-y-2 text-sm">
                           <MetricDisplay label="Model Name" value="gemini-2.5-flash" />
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default MetricsPanel;
