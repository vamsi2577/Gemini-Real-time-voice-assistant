import React from 'react';
import MicIcon from './icons/MicIcon';
import StopIcon from './icons/StopIcon';
import NewSessionIcon from './icons/NewSessionIcon';

/**
 * Props for the Controls component.
 */
interface ControlsProps {
  /** A boolean indicating if the assistant is currently listening. */
  isListening: boolean;
  /** Callback function to toggle the listening state. */
  onToggleListening: () => void;
  /** Callback function to start a new conversation session. */
  onNewSession: () => void;
  /** A boolean indicating if the "New Session" button should be enabled. */
  canStartNewSession: boolean;
  /** An error message string, if any error has occurred. */
  error: string | null;
  /** A string representing the current status of the assistant. */
  status: string;
}

/**
 * Renders the main user controls for the application, including the
 * microphone button and the new session button. It also displays status and error messages.
 */
const Controls: React.FC<ControlsProps> = ({ isListening, onToggleListening, onNewSession, canStartNewSession, error, status }) => {
  // Dynamically determine button styles based on the listening state.
  const buttonClass = isListening
    ? 'bg-red-600 hover:bg-red-700'
    : 'bg-cyan-600 hover:bg-cyan-700';

  return (
    <div className="bg-gray-800 p-2 sm:p-4 rounded-lg shadow-lg flex flex-col items-center justify-center min-h-[100px]">
        <div className="flex items-center gap-4">
            <button
                onClick={onNewSession}
                className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-600 hover:bg-gray-500 text-white font-bold transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-400 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Start a new session"
                disabled={!canStartNewSession}
                title="New Session"
            >
                <NewSessionIcon className="w-5 h-5" />
            </button>
            <button
                onClick={onToggleListening}
                className={`flex items-center justify-center w-16 h-16 rounded-full text-white font-bold transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-gray-900 ${buttonClass} ${isListening ? 'focus:ring-red-500' : 'focus:ring-cyan-500'} shadow-lg`}
                aria-label={isListening ? 'Stop listening' : 'Start listening'}
            >
                {isListening ? (
                    <StopIcon className="w-7 h-7" />
                ) : (
                    <MicIcon className="w-7 h-7" />
                )}
            </button>
             {/* A placeholder for symmetry, or for a future third button */}
            <div className="w-12 h-12" aria-hidden="true"></div>
        </div>
        <div className="h-6 mt-2 text-center" role="status" aria-live="polite">
            {error ? (
                <p className="text-red-400 text-xs sm:text-sm">{error}</p>
            ) : (
                <p className="text-gray-400 text-xs sm:text-sm">{status}</p>
            )}
        </div>
    </div>
  );
};

export default Controls;