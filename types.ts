/**
 * @fileoverview Defines the core TypeScript types used throughout the application.
 */

/**
 * Represents a single message in the conversation.
 */
export interface Message {
  /** A unique identifier for the message, typically a timestamp. */
  id: string;
  /** The role of the entity that created the message. */
  role: 'user' | 'model';
  /** The text content of the message. */
  text: string;
}
