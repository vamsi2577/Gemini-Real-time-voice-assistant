/**
 * @fileoverview A simple logger utility for consistent, leveled logging.
 * This helps in debugging and monitoring the application's behavior and performance.
 */

/**
 * Defines the available log levels.
 */
export enum LogLevel {
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
    PERF = 'PERF',
}

/**
 * A lightweight logging object.
 */
const logger = {
    /**
     * The core logging function.
     * @param {LogLevel} level - The level of the log (e.g., INFO, ERROR).
     * @param {string} message - The message to log.
     * @param {unknown} [data] - Optional additional data to log.
     */
    log: (level: LogLevel, message: string, data?: unknown) => {
        const timestamp = new Date().toISOString();
        // In a production environment, this could be expanded to send logs to a service.
        console.log(`[${timestamp}] [${level}] ${message}`, data || '');
    },

    /**
     * Logs an informational message.
     * @param {string} message - The info message.
     * @param {unknown} [data] - Optional additional data.
     */
    info: (message: string, data?: unknown) => {
        logger.log(LogLevel.INFO, message, data);
    },

    /**
     * Logs a warning message.
     * @param {string} message - The warning message.
     * @param {unknown} [data] - Optional additional data.
     */
    warn: (message: string, data?: unknown) => {
        logger.log(LogLevel.WARN, message, data);
    },

    /**
     * Logs an error message.
     * @param {string} message - The error message.
     * @param {unknown} [data] - Optional error object or additional data.
     */
    error: (message: string, data?: unknown) => {
        logger.log(LogLevel.ERROR, message, data);
    },

    /**
     * Logs a performance metric.
     * @param {string} label - A descriptive label for the performance measurement.
     * @param {number} startTime - The start time from `performance.now()`.
     */
    perf: (label: string, startTime: number) => {
        const duration = performance.now() - startTime;
        logger.log(LogLevel.PERF, `${label} took ${duration.toFixed(2)}ms`);
    }
};

export default logger;
