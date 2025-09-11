/**
 * @fileoverview The main application component for the Gemini Real-time Voice Assistant.
 * It manages state, handles speech recognition, and orchestrates communication with the Gemini API.
 */

// FIX: Corrected React import from 'React, aistudio' to 'React'.
import React from 'react';
import type { Chat } from '@google/genai';
import { createChatSession } from './services/geminiService';
import type { Message } from './types';
import SettingsPanel, { SettingsPanelProps } from './components/SettingsPanel';
import ConversationView from './components/ConversationView';
import FloatingControls from './components/FloatingControls';
import MetricsPanel from './components/MetricsPanel';
import SettingsModal from './components/SettingsModal';
import SettingsIcon from './components/icons/SettingsIcon';
import NewSessionIcon from './components/icons/NewSessionIcon';
import ChevronDownIcon from './components/icons/ChevronDownIcon';
import ChevronUpIcon from './components/icons/ChevronUpIcon';
import logger from './utils/logger';

// --- Web Speech API Typings ---
// The following interfaces provide minimal TypeScript definitions for the Web Speech API.
// This is necessary because the default TS DOM library might not include these experimental APIs,
// which would otherwise cause a "Cannot find name 'SpeechRecognition'" error during compilation.

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

// --- Browser Compatibility ---
// Access the browser's implementation of SpeechRecognition, accounting for vendor prefixes.
// We cast `window` to `any` to access these non-standard properties without TypeScript errors.
const SpeechRecognitionImpl = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

/**
 * Represents the structure for tracking performance and usage metrics.
 */
export interface Metrics {
  timeToFirstChunk: number | null;
  totalResponseTime: number | null;
  lastPromptTokens: number;
  lastResponseTokens: number;
  sessionPromptTokens: number;
  sessionResponseTokens: number;
  estimatedCost: number;
}

// --- Pricing Constants (placeholders, adjust as needed) ---
const GEMINI_FLASH_INPUT_PRICE_PER_1M_TOKENS = 0.25; // Example price
const GEMINI_FLASH_OUTPUT_PRICE_PER_1M_TOKENS = 0.50; // Example price

/**
 * The root component of the application.
 */
const App: React.FC = () => {
  // --- State Management ---
  // FIX: Replaced all instances of 'aistudio' with 'React'.
  // FIX: Removed apiKey state to comply with guidelines. API key must be from process.env.API_KEY.
  const [systemPrompt, setSystemPrompt] = React.useState('You are a helpful and concise real-time AI assistant. Your responses should be fast and to the point. The user is speaking to you, so your responses should be natural in a conversation.');
  const [privateData, setPrivateData] = React.useState('');
  
  // State for conversation and UI
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isListening, setIsListening] = React.useState(false);
  const [interimTranscript, setInterimTranscript] = React.useState('');
  const [status, setStatus] = React.useState(''); // Status text is now minimal, used for active states.
  const [error, setError] = React.useState<string | null>(null);
  const [showMetrics, setShowMetrics] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [isHeaderOpen, setIsHeaderOpen] = React.useState(false);

  // State for performance and cost metrics
  const [metrics, setMetrics] = React.useState<Metrics>({
    timeToFirstChunk: null,
    totalResponseTime: null,
    lastPromptTokens: 0,
    lastResponseTokens: 0,
    sessionPromptTokens: 0,
    sessionResponseTokens: 0,
    estimatedCost: 0,
  });

  // --- Refs ---
  // Refs are used to hold instances or values that persist across re-renders without causing them.
  const chatRef = React.useRef<Chat | null>(null);
  const recognitionRef = React.useRef<SpeechRecognition | null>(null);
  // This ref tracks if the user manually stopped the recognition, vs. it stopping on its own.
  const userStoppedRef = React.useRef<boolean>(true);

  // FIX: Removed useEffect for saving API key to local storage.

  /**
   * Estimates the number of tokens in a string.
   * A common approximation is 4 characters per token.
   * @param {string} text The text to estimate.
   * @returns {number} The estimated token count.
   */
  const estimateTokens = (text: string): number => {
    return Math.ceil(text.length / 4);
  };

  /**
   * Initializes a new Gemini chat session with the current system prompt and private data.
   */
  const initializeChat = React.useCallback(() => {
      // FIX: API key is now handled by geminiService, no need for a check here.
      logger.info('Initializing chat session.');
      try {
        const fullSystemInstruction = `${systemPrompt}\n\n--- Private Data ---\n${privateData}`;
        // FIX: createChatSession no longer takes an API key argument.
        chatRef.current = createChatSession(fullSystemInstruction);
        
        // When a new chat is initialized, calculate the tokens for the system prompt.
        const systemTokens = estimateTokens(fullSystemInstruction);
        setMetrics(prev => ({
            ...prev,
            sessionPromptTokens: systemTokens, // Base prompt tokens for the session
            sessionResponseTokens: 0,
            estimatedCost: 0, // Reset cost
        }));

      } catch (e) {
        logger.error("Failed to initialize chat session:", e);
        // FIX: Updated error message to be more helpful.
        setError("Failed to initialize chat. Is the API_KEY environment variable set correctly?");
      }
  }, [systemPrompt, privateData]);

  /**
   * Sends a text message to the Gemini API and streams the response.
   * @param {string} text - The user's message to send.
   */
  const sendToGemini = React.useCallback(async (text: string) => {
    // Ensure a chat session is active.
    if (!chatRef.current) {
        logger.warn("Chat session not initialized. Starting a new one.");
        initializeChat();
        if(!chatRef.current) {
            logger.error("Failed to initialize chat session. Check API key and settings.");
            setError("Failed to initialize chat session. Check API key and settings.");
            return;
        }
    }

    logger.info("Sending message to Gemini:", { text });

    // --- Metrics Calculation (Prompt) ---
    const promptTokens = estimateTokens(text);
    setMetrics(prev => ({
        ...prev,
        lastPromptTokens: promptTokens,
        sessionPromptTokens: prev.sessionPromptTokens + promptTokens,
        // Reset turn-specific metrics
        timeToFirstChunk: null,
        totalResponseTime: null,
        lastResponseTokens: 0,
    }));

    // Add user's message to the conversation history.
    const userMessage: Message = { id: Date.now().toString(), role: 'user', text };
    setMessages(prev => [...prev, userMessage]);
    
    // Create a placeholder for the model's response to enable streaming UI.
    const modelMessageId = (Date.now() + 1).toString();
    const modelMessagePlaceholder: Message = { id: modelMessageId, role: 'model', text: '' };
    setMessages(prev => [...prev, modelMessagePlaceholder]);

    // Performance metrics start time.
    const startTime = performance.now();
    let firstChunkReceived = false;

    try {
        const stream = await chatRef.current.sendMessageStream({ message: text });
        let fullResponse = '';
        
        // Process the streamed response chunk by chunk.
        for await (const chunk of stream) {
            if (!firstChunkReceived) {
                const timeToFirst = performance.now() - startTime;
                logger.perf('Time to first chunk', startTime);
                setMetrics(prev => ({...prev, timeToFirstChunk: timeToFirst }));
                firstChunkReceived = true;
            }
            fullResponse += chunk.text;
            // Update the model's message in state with the latest content.
            setMessages(prev => prev.map(msg => 
                msg.id === modelMessageId ? { ...msg, text: fullResponse } : msg
            ));
        }
        
        const totalTime = performance.now() - startTime;
        logger.perf('Total response stream time', startTime);

        // --- Metrics Calculation (Response) ---
        const responseTokens = estimateTokens(fullResponse);
        setMetrics(prev => {
            const newSessionPromptTokens = prev.sessionPromptTokens;
            const newSessionResponseTokens = prev.sessionResponseTokens + responseTokens;
            
            const inputCost = (newSessionPromptTokens / 1_000_000) * GEMINI_FLASH_INPUT_PRICE_PER_1M_TOKENS;
            const outputCost = (newSessionResponseTokens / 1_000_000) * GEMINI_FLASH_OUTPUT_PRICE_PER_1M_TOKENS;
            const totalCost = inputCost + outputCost;

            return {
                ...prev,
                totalResponseTime: totalTime,
                lastResponseTokens: responseTokens,
                sessionResponseTokens: newSessionResponseTokens,
                estimatedCost: totalCost,
            }
        });

    } catch (e) {
        logger.error("Error communicating with Gemini API:", e);
        setError("Error communicating with the AI. Please try again.");
        // Remove the model's placeholder message on error.
        setMessages(prev => prev.filter(msg => msg.id !== modelMessageId));
    }
  }, [initializeChat]);

  /**
   * Resets the application state to start a new conversation.
   */
  const handleNewSession = React.useCallback(() => {
    logger.info("User initiated new session.");
    // Stop listening if it's currently active.
    if (isListening) {
      userStoppedRef.current = true;
      recognitionRef.current?.stop();
    }
    // Reset state for a new session.
    setMessages([]);
    setInterimTranscript('');
    setError(null);
    setStatus('');
    // Re-initialize the chat with potentially updated settings.
    initializeChat();
  }, [isListening, initializeChat]);
  
  /**
   * Toggles the speech recognition on and off.
   */
  const handleToggleListening = React.useCallback(() => {
    // FIX: Removed check for API key, as it's now an environment variable dependency.
    // The app will now attempt to initialize and throw an error if the key is missing.

    if (isListening) {
      // --- Stop Listening ---
      logger.info("User manually stopped listening.");
      userStoppedRef.current = true;
      recognitionRef.current?.stop();
    } else {
      // --- Start Listening ---
      logger.info("User started listening.");
      userStoppedRef.current = false;
      setError(null);
      
      // Initialize chat if this is the very first interaction or settings have changed.
      if (!chatRef.current) {
          initializeChat();
      }

      // Initialize speech recognition if it hasn't been already.
      if (!recognitionRef.current) {
        if (!SpeechRecognitionImpl) {
          const errorMsg = "Speech recognition is not supported in this browser.";
          logger.error(errorMsg);
          setError(errorMsg);
          return;
        }
        logger.info("Initializing SpeechRecognition for the first time.");
        const recognition: SpeechRecognition = new SpeechRecognitionImpl();
        recognition.continuous = true; // Keep listening even after a pause.
        recognition.interimResults = true; // Get results as the user speaks.
        recognition.lang = 'en-US';

        // --- SpeechRecognition Event Handlers ---
        recognition.onstart = () => {
          logger.info("SpeechRecognition service has started.");
          setIsListening(true);
          setStatus("Listening...");
        };

        recognition.onend = () => {
          logger.info("SpeechRecognition service has ended.");
          setIsListening(false);
          setInterimTranscript('');
          setStatus('');
          if (!userStoppedRef.current) {
            // If it wasn't a manual stop, auto-restart to maintain continuous listening.
            logger.warn("SpeechRecognition stopped unexpectedly, restarting.");
            setStatus("Restarting listener...");
            recognitionRef.current?.start();
          }
        };

        recognition.onerror = (event) => {
          logger.error(`Speech recognition error: ${event.error}`);
          setError(`Speech recognition error: ${event.error}`);
          // Prevent infinite error loops by treating errors as a manual stop.
          userStoppedRef.current = true; 
          setIsListening(false);
          setStatus('');
        };

        recognition.onresult = (event) => {
          let finalTranscript = '';
          let interim = '';
          // Iterate through all results from the current recognition event.
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          setInterimTranscript(interim);

          // If a final transcript is ready, send it to Gemini.
          if (finalTranscript.trim()) {
            logger.info("Final transcript received:", { transcript: finalTranscript.trim() });
            sendToGemini(finalTranscript.trim());
          }
        };
        recognitionRef.current = recognition;
      }
      
      // Start the recognition service.
      recognitionRef.current.start();
    }
  }, [isListening, initializeChat, sendToGemini]);
  
  const settingsPanelProps: SettingsPanelProps = {
      // FIX: Removed apiKey and setApiKey from props.
      systemPrompt,
      setSystemPrompt,
      privateData,
      setPrivateData,
      isListening,
      onToggleMetrics: () => {
          setShowSettings(false);
          setShowMetrics(true);
      },
  };

  // FIX: Removed isApiKeyMissing variable.

  // --- Render Method ---
  return (
    <div className="relative h-screen flex flex-col p-2 sm:p-4 font-sans bg-gray-900 text-gray-100">
        {/* Header Toggle Button for mobile view - positioned absolutely */}
        <div className="sm:hidden absolute top-2 right-2 z-20">
            <button 
                onClick={() => setIsHeaderOpen(!isHeaderOpen)}
                className="p-2 rounded-full bg-gray-800 bg-opacity-70 text-gray-300 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                aria-label={isHeaderOpen ? "Hide header" : "Show header"}
            >
                {isHeaderOpen ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
            </button>
        </div>

        {/* The entire header is now conditionally rendered on small screens */}
        <header className={`
            ${isHeaderOpen ? 'flex' : 'hidden'} sm:flex 
            justify-between items-center mb-2 sm:mb-4 w-full max-w-7xl mx-auto
        `}>
            <div className="flex items-center gap-2">
                 <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Gemini <span className="text-cyan-400">Voice</span> Assistant
                </h1>
            </div>
            
            <div className="flex items-center gap-2 mr-10 sm:mr-0">
                <button
                  onClick={handleNewSession}
                  className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Start new session"
                  title="New Session"
                  disabled={!(messages.length > 0 || isListening)}
                >
                  <NewSessionIcon className="w-5 h-5" />
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowSettings(true)}
                    className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    aria-label="Open settings"
                  >
                    <SettingsIcon className="w-5 h-5" />
                  </button>
                </div>
            </div>
        </header>

        {/* The main layout for the application panels. */}
        <main className="relative flex-1 flex flex-col gap-4 max-w-7xl mx-auto w-full min-h-0">
            <ConversationView 
                messages={messages}
                interimTranscript={interimTranscript}
                isListening={isListening}
            />
            <FloatingControls 
                isListening={isListening}
                onToggleListening={handleToggleListening}
                error={error}
                status={status}
            />
        </main>
        
        {showSettings && <SettingsModal {...settingsPanelProps} onClose={() => setShowSettings(false)} />}
        {showMetrics && <MetricsPanel metrics={metrics} onClose={() => setShowMetrics(false)} />}
    </div>
  );
};

export default App;