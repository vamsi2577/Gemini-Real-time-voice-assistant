import React, { useRef, useEffect } from 'react';
import type { Message } from '../types';
import RobotIcon from './icons/RobotIcon';
import UserIcon from './icons/UserIcon';

/**
 * Props for the ConversationView component.
 */
interface ConversationViewProps {
  /** An array of messages to display in the conversation history. */
  messages: Message[];
  /** The real-time, in-progress transcript from the speech recognition. */
  interimTranscript: string;
  /** A boolean indicating if the assistant is currently listening. */
  isListening: boolean;
}

/**
 * A small visual indicator to show that the model is "typing" or processing a response.
 */
const TypingIndicator: React.FC = () => (
    <div className="flex items-center space-x-1" aria-label="Assistant is typing">
        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
    </div>
);

/**
 * Displays the conversation history between the user and the model.
 * It also shows the interim transcript while the user is speaking.
 */
const ConversationView: React.FC<ConversationViewProps> = ({ 
    messages, 
    interimTranscript, 
    isListening,
}) => {
  // A ref to the end of the message list, used for auto-scrolling.
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Effect to automatically scroll to the latest message.
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimTranscript]);

  return (
    <div className="flex-1 bg-gray-800 p-3 sm:p-4 rounded-lg shadow-lg overflow-y-auto" role="log" aria-live="polite">
      <div className="space-y-4 pb-20 sm:pb-24">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'model' && (
              <div className="w-7 h-7 flex-shrink-0 bg-cyan-500 rounded-full flex items-center justify-center" aria-hidden="true">
                <RobotIcon className="w-4 h-4 text-gray-900" />
              </div>
            )}
            <div
              className={`max-w-xl p-3 rounded-lg shadow ${
                msg.role === 'user'
                  ? 'bg-gray-700 text-gray-100 rounded-br-none'
                  : 'bg-gray-900 text-gray-200 rounded-bl-none'
              }`}
            >
              <p className="whitespace-pre-wrap text-sm sm:text-base">{msg.text || <TypingIndicator />}</p>
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 flex-shrink-0 bg-gray-600 rounded-full flex items-center justify-center" aria-hidden="true">
                <UserIcon className="w-4 h-4 text-gray-200" />
              </div>
            )}
          </div>
        ))}
        {isListening && interimTranscript && (
          <div className="flex items-start gap-3 justify-end">
            <div className="max-w-xl p-3 rounded-lg shadow bg-gray-700 text-gray-400 italic rounded-br-none">
                <p className="text-sm sm:text-base">{interimTranscript}</p>
            </div>
             <div className="w-7 h-7 flex-shrink-0 bg-gray-600 rounded-full flex items-center justify-center" aria-hidden="true">
                <UserIcon className="w-4 h-4 text-gray-200" />
              </div>
          </div>
        )}
        {/* FIX: Removed conditional rendering based on isApiKeyMissing. */}
        {messages.length === 0 && !isListening && (
            <div className="text-center text-gray-500 pt-16">
                <p className="text-sm">The conversation will appear here.</p>
                <p className="text-sm">Click the microphone button to begin.</p>
            </div>
        )}
      </div>
      {/* This empty div is the target for auto-scrolling */}
      <div ref={endOfMessagesRef} />
    </div>
  );
};

export default ConversationView;