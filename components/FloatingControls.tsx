/**
 * @fileoverview A component for handling user input, supporting both voice and text.
 * It dynamically renders as either a minimalist floating microphone button or a
 * comprehensive input bar with a growing textarea and send/mic buttons.
 */
import React, { useRef } from 'react';
import MicIcon from './icons/MicIcon';
import StopIcon from './icons/StopIcon';

// SendIcon is defined locally as new file creation is not supported by the platform.
const SendIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);


/**
 * Props for the FloatingControls component, which serves as the main user input bar.
 */
interface FloatingControlsProps {
  isListening: boolean;
  onToggleListening: () => void;
  error: string | null;
  status: string;
  isTextInputEnabled: boolean;
  textInputValue: string;
  setTextInputValue: (value: string) => void;
  onSendMessage: (message: string) => void;
}

/**
 * Renders the primary user input controls. It can switch between a voice-only
 * floating button and a full text input bar with voice and send buttons.
 */
const FloatingControls: React.FC<FloatingControlsProps> = ({
  isListening,
  onToggleListening,
  error,
  status,
  isTextInputEnabled,
  textInputValue,
  setTextInputValue,
  onSendMessage,
}) => {
  // A ref to the textarea element for direct DOM manipulation (e.g., resetting height).
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * Handles sending the message, clearing the input, and resetting the textarea height.
   */
  const handleSend = () => {
    // Ensure there's a non-empty message to send.
    if (textInputValue.trim()) {
      onSendMessage(textInputValue);
      // After sending, reset the textarea's height to its default single-row state.
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };


  /**
   * Handles the key down event on the textarea to submit on Enter key (without Shift).
   * @param {React.KeyboardEvent<HTMLTextAreaElement>} e - The keyboard event.
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent new line on Enter
      handleSend();
    }
  };

  /**
   * Dynamically adjusts the textarea's height based on its content.
   * This is called on every input event.
   * @param {React.FormEvent<HTMLTextAreaElement>} e - The input event.
   */
  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    // Reset height to 'auto' to get the correct scrollHeight for the new content.
    target.style.height = 'auto';
    // Set the height to the scrollHeight to fit the content.
    // The CSS 'max-height' property will prevent it from growing indefinitely.
    target.style.height = `${target.scrollHeight}px`;
  };


  if (!isTextInputEnabled) {
    // Renders the original floating microphone button for a voice-first experience.
    const getButtonClass = () => {
      if (isListening) return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
      return 'bg-cyan-600 hover:bg-cyan-700 focus:ring-cyan-500';
    };

    return (
      <div className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 flex flex-col items-center gap-3">
        <div className="h-5 text-center" role="status" aria-live="polite">
          {error ? (
            <p className="text-red-400 text-xs sm:text-sm">{error}</p>
          ) : (
            isListening && <p className="text-gray-400 text-xs sm:text-sm">{status}</p>
          )}
        </div>
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
  }

  // Renders a full text input bar when text input is enabled.
  const micButtonClass = isListening
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'bg-gray-600 hover:bg-gray-500 text-gray-200';
  
  // The Send button is disabled if the input is empty or contains only whitespace.
  const canSendMessage = textInputValue.trim().length > 0;

  return (
    <div className="bg-gray-800 p-2 sm:p-3 rounded-t-lg shadow-lg w-full">
      <div className="flex items-end gap-2">
        <button
          onClick={onToggleListening}
          className={`flex-shrink-0 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full font-bold transition-colors duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-gray-900 ${micButtonClass} ${isListening ? 'focus:ring-red-500' : 'focus:ring-gray-400'}`}
          aria-label={isListening ? 'Stop listening' : 'Start listening'}
        >
          {isListening ? <StopIcon className="w-5 h-5 sm:w-6 sm:h-6" /> : <MicIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
        </button>
        <textarea
          ref={textareaRef}
          rows={1}
          value={textInputValue}
          onChange={(e) => setTextInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Type a message or use the microphone..."
          className="flex-1 bg-gray-700 border border-gray-600 rounded-lg p-2 sm:p-3 text-gray-100 resize-none max-h-40 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
          aria-label="Message input"
        />
        <button
          onClick={handleSend}
          disabled={!canSendMessage}
          className="flex-shrink-0 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-600"
          aria-label="Send message"
        >
          <SendIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>
       <div className="h-5 mt-1 text-center" role="status" aria-live="polite">
            {error ? (
                <p className="text-red-400 text-xs sm:text-sm">{error}</p>
            ) : (
                <p className="text-gray-400 text-xs sm:text-sm">{status}</p>
            )}
        </div>
    </div>
  );
};

export default FloatingControls;