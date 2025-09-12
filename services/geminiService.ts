/**
 * @fileoverview Service for interacting with the Google Gemini API.
 */

import { GoogleGenAI, Chat, type Content } from "@google/genai";
import logger from '../utils/logger';

/**
 * Creates and inits a new chat session with the Gemini model.
 * @param {string} systemInstruction - The system prompt to guide the model's behavior.
 * @param {Content[]} [history] - Optional. A pre-existing conversation history to provide context.
 * @returns {Chat} A new Chat instance.
 * @throws {Error} If the API key is missing from environment variables.
 */
// FIX: Removed apiKey parameter. The API key must be sourced from process.env.API_KEY.
export function createChatSession(systemInstruction: string, history?: Content[]): Chat {
    // FIX: Check for process.env.API_KEY instead of a parameter.
    if (!process.env.API_KEY) {
        const errorMessage = "API key is missing. Make sure API_KEY environment variable is set.";
        logger.error(errorMessage);
        throw new Error(errorMessage);
    }
    
    logger.info('Creating new Gemini chat session.');
    
    // FIX: Initialize GoogleGenAI with the API key from environment variables.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
