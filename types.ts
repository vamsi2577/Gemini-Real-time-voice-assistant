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

/**
 * Represents a file that has been attached by the user for context.
 */
export interface FileAttachment {
  /** The name of the file (e.g., 'document.pdf'). */
  name: string;
  /** The IANA MIME type of the file (e.g., 'application/pdf'). */
  mimeType: string;
  /** The size of the file in bytes. */
  size: number;
  /** The base64-encoded string representation of the file's content. */
  data: string;
}
