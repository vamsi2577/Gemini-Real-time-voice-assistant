import React, { useRef, useEffect } from 'react';
import type { Message } from '../types';
import RobotIcon from './icons/RobotIcon';
import UserIcon from './icons/UserIcon';

interface ConversationViewProps {
  messages: Message[];
  interimTranscript: string;
  isListening: boolean;
}

const TypingIndicator: React.FC = () => (
    <div className="flex items-center space-x-1">
        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
    </div>
);

const ConversationView: React.FC<ConversationViewProps> = ({ messages, interimTranscript, isListening }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimTranscript]);

  return (
    <div className="flex-1 bg-gray-800 p-6 rounded-lg shadow-lg overflow-y-auto">
      <div className="space-y-6">
        {messages.map((msg, index) => (
          <div key={msg.id} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'model' && (
              <div className="w-8 h-8 flex-shrink-0 bg-cyan-500 rounded-full flex items-center justify-center">
                <RobotIcon className="w-5 h-5 text-gray-900" />
              </div>
            )}
            <div
              className={`max-w-xl p-4 rounded-lg shadow ${
                msg.role === 'user'
                  ? 'bg-gray-700 text-gray-100 rounded-br-none'
                  : 'bg-gray-900 text-gray-200 rounded-bl-none'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text || <TypingIndicator />}</p>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 flex-shrink-0 bg-gray-600 rounded-full flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-gray-200" />
              </div>
            )}
          </div>
        ))}
        {isListening && interimTranscript && (
          <div className="flex items-start gap-4 justify-end">
            <div className="max-w-xl p-4 rounded-lg shadow bg-gray-700 text-gray-400 italic rounded-br-none">
                <p>{interimTranscript}</p>
            </div>
             <div className="w-8 h-8 flex-shrink-0 bg-gray-600 rounded-full flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-gray-200" />
              </div>
          </div>
        )}
        {messages.length === 0 && !isListening && (
            <div className="text-center text-gray-500 pt-16">
                <p>The conversation will appear here.</p>
                <p>Click the microphone button to begin.</p>
            </div>
        )}
      </div>
      <div ref={endOfMessagesRef} />
    </div>
  );
};

export default ConversationView;
