import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { Chat } from '@google/genai';
import { createChatSession } from './services/geminiService';
import type { Message } from './types';
import SettingsPanel from './components/SettingsPanel';
import ConversationView from './components/ConversationView';
import Controls from './components/Controls';

// FIX: Add minimal TypeScript definitions for the Web Speech API.
// This is necessary because the default TS DOM library might not include these experimental APIs,
// which causes a "Cannot find name 'SpeechRecognition'" error.
interface SpeechRecognitionAlternative {
  readonly transcript: string;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
}


// For browser compatibility
// FIX: Cast window to `any` to access non-standard SpeechRecognition properties and rename constant to avoid name collision with the type.
const SpeechRecognitionImpl = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const App: React.FC = () => {
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful and concise real-time AI assistant. Your responses should be fast and to the point. The user is speaking to you, so your responses should be natural in a conversation.');
  const [privateData, setPrivateData] = useState('');
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [status, setStatus] = useState('Click the mic to start.');
  const [error, setError] = useState<string | null>(null);

  const chatRef = useRef<Chat | null>(null);
  // FIX: With the constant renamed, `SpeechRecognition` correctly refers to the interface type.
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const userStoppedRef = useRef<boolean>(true);

  // Initialize the chat session when the component mounts or settings change.
  // This is now handled by handleNewSession and the initial toggle.
  const initializeChat = useCallback(() => {
      const fullSystemInstruction = `${systemPrompt}\n\n--- Private Data ---\n${privateData}`;
      chatRef.current = createChatSession(fullSystemInstruction);
  }, [systemPrompt, privateData]);

  const sendToGemini = useCallback(async (text: string) => {
    if (!chatRef.current) {
        setError("Chat session not initialized. Starting a new one.");
        initializeChat();
        if(!chatRef.current) { // Check again after initialization attempt
            setError("Failed to initialize chat session.");
            return;
        }
    }

    const userMessage: Message = { id: Date.now().toString(), role: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    
    const modelMessageId = (Date.now() + 1).toString();
    const modelMessagePlaceholder: Message = { id: modelMessageId, role: 'model', text: '' };
    setMessages(prev => [...prev, modelMessagePlaceholder]);

    try {
        const stream = await chatRef.current.sendMessageStream({ message: text });
        let fullResponse = '';
        for await (const chunk of stream) {
            fullResponse += chunk.text;
            setMessages(prev => prev.map(msg => 
                msg.id === modelMessageId ? { ...msg, text: fullResponse } : msg
            ));
        }
    } catch (e) {
        console.error(e);
        setError("Error communicating with the AI. Please try again.");
        setMessages(prev => prev.filter(msg => msg.id !== modelMessageId));
    }
  }, [initializeChat]);

  const handleNewSession = useCallback(() => {
    // Stop listening if it's currently active
    if (isListening) {
      userStoppedRef.current = true;
      recognitionRef.current?.stop();
    }
    // Reset state for a new session
    setMessages([]);
    setInterimTranscript('');
    setError(null);
    setStatus('New session started. Click the mic to speak.');
    initializeChat();
  }, [isListening, initializeChat]);
  
  const handleToggleListening = useCallback(() => {
    if (isListening) {
      // User is manually stopping the session
      userStoppedRef.current = true;
      recognitionRef.current?.stop();
    } else {
      // User is starting to listen
      userStoppedRef.current = false;
      setError(null);
      
      // Initialize chat only if it hasn't been initialized yet
      if (!chatRef.current) {
          initializeChat();
      }

      // Initialize speech recognition if it hasn't been already
      if (!recognitionRef.current) {
        if (!SpeechRecognitionImpl) {
          setError("Speech recognition is not supported in this browser.");
          return;
        }
        const recognition: SpeechRecognition = new SpeechRecognitionImpl();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
          setStatus("Listening... Speak now.");
        };

        recognition.onend = () => {
          setIsListening(false);
          setInterimTranscript('');
          if (userStoppedRef.current) {
            // It was a manual stop by the user
            setStatus("Click the mic to start.");
          } else {
            // It was a timeout or unexpected stop, so auto-restart
            setStatus("Restarting listener...");
            recognitionRef.current?.start();
          }
        };

        recognition.onerror = (event) => {
          setError(`Speech recognition error: ${event.error}`);
          // On error, behave as if the user stopped it to prevent infinite error loops
          userStoppedRef.current = true; 
          setIsListening(false);
        };

        recognition.onresult = (event) => {
          let finalTranscript = '';
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          setInterimTranscript(interim);
          if (finalTranscript.trim()) {
            sendToGemini(finalTranscript.trim());
          }
        };
        recognitionRef.current = recognition;
      }
      
      recognitionRef.current.start();
    }
  }, [isListening, initializeChat, sendToGemini]);

  return (
    <div className="h-screen flex flex-col p-4 md:p-8 font-sans bg-gray-900 text-gray-100">
        <header className="text-center mb-6">
            <h1 className="text-4xl font-extrabold text-white tracking-tight">
                Gemini <span className="text-cyan-400">Real-time</span> Voice Assistant
            </h1>
            <p className="text-gray-400 mt-2">Your multimodal conversational AI partner</p>
        </header>

        {/* LAYOUT FIX: Replaced `overflow-hidden` with `min-h-0`.
            This is a common fix for nested flex/grid containers. It prevents the `main`
            element from growing beyond its available space, which in turn allows the
            child `ConversationView` to correctly calculate its height and become scrollable. */}
        <main className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto w-full min-h-0">
            <div className="md:col-span-1 flex flex-col gap-6">
                <SettingsPanel 
                    systemPrompt={systemPrompt}
                    setSystemPrompt={setSystemPrompt}
                    privateData={privateData}
                    setPrivateData={setPrivateData}
                    isListening={isListening}
                />
                 <Controls
                    isListening={isListening}
                    onToggleListening={handleToggleListening}
                    onNewSession={handleNewSession}
                    canStartNewSession={messages.length > 0 || isListening}
                    error={error}
                    status={status}
                />
            </div>

            {/* LAYOUT FIX: Added `min-h-0` here as well to ensure the column itself
                doesn't overflow its grid parent, creating a stable container for the
                scrolling `ConversationView` inside. */}
            <div className="md:col-span-2 flex flex-col min-h-0">
                <ConversationView 
                    messages={messages}
                    interimTranscript={interimTranscript}
                    isListening={isListening}
                />
            </div>
        </main>
    </div>
  );
};

export default App;