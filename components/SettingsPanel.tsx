

import React, { useState, useEffect, useRef } from 'react';
import logger from '../utils/logger';
import type { FileAttachment } from '../types';
import type { Metrics } from '../App';
import ChevronDownIcon from './icons/ChevronDownIcon';
import ChevronUpIcon from './icons/ChevronUpIcon';

/**
 * Props for the SettingsPanel component.
 */
export interface SettingsPanelProps {
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
  privateData: string;
  setPrivateData: (data: string) => void;
  isListening: boolean;
  isAutoScrollEnabled: boolean;
  setIsAutoScrollEnabled: (enabled: boolean) => void;
  isTextInputEnabled: boolean;
  setIsTextInputEnabled: (enabled: boolean) => void;
  attachedFiles: FileAttachment[];
  onFileAttach: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFileRemove: (index: number) => void;
  metrics: Metrics;
  audioDevices: MediaDeviceInfo[];
  selectedDeviceId: string;
  setSelectedDeviceId: (deviceId: string) => void;
  onLoadAudioDevices: () => void;
  isCapturingTabAudio: boolean;
  onToggleTabAudioCapture: () => void;
}

// --- Helper Icons (defined locally) ---
const EditIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
    </svg>
);
const PaperclipIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
    </svg>
);
const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
);
const DocumentTextIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
);
const SpeakerWaveIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
    </svg>
);


/**
 * A styled wrapper for each section in the settings panel.
 */
const SettingsSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-gray-700/50 border border-gray-600/70 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-200 px-4 py-2 border-b border-gray-600/70">
            {title}
        </h3>
        <div className="p-4 space-y-4">
            {children}
        </div>
    </div>
);

/**
 * A modern, interactive component for displaying and editing a text value.
 * It shows static text by default and transforms into a textarea when clicked.
 */
const EditableSection: React.FC<{
  value: string;
  onSave: (newValue: string) => void;
  isListening: boolean;
  placeholder: string;
  rows?: number;
}> = ({ value, onSave, isListening, placeholder, rows = 3 }) => {
  // `isEditing` controls whether the textarea or the static text is displayed.
  const [isEditing, setIsEditing] = useState(false);
  // `tempValue` holds the text being edited, separate from the main app state (`value`).
  // This allows the user to cancel their changes without affecting the application's state.
  const [tempValue, setTempValue] = useState(value);

  // This effect ensures that if the parent component's `value` prop changes
  // (e.g., loaded from somewhere else), the `tempValue` is updated accordingly,
  // but only when not in editing mode.
  useEffect(() => {
    if (!isEditing) {
      setTempValue(value);
    }
  }, [value, isEditing]);

  const handleSave = () => {
    onSave(tempValue);
    setIsEditing(false);
  };
  const handleCancel = () => {
    setIsEditing(false);
    // No need to reset tempValue here, the useEffect will handle it.
  };
  const handleEdit = () => {
    // Prevent editing while the microphone is active to avoid conflicts.
    if (!isListening) {
      setIsEditing(true);
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-3">
        <textarea
          rows={rows}
          className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-gray-100 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
        />
        <div className="flex justify-end items-center gap-2">
          <button
            onClick={handleCancel}
            className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-1 px-3 rounded-md text-sm transition duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-1 px-3 rounded-md text-sm transition duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative">
        <button
            onClick={handleEdit}
            disabled={isListening}
            className="absolute top-1 right-1 p-1.5 text-gray-400 bg-gray-700/0 group-hover:bg-gray-700/80 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-0"
            aria-label="Edit prompt"
        >
            <EditIcon className="w-4 h-4" />
        </button>
        <p className="text-gray-300 text-sm whitespace-pre-wrap break-words transition-all duration-300 ease-in-out">
            {value || <span className="text-gray-500 italic">{placeholder}</span>}
        </p>
    </div>
  );
};


/**
 * Formats file size into a human-readable string (KB, MB).
 */
const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};


/**
 * A reusable component for a single metric display.
 */
const MetricDisplay: React.FC<{ label: string; value: string | number | null; unit?: string }> = ({ label, value, unit }) => (
    <div className="flex justify-between items-baseline text-sm py-1">
        <p className="text-gray-400">{label}</p>
        <p className="font-mono text-cyan-300">
            {value ?? '...'}
            {value !== null && unit && <span className="text-gray-500 ml-1.5">{unit}</span>}
        </p>
    </div>
);


const formatMs = (time: number | null) => time !== null ? time.toFixed(0) : null;
const formatCost = (cost: number) => `$${cost.toFixed(6)}`;


/**
 * Main settings panel component with a modernized UI/UX.
 */
const SettingsPanel: React.FC<SettingsPanelProps> = ({
  systemPrompt, setSystemPrompt, privateData, setPrivateData, isListening,
  isAutoScrollEnabled, setIsAutoScrollEnabled, isTextInputEnabled, setIsTextInputEnabled,
  attachedFiles, onFileAttach, onFileRemove, metrics, audioDevices, selectedDeviceId,
  setSelectedDeviceId, onLoadAudioDevices, isCapturingTabAudio, onToggleTabAudioCapture
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMetricsVisible, setIsMetricsVisible] = useState(false);
  const totalSessionTokens = metrics.sessionPromptTokens + metrics.sessionResponseTokens;

  // When the settings panel is opened, load the list of audio devices.
  useEffect(() => {
    // This is called only when the panel mounts, preventing repeated device enumeration.
    onLoadAudioDevices();
  }, [onLoadAudioDevices]);

  return (
    <div className="space-y-6">
      <SettingsSection title="System Prompt">
        <EditableSection
          value={systemPrompt}
          onSave={setSystemPrompt}
          isListening={isListening}
          placeholder="e.g., You are a helpful assistant."
          rows={4}
        />
      </SettingsSection>
      
      <SettingsSection title="Personalization & Attachments">
        <EditableSection
          value={privateData}
          onSave={setPrivateData}
          isListening={isListening}
          placeholder="Add any private context here for the model to reference, e.g., 'My name is Alex.'"
          rows={5}
        />
        <div className="space-y-2">
            {attachedFiles.map((file, index) => (
                <div key={index} className="group flex items-center justify-between bg-gray-800/50 p-2 rounded-md text-sm hover:bg-gray-800/80 transition-colors">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <DocumentTextIcon className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                        <span className="text-gray-200 truncate" title={file.name}>{file.name}</span>
                        <span className="text-xs text-gray-500 flex-shrink-0">{formatBytes(file.size)}</span>
                    </div>
                    <button
                        onClick={() => onFileRemove(index)}
                        disabled={isListening}
                        className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity disabled:opacity-0"
                        aria-label={`Remove ${file.name}`}
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
        <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isListening}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-600 hover:border-cyan-500 hover:text-cyan-400 text-gray-400 font-semibold py-2 px-3 rounded-lg text-sm transition duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:border-gray-600 disabled:hover:text-gray-400"
        >
            <PaperclipIcon className="w-4 h-4" />
            <span>Attach Files</span>
        </button>
        <p className="text-xs text-gray-500 -mt-2 text-center">
            Supported: Images, TXT, PDF, DOCX. Legacy .doc files are not supported.
        </p>
        <input type="file" multiple ref={fileInputRef} onChange={onFileAttach} className="hidden" aria-hidden="true" accept="image/*,text/plain,.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />
      </SettingsSection>
      
      <SettingsSection title="Preferences">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
              <label htmlFor="auto-scroll-toggle" className="text-sm font-medium text-gray-300 cursor-pointer select-none">
              Enable Auto-Scroll
              </label>
              <button type="button" id="auto-scroll-toggle" role="switch" aria-checked={isAutoScrollEnabled} onClick={() => setIsAutoScrollEnabled(!isAutoScrollEnabled)} disabled={isListening} className={`${isAutoScrollEnabled ? 'bg-cyan-500' : 'bg-gray-600'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed`} aria-label="Enable auto-scroll">
              <span aria-hidden="true" className={`${isAutoScrollEnabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} />
              </button>
          </div>
          <div className="flex items-center justify-between">
              <label htmlFor="text-input-toggle" className="text-sm font-medium text-gray-300 cursor-pointer select-none">
              Enable Text Input
              </label>
              <button type="button" id="text-input-toggle" role="switch" aria-checked={isTextInputEnabled} onClick={() => setIsTextInputEnabled(!isTextInputEnabled)} disabled={isListening} className={`${isTextInputEnabled ? 'bg-cyan-500' : 'bg-gray-600'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed`} aria-label="Enable text input">
              <span aria-hidden="true" className={`${isTextInputEnabled ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} />
              </button>
          </div>
           <div>
                <label htmlFor="mic-select" className="block text-sm font-medium text-gray-300 mb-2">
                    Microphone
                </label>
                <select
                    id="mic-select"
                    value={selectedDeviceId}
                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                    disabled={isListening || audioDevices.length === 0}
                    className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-gray-100 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <option value="default">Default Microphone</option>
                    {audioDevices.map(device => (
                        <option key={device.deviceId} value={device.deviceId}>
                            {device.label || `Microphone ${audioDevices.indexOf(device) + 1}`}
                        </option>
                    ))}
                </select>
                 <p className="text-xs text-gray-500 mt-2">
                    Note: This sets a preference, but the browser may still use the system's default device.
                </p>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    External Audio Source
                </label>
                <button
                    onClick={onToggleTabAudioCapture}
                    disabled={isListening}
                    className={`w-full flex items-center justify-center gap-2 font-semibold py-2 px-3 rounded-lg text-sm transition duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed ${
                        isCapturingTabAudio
                        ? 'bg-red-600 hover:bg-red-500 text-white focus:ring-red-500'
                        : 'bg-gray-600 hover:bg-gray-500 text-white focus:ring-gray-400'
                    }`}
                >
                    <SpeakerWaveIcon className="w-4 h-4" />
                    <span>{isCapturingTabAudio ? 'Stop Capturing Audio' : 'Capture Tab Audio'}</span>
                </button>
                {isCapturingTabAudio && (
                     <div className="mt-3 p-3 bg-gray-900/70 border border-cyan-500/30 rounded-lg text-xs space-y-2">
                        <p className="font-bold text-cyan-400">Tab Audio Capture is Active</p>
                        <p className="text-gray-400">
                           The application is ready to capture audio from the shared tab. To start transcribing, press the microphone button.
                        </p>
                         <p className="text-gray-400">
                            <strong>For best results</strong>, select a system loopback device (e.g., "Stereo Mix" or a virtual audio device) from the <strong>Microphone</strong> dropdown above to capture audio directly.
                        </p>
                        <a href="https://github.com/existential-audio/BlackHole" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline">
                            Learn how to set up a virtual audio device.
                        </a>
                    </div>
                )}
            </div>
        </div>
      </SettingsSection>
      
       <div className="bg-gray-700/50 border border-gray-600/70 rounded-lg">
        <button
          onClick={() => setIsMetricsVisible(!isMetricsVisible)}
          className="w-full flex justify-between items-center text-left text-sm font-semibold text-gray-200 hover:bg-gray-700/60 p-4 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500 rounded-t-lg"
          aria-expanded={isMetricsVisible}
          aria-controls="metrics-details"
        >
          <span>Session Metrics & Info</span>
          {isMetricsVisible ? <ChevronUpIcon className="w-5 h-5 text-gray-400" /> : <ChevronDownIcon className="w-5 h-5 text-gray-400" />}
        </button>
        {isMetricsVisible && (
          <div id="metrics-details" className="p-4 border-t border-gray-600/70 space-y-4">
              <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Last Interaction</h4>
                  <div className="divide-y divide-gray-700">
                      <MetricDisplay label="Time to First Chunk" value={formatMs(metrics.timeToFirstChunk)} unit="ms" />
                      <MetricDisplay label="Total Response Time" value={formatMs(metrics.totalResponseTime)} unit="ms" />
                      <MetricDisplay label="Prompt Tokens" value={metrics.lastPromptTokens} />
                      <MetricDisplay label="Response Tokens" value={metrics.lastResponseTokens} />
                  </div>
              </div>
              <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Session Totals</h4>
                   <div className="divide-y divide-gray-700">
                      <MetricDisplay label="Prompt Tokens" value={metrics.sessionPromptTokens} />
                      <MetricDisplay label="Response Tokens" value={metrics.sessionResponseTokens} />
                      <MetricDisplay label="Total Tokens" value={totalSessionTokens} />
                      <MetricDisplay label="Estimated Cost" value={formatCost(metrics.estimatedCost)} />
                  </div>
              </div>
              <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">API Info</h4>
                  <div className="divide-y divide-gray-700">
                    <MetricDisplay label="Model Name" value="gemini-2.5-flash" />
                  </div>
              </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPanel;