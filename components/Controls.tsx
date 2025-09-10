import React from 'react';
import MicIcon from './icons/MicIcon';
import StopIcon from './icons/StopIcon';
import NewSessionIcon from './icons/NewSessionIcon';

interface ControlsProps {
  isListening: boolean;
  onToggleListening: () => void;
  onNewSession: () => void;
  canStartNewSession: boolean;
  error: string | null;
  status: string;
}

const Controls: React.FC<ControlsProps> = ({ isListening, onToggleListening, onNewSession, canStartNewSession, error, status }) => {
  const buttonClass = isListening
    ? 'bg-red-600 hover:bg-red-700'
    : 'bg-cyan-600 hover:bg-cyan-700';

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg mt-4 flex flex-col items-center justify-center min-h-[120px]">
        <div className="flex items-center gap-4">
            <button
                onClick={onNewSession}
                className="flex items-center justify-center w-14 h-14 rounded-full bg-gray-600 hover:bg-gray-500 text-white font-bold transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-gray-400 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Start a new session"
                disabled={!canStartNewSession}
                title="New Session"
            >
                <NewSessionIcon className="w-6 h-6" />
            </button>
            <button
                onClick={onToggleListening}
                className={`flex items-center justify-center w-20 h-20 rounded-full text-white font-bold transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-gray-900 ${buttonClass} ${isListening ? 'focus:ring-red-500' : 'focus:ring-cyan-500'} shadow-lg`}
                aria-label={isListening ? 'Stop listening' : 'Start listening'}
            >
                {isListening ? (
                    <StopIcon className="w-8 h-8" />
                ) : (
                    <MicIcon className="w-8 h-8" />
                )}
            </button>
             {/* A placeholder for symmetry, or for a future third button */}
            <div className="w-14 h-14"></div>
        </div>
        <div className="h-6 mt-3 text-center">
            {error ? (
                <p className="text-red-400 text-sm">{error}</p>
            ) : (
                <p className="text-gray-400 text-sm">{status}</p>
            )}
        </div>
    </div>
  );
};

export default Controls;
