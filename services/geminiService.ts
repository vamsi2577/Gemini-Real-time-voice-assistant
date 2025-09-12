/**
 * @fileoverview Service for interacting with the Google Gemini API.
 */

import { GoogleGenAI, Chat, type Content } from "@google/genai";
import logger from '../utils/logger';

// --- Runtime API Key Injection ---
// This allows the Docker container to inject the API key at runtime.
declare global {
  interface Window {
    __GEMINI_API_KEY__?: string;
  }
}

/**
 * Creates and initializes a new chat session with the Gemini model.
 * This function configures the model with a system instruction and optional
 * conversation history for contextual understanding.
 *
 * @param {string} systemInstruction - The system prompt to guide the model's behavior (e.g., its persona, role, or response format).
 * @param {Content[]} [history] - Optional. A pre-existing conversation history to provide context from the start of the session. This is used for personalization data and file context.
 * @returns {Chat} A new `Chat` instance, ready to send and receive messages.
 * @throws {Error} If the API key is not found in the `window` object.
 */
export function createChatSession(systemInstruction: string, history?: Content[]): Chat {
    // Fetch the API key from the global window object. This is a security measure
    // to allow the key to be injected at runtime (e.g., by a Docker container)
    // rather than being hardcoded in the source.
    const apiKey = window.__GEMINI_API_KEY__;

    if (!apiKey) {
        const errorMessage = "API key is missing. It must be provided via the API_KEY environment variable to the container.";
        logger.error(errorMessage);
        throw new Error(errorMessage);
    }
    
    logger.info('Creating new Gemini chat session.');
    
    const ai = new GoogleGenAI({ apiKey: apiKey });

    // Configuration for the chat model.
    return ai.chats.create({
        model: 'gemini-2.5-flash',
        history: history,
        config: {
            systemInstruction: systemInstruction,
            // Optimization for real-time voice chat:
            // `thinkingBudget: 0` disables the model's "thinking" phase, which can add
            // latency before a response begins. This results in a faster "time to first
            // chunk," making the conversation feel more immediate and responsive.
            thinkingConfig: { thinkingBudget: 0 } 
        },
    });
}