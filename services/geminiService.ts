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
 * Creates and inits a new chat session with the Gemini model.
 * @param {string} systemInstruction - The system prompt to guide the model's behavior.
 * @param {Content[]} [history] - Optional. A pre-existing conversation history to provide context.
 * @returns {Chat} A new Chat instance.
 * @throws {Error} If the API key is missing.
 */
export function createChatSession(systemInstruction: string, history?: Content[]): Chat {
    // MODIFIED: Fetch the API key from the window object, injected by the container.
    const apiKey = window.__GEMINI_API_KEY__;

    if (!apiKey) {
        const errorMessage = "API key is missing. It must be provided via the API_KEY environment variable to the container.";
        logger.error(errorMessage);
        throw new Error(errorMessage);
    }
    
    logger.info('Creating new Gemini chat session.');
    
    const ai = new GoogleGenAI({ apiKey: apiKey });

    return ai.chats.create({
        model: 'gemini-2.5-flash',
        history: history,
        // Configuration for the chat model
        config: {
            systemInstruction: systemInstruction,
            // Disable thinking for lower latency, suitable for real-time voice chat.
            thinkingConfig: { thinkingBudget: 0 } 
        },
    });
}
