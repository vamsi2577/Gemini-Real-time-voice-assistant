import React from 'react';
import logger from '../utils/logger';

/**
 * Props for the SettingsPanel component.
 */
export interface SettingsPanelProps {
  /** The current system prompt for the AI assistant. */
  systemPrompt: string;
  /** Callback function to update the system prompt. */
  setSystemPrompt: (prompt: string) => void;
  /** The current private data/context for the AI. */
  privateData: string;
  /** Callback function to update the private data. */
  setPrivateData: (data: string) => void;
  /** A boolean indicating if the assistant is currently listening to audio. */
  isListening: boolean;
  // FIX: Removed apiKey and setApiKey props. The API key is managed via environment variables.
  /** Callback function to toggle the visibility of the metrics panel. */
  onToggleMetrics: () => void;
}

/**
 * A component that provides UI for configuring the AI assistant's behavior.
 * Users can set a system prompt and provide personalization data.
 */
const SettingsPanel: React.FC<SettingsPanelProps> = ({
  systemPrompt,
  setSystemPrompt,
  privateData,
  setPrivateData,
  isListening,
  onToggleMetrics,
}) => {

  /**
   * Handles changes to the system prompt textarea and logs the event.
   * @param {React.ChangeEvent<HTMLTextAreaElement>} e - The change event.
   */
  const handleSystemPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    logger.info('System prompt changed.');
    setSystemPrompt(e.target.value);
  };

  /**
   * Handles changes to the private data textarea and logs the event.
   * @param {React.ChangeEvent<HTMLTextAreaElement>} e - The change event.
   */
  const handlePrivateDataChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    logger.info('Private data changed.');
    setPrivateData(e.target.value);
  };

  // FIX: Removed handleApiKeyChange function as API key input is removed.

  return (
    <div className="space-y-4">
      {/* FIX: Removed API key input section. */}
      <div>
        <label htmlFor="system-prompt" className="block text-sm font-medium text-gray-300 mb-1">
          System Prompt
        </label>
        <textarea
          id="system-prompt"
          rows={3}
          className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-gray-100 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          value={systemPrompt}
          onChange={handleSystemPromptChange}
          disabled={isListening}
          placeholder="e.g., You are a helpful assistant."
          aria-label="System Prompt"
        />
      </div>
      <div>
        <label htmlFor="private-data" className="block text-sm font-medium text-gray-300 mb-1">
          Personalization Data
        </label>
        <textarea
          id="private-data"
          rows={4}
          className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-gray-100 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          value={privateData}
          onChange={handlePrivateDataChange}
          disabled={isListening}
          placeholder="Add any private context here for the model to reference, e.g., 'My name is Alex. I am a software developer interested in AI.'"
          aria-label="Personalization Data"
        />
      </div>
      <div>
        <button
          onClick={onToggleMetrics}
          className="w-full mt-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-md transition duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500"
          aria-label="Show session metrics and API info"
        >
          Show Session Metrics
        </button>
      </div>
    </div>
  );
};

export default SettingsPanel;