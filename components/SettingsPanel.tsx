
import React from 'react';

interface SettingsPanelProps {
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
  privateData: string;
  setPrivateData: (data: string) => void;
  isListening: boolean;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  systemPrompt,
  setSystemPrompt,
  privateData,
  setPrivateData,
  isListening,
}) => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-cyan-400">Assistant Configuration</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="system-prompt" className="block text-sm font-medium text-gray-300 mb-1">
            System Prompt
          </label>
          <textarea
            id="system-prompt"
            rows={4}
            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-gray-100 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            disabled={isListening}
            placeholder="e.g., You are a helpful assistant."
          />
        </div>
        <div>
          <label htmlFor="private-data" className="block text-sm font-medium text-gray-300 mb-1">
            Personalization Data
          </label>
          <textarea
            id="private-data"
            rows={6}
            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-gray-100 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            value={privateData}
            onChange={(e) => setPrivateData(e.target.value)}
            disabled={isListening}
            placeholder="Add any private context here for the model to reference, e.g., 'My name is Alex. I am a software developer interested in AI.'"
          />
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
