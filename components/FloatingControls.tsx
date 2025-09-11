/**
 * @fileoverview A component for floating user controls (mic, new session) over the conversation view.
 */
import React from 'react';
import MicIcon from './icons/MicIcon';
import StopIcon from './icons/StopIcon';

/**
 * Props for the FloatingControls component.
 */
interface FloatingControlsProps {
  /** A boolean indicating if the assistant is currently listening. */
  isListening: boolean;
  /** Callback function to toggle the listening state. */
  onToggleListening: () => void;
  /** An error message string, if any error has occurred. */
  error: string | null;
  /** A string representing the current status of the assistant. */
  status: string;
  // FIX: Removed isApiKeyMissing prop.
}

/**
 * Renders the main user controls as floating buttons in the bottom-right corner.
 * It includes the microphone button, new session button, and status/error messages.
 */
const FloatingControls: React.FC<FloatingControlsProps> = ({ 
    isListening, 
    onToggleListening, 
    error, 
    status,
}) => {
  // FIX: Simplified button class logic to remove API key check.
  const getButtonClass = () => {
    if (isListening) return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
    return 'bg-cyan-600 hover:bg-cyan-700 focus:ring-cyan-500';
  };

  return (
    <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 flex flex-col items-center gap-3">
        {/* Status and Error Message Display */}
        <div className="h-5 text-center" role="status" aria-live="polite">
            {error ? (
                <p className="text-red-400 text-xs sm:text-sm">{error}</p>
            ) : (
                isListening && <p className="text-gray-400 text-xs sm:text-sm">{status}</p>
            )}
        </div>
        
        {/* Control Buttons */}
        <button
            onClick={onToggleListening}
            className={`flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full text-white font-bold transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-gray-800 ${getButtonClass()} shadow-lg`}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
        >
            {isListening ? (
                <StopIcon className="w-6 h-6 sm:w-7 sm:h-7" />
            ) : (
                <MicIcon className="w-6 h-6 sm:w-7 sm:h-7" />
            )}
        </button>
    </div>
  );
};

export default FloatingControls;