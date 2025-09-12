/**
 * @fileoverview The main application component for the Gemini Real-time Voice Assistant.
 * It manages state, handles speech recognition and text input, orchestrates communication
 * with the Gemini API, and supports file attachments for contextual conversations.
 */

// FIX: Corrected React import from 'React, aistudio' to 'React'.
import React from 'react';
import type { Chat, Content, Part } from '@google/genai';
import { createChatSession } from './services/geminiService';
import type { Message, FileAttachment } from './types';
import SettingsPanel, { SettingsPanelProps } from './components/SettingsPanel';
import ConversationView from './components/ConversationView';
import FloatingControls from './components/FloatingControls';
import SettingsModal from './components/SettingsModal';
import SettingsIcon from './components/icons/SettingsIcon';
import NewSessionIcon from './components/icons/NewSessionIcon';
import ChevronDownIcon from './components/icons/ChevronDownIcon';
import ChevronUpIcon from './components/icons/ChevronUpIcon';
import logger from './utils/logger';

// --- Third-party Library Globals ---
// Declare global variables for libraries loaded via <script> tags in index.html.
// This informs TypeScript that these variables exist at runtime.
declare var pdfjsLib: any;
declare var mammoth: any;

// Configure the worker for pdf.js. This is required for it to run in the browser.
// We check if the library is loaded before trying to configure it.
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.5.136/pdf.worker.min.mjs`;
}


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
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;


/**
 * The root component of the application.
 */
const App: React.FC = () => {
  // --- State Management ---
  // FIX: Replaced all instances of 'aistudio' with 'React'.
  // FIX: Removed apiKey state to comply with guidelines. API key must be from process.env.API_KEY.
  const [systemPrompt, setSystemPrompt] = React.useState('You are a helpful and concise real-time AI assistant. Your responses should be fast and to the point. The user is speaking to you, so your responses should be natural in a conversation.');
  const [privateData, setPrivateData] = React.useState('');
  const [attachedFiles, setAttachedFiles] = React.useState<FileAttachment[]>([]);
  
  // State for conversation and UI
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isListening, setIsListening] = React.useState(false);
  const [interimTranscript, setInterimTranscript] = React.useState('');
  const [status, setStatus] = React.useState(''); // Status text is now minimal, used for active states.
  const [error, setError] = React.useState<string | null>(null);
  const [showSettings, setShowSettings] = React.useState(false);
  const [isHeaderOpen, setIsHeaderOpen] = React.useState(false);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = React.useState(false);
  const [isTextInputEnabled, setIsTextInputEnabled] = React.useState(true);
  const [textInputValue, setTextInputValue] = React.useState('');
  const [isCapturingTabAudio, setIsCapturingTabAudio] = React.useState(false);

  // State for hardware settings
  const [audioDevices, setAudioDevices] = React.useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = React.useState<string>('default');


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
  // This ref tracks if the user manually stopped recognition, vs. it stopping on its own (e.g., due to an error or timeout).
  // It's critical for the auto-restart logic in the `onend` event handler.
  const userStoppedRef = React.useRef<boolean>(true);
  // Holds the MediaStream object when capturing tab audio.
  const tabAudioStreamRef = React.useRef<MediaStream | null>(null);
  // A ref to a hidden <audio> element, used to keep the captured tab audio stream active.
  const audioElRef = React.useRef<HTMLAudioElement>(null);


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
   * Initializes a new Gemini chat session. This function compiles the system prompt,
   * personalization data, and text from attached files into an initial context (history)
   * for the model, then creates the chat instance.
   */
  const initializeChat = React.useCallback(() => {
      logger.info('Initializing new chat session with context.');
      try {
        const fullSystemInstruction = systemPrompt;

        let history: Content[] = [];

        // If there's private data or attachments, construct an initial history turn.
        // This "primes" the model with the context it needs before the user's first message.
        if (privateData.trim() || attachedFiles.length > 0) {
            const userParts: Part[] = [];

            let contextIntro = 'Please use the following information and documents as context for our conversation:\n\n';
            
            // Add private data text if it exists.
            if (privateData.trim()) {
                contextIntro += privateData;
            }
            
            // Define which MIME types contain text data that can be combined.
            const textMimeTypes = [
                'text/plain',
                'application/pdf',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ];

            // Consolidate all text from private data and text-based files into one part.
            let combinedTextContent = contextIntro;
            const textFileNames: string[] = [];
            attachedFiles.forEach(file => {
                if (textMimeTypes.includes(file.mimeType)) {
                    combinedTextContent += `\n\n--- Start of attached file: ${file.name} ---\n${file.data}\n--- End of attached file: ${file.name} ---`;
                    textFileNames.push(file.name);
                }
            });
            
            if (textFileNames.length > 0) {
              logger.info('Adding text from attached files to context:', textFileNames);
            }

            userParts.push({ text: combinedTextContent });

            // Add file attachments that are not text (i.e., images).
            const imageFileNames: string[] = [];
            attachedFiles.forEach(file => {
                if (file.mimeType.startsWith('image/')) {
                    userParts.push({
                        inlineData: {
                            mimeType: file.mimeType,
                            data: file.data,
                        }
                    });
                    imageFileNames.push(file.name);
                }
            });
            
            if (imageFileNames.length > 0) {
               logger.info('Adding image attachments to context:', imageFileNames);
            }

            history.push({
                role: 'user',
                parts: userParts,
            });

            // Add a priming model response to confirm receipt of the context.
            history.push({
                role: 'model',
                parts: [{ text: "Understood. I have received the information and will use it as context." }]
            });
        }
        
        logger.info('Chat history context constructed', { historyLength: history.length, systemInstruction: fullSystemInstruction });
        
        // FIX: createChatSession now accepts history.
        chatRef.current = createChatSession(fullSystemInstruction, history);
        
        // Note: This is a rough client-side estimation. The actual token count
        // is determined by the model's tokenizer on the server.
        const systemAndHistoryTokens = history.reduce((acc, curr) => {
            const turnTokens = curr.parts.reduce((turnAcc, part) => {
                if ('text' in part && part.text) {
                    return turnAcc + estimateTokens(part.text);
                }
                if ('inlineData' in part && part.inlineData.data) {
                     return turnAcc + estimateTokens(part.inlineData.data);
                }
                return turnAcc;
            }, 0);
            return acc + turnTokens;
        }, estimateTokens(fullSystemInstruction));


        setMetrics(prev => ({
            ...prev,
            sessionPromptTokens: systemAndHistoryTokens, // Base prompt tokens for the session
            sessionResponseTokens: 0,
            estimatedCost: 0, // Reset cost
        }));

      } catch (e) {
        logger.error("Failed to initialize chat session:", e);
        setError("Failed to initialize chat. Is the API_KEY environment variable set correctly?");
      }
  }, [systemPrompt, privateData, attachedFiles]);

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
    
    // Create a placeholder for the model's response. This allows the UI to render the
    // message bubble immediately and stream the text content into it as it arrives.
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
   * Handles sending a message from the text input bar.
   * @param {string} text - The message text from the input.
   */
  const handleSendMessage = (text: string) => {
    if (!text.trim()) {
      return;
    }
    logger.info("Sending text message from input bar:", { text });
    sendToGemini(text.trim());
    setTextInputValue('');
  };

  /**
   * Handles the file attachment process. It reads and parses supported file types
   * (images, txt, pdf, docx) and rejects unsupported ones, all on the client-side.
   * @param {React.ChangeEvent<HTMLInputElement>} event - The file input change event.
   */
  const handleFileAttach = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setError(null);
    // Use a promise-based approach to handle multiple file reads asynchronously.
    const fileReadPromises: Promise<FileAttachment>[] = [];

    // Supported MIME types for different categories
    const supportedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    const supportedTextTypes = ['text/plain'];
    const supportedPdfTypes = ['application/pdf'];
    const supportedDocxTypes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const unsupportedDocTypes = ['application/msword'];

    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        const errorMsg = `File ${file.name} is too large (max ${MAX_FILE_SIZE_MB}MB).`;
        logger.warn(errorMsg);
        setError(errorMsg);
        continue;
      }

      const fileType = file.type;
      let promise: Promise<FileAttachment> | null = null;
      logger.info(`Processing file: ${file.name}, type: ${file.type}`);

      if (supportedImageTypes.includes(fileType)) {
        promise = new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => {
            const result = e.target?.result as string;
            if (result) {
              // Extract the base64 part of the data URL.
              resolve({ name: file.name, mimeType: file.type, size: file.size, data: result.split(',')[1] });
            } else {
              reject(new Error(`Failed to read image file ${file.name}`));
            }
          };
          reader.onerror = err => reject(err);
          reader.readAsDataURL(file);
        });
      } else if (supportedTextTypes.includes(fileType)) {
        promise = new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => resolve({ name: file.name, mimeType: file.type, size: file.size, data: e.target?.result as string });
          reader.onerror = err => reject(err);
          reader.readAsText(file);
        });
      } else if (supportedPdfTypes.includes(fileType)) {
        promise = new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              logger.info(`Parsing PDF: ${file.name}`);
              const arrayBuffer = e.target?.result as ArrayBuffer;
              const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
              let fullText = '';
              for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                fullText += textContent.items.map((item: any) => item.str).join(' ');
                fullText += '\n'; // Add a newline between pages
              }
              logger.info(`Successfully parsed PDF: ${file.name}`);
              resolve({ name: file.name, mimeType: file.type, size: file.size, data: fullText.trim() });
            } catch (err) {
              logger.error(`Failed to parse PDF file '${file.name}':`, err);
              reject(new Error(`Could not read PDF file: ${file.name}`));
            }
          };
          reader.onerror = err => reject(err);
          reader.readAsArrayBuffer(file);
        });
      } else if (supportedDocxTypes.includes(fileType)) {
        promise = new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              logger.info(`Parsing DOCX: ${file.name}`);
              const arrayBuffer = e.target?.result as ArrayBuffer;
              const result = await mammoth.extractRawText({ arrayBuffer });
              logger.info(`Successfully parsed DOCX: ${file.name}`);
              resolve({ name: file.name, mimeType: file.type, size: file.size, data: result.value });
            } catch (err) {
              logger.error(`Failed to parse DOCX file '${file.name}':`, err);
              reject(new Error(`Could not read DOCX file: ${file.name}`));
            }
          };
          reader.onerror = err => reject(err);
          reader.readAsArrayBuffer(file);
        });
      } else if (unsupportedDocTypes.includes(fileType) || file.name.endsWith('.doc')) {
        const errorMsg = `Legacy .doc files are not supported. Please save '${file.name}' as .docx or .pdf.`;
        logger.warn(errorMsg);
        setError(errorMsg);
        continue;
      } else {
        const errorMsg = `File type "${fileType || 'unknown'}" for '${file.name}' is not supported.`;
        logger.warn(errorMsg);
        setError(errorMsg);
        continue;
      }

      if (promise) {
        fileReadPromises.push(promise);
      }
    }

    // Wait for all selected files to be processed before updating the state.
    Promise.all(fileReadPromises)
      .then(newFiles => {
        setAttachedFiles(prev => [...prev, ...newFiles]);
        logger.info("Files attached successfully", { count: newFiles.length });
      })
      .catch(err => {
        logger.error("Error processing attached files:", err);
        setError("There was an error processing one or more attached files.");
      });
    
    // Clear the file input so the user can select the same file again if they remove it.
    event.target.value = '';
  };


  /**
   * Removes a file from the attachment list.
   * @param {number} index - The index of the file to remove.
   */
  const handleFileRemove = (index: number) => {
    const removedFile = attachedFiles[index];
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    logger.info(`File removed: ${removedFile.name}`, { index });
  };


  /**
   * Resets the application state to start a new conversation.
   */
  const handleNewSession = React.useCallback(() => {
    logger.info("User initiated new session. Resetting state.");
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
    setTextInputValue('');
    // Re-initialize the chat with potentially updated settings.
    initializeChat();
  }, [isListening, initializeChat]);
  
  /**
   * Toggles the speech recognition on and off.
   */
  const handleToggleListening = React.useCallback(() => {
    if (isListening) {
      // --- Stop Listening ---
      logger.info("User manually stopped listening.");
      userStoppedRef.current = true;
      recognitionRef.current?.stop();
    } else {
      // --- Start Listening ---
      
      // If capturing tab audio, we must ensure the user has selected a virtual audio device.
      // Otherwise, we would just be listening to their default (physical) microphone, which is confusing.
      if (isCapturingTabAudio && selectedDeviceId === 'default') {
        logger.warn("Tab audio transcription attempted with default microphone. Guiding user to settings.");
        setError("Select a virtual audio device in Settings to transcribe from a tab.");
        setShowSettings(true); // Open the settings panel to guide the user.
        return; // Prevent the listener from starting with the wrong source.
      }
      
      logger.info("User started listening.");
      userStoppedRef.current = false;
      setError(null);
      
      // Initialize chat if this is the very first interaction or settings have changed.
      if (!chatRef.current) {
          logger.info("No active chat session found, initializing one before starting to listen.");
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
        recognition.interimResults = true; // Get results as the user speaks for real-time feedback.
        recognition.lang = 'en-US';

        // --- SpeechRecognition Event Handlers ---

        // Called when the recognition service has started listening.
        recognition.onstart = () => {
          logger.info("SpeechRecognition service has started.");
          setIsListening(true);
          setStatus("Listening...");
        };

        // Called when the recognition service has stopped.
        recognition.onend = () => {
          logger.info("SpeechRecognition service has ended.");
          setIsListening(false);
          setInterimTranscript('');
          setStatus('');
          // Auto-restart logic: If the service stops on its own (e.g., network error, timeout),
          // and the user hasn't manually stopped it, restart it to maintain a continuous listening experience.
          if (!userStoppedRef.current) {
            logger.warn("SpeechRecognition stopped unexpectedly, restarting.");
            setStatus("Restarting listener...");
            recognitionRef.current?.start();
          }
        };

        // Called when a speech recognition error occurs.
        recognition.onerror = (event) => {
          logger.error(`Speech recognition error: ${event.error}`);
          setError(`Speech recognition error: ${event.error}`);
          // Prevent infinite error loops by treating errors as a manual stop.
          userStoppedRef.current = true; 
          setIsListening(false);
          setStatus('');
        };

        // The core event handler, called when the recognizer has a new result.
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
  }, [isListening, initializeChat, sendToGemini, isCapturingTabAudio, selectedDeviceId]);

  /**
   * Requests microphone permissions and populates the list of available audio devices.
   * This is intended to be called when the settings panel is opened.
   */
  const handleLoadAudioDevices = React.useCallback(async () => {
    logger.info("Attempting to load audio devices.");
    if (audioDevices.length > 0) {
      logger.info("Audio devices already loaded, skipping.");
      return;
    }

    try {
      // Request microphone permission. This is necessary to get device labels, which would
      // otherwise be blank for security reasons.
      await navigator.mediaDevices.getUserMedia({ audio: true });
      // Enumerate all media devices.
      const devices = await navigator.mediaDevices.enumerateDevices();
      // Filter for only audio input devices.
      const audioInputDevices = devices.filter(device => device.kind === 'audioinput');
      setAudioDevices(audioInputDevices);
      logger.info("Audio devices loaded successfully.", { count: audioInputDevices.length });
    } catch (err) {
      logger.error("Could not get audio devices:", err);
      setError("Could not access microphone list. Please grant permission in your browser settings.");
    }
  }, [audioDevices]);

  /**
    * Stops the tab audio capture stream and cleans up resources.
    */
  const stopTabAudioCapture = React.useCallback(() => {
    if (tabAudioStreamRef.current) {
      logger.info("Stopping tab audio capture.");
      // Stop all tracks in the stream (both audio and video).
      tabAudioStreamRef.current.getTracks().forEach(track => track.stop());
      tabAudioStreamRef.current = null;
      // Detach the stream from the hidden audio element.
      if (audioElRef.current) {
        audioElRef.current.srcObject = null;
      }
      setIsCapturingTabAudio(false);
      setStatus(""); // Clear any related status messages
    }
  }, []);
  
  /**
    * Toggles the capture of audio from another browser tab using the Screen Capture API.
    */
  const handleToggleTabAudioCapture = React.useCallback(async () => {
    if (isCapturingTabAudio) {
      stopTabAudioCapture();
      return;
    }

    logger.info("Requesting to capture tab audio via getDisplayMedia.");
    setError(null);
    try {
      // Use getDisplayMedia to prompt the user to share a screen or tab.
      // Requesting video is often necessary to ensure the browser shows the tab selection UI.
      // The crucial part is `audio: true`.
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      // Check if the user actually shared audio. They might have shared a screen without audio.
      if (stream.getAudioTracks().length === 0) {
        const errorMsg = "Audio not shared. You must check 'Share tab audio' to capture sound.";
        logger.warn(errorMsg);
        setError(errorMsg);
        stream.getTracks().forEach(track => track.stop()); // Clean up the leftover video track.
        return;
      }

      logger.info("Tab audio stream captured successfully.");
      tabAudioStreamRef.current = stream;

      // When the user clicks the browser's native "Stop sharing" button, clean up our state.
      stream.getTracks().forEach(track => {
        track.onended = stopTabAudioCapture;
      });
      
      // A trick to keep the audio stream active: play it to a muted audio element.
      // Without this, some browsers might pause or drop the stream.
      if (audioElRef.current) {
        audioElRef.current.srcObject = stream;
      }

      setIsCapturingTabAudio(true);
      // Provide clear instructions instead of auto-starting, which can cause a "stuck" state.
      setStatus("Tab audio captured. Press the mic button to start transcribing.");

    } catch (err) {
        if ((err as Error).name === 'NotAllowedError') {
            logger.warn("User denied screen share permission for tab audio capture.");
        } else {
            logger.error("Error capturing tab audio:", err);
            setError("Failed to capture tab audio. See console for details.");
        }
    }
  }, [isCapturingTabAudio, stopTabAudioCapture]);
  
  
  const settingsPanelProps: SettingsPanelProps = {
      systemPrompt,
      setSystemPrompt,
      privateData,
      setPrivateData,
      isListening,
      isAutoScrollEnabled,
      setIsAutoScrollEnabled,
      isTextInputEnabled,
      setIsTextInputEnabled,
      attachedFiles,
      onFileAttach: handleFileAttach,
      onFileRemove: handleFileRemove,
      metrics,
      audioDevices,
      selectedDeviceId,
      setSelectedDeviceId,
      onLoadAudioDevices: handleLoadAudioDevices,
      isCapturingTabAudio,
      onToggleTabAudioCapture: handleToggleTabAudioCapture,
  };

  return (
    <div className="relative h-screen flex flex-col p-2 sm:p-4 font-sans bg-gray-900 text-gray-100">
        {/* Hidden audio element for playing back captured tab audio stream to keep it active */}
        <audio ref={audioElRef} muted playsInline autoPlay className="hidden" />

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
        <main className="relative flex-1 flex flex-col gap-0 max-w-7xl mx-auto w-full min-h-0">
            <ConversationView 
                messages={messages}
                interimTranscript={interimTranscript}
                isListening={isListening}
                isAutoScrollEnabled={isAutoScrollEnabled}
            />
            <FloatingControls 
                isListening={isListening}
                onToggleListening={handleToggleListening}
                error={error}
                status={status}
                isTextInputEnabled={isTextInputEnabled}
                textInputValue={textInputValue}
                setTextInputValue={setTextInputValue}
                onSendMessage={handleSendMessage}
            />
        </main>
        
        {showSettings && <SettingsModal {...settingsPanelProps} onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default App;
