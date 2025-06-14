/**
 * Logging utility for Jenkins MCP Server
 * Provides debug logging based on environment settings
 */
export declare enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3
}
export declare class Logger {
    private static logLevel;
    private static debugMode;
    /**
     * Log error messages
     */
    static error(message: string, error?: any): void;
    /**
     * Log warning messages
     */
    static warn(message: string, details?: any): void;
    /**
     * Log info messages
     */
    static info(message: string, details?: any): void;
    /**
     * Log debug messages
     */
    static debug(message: string, details?: any): void;
    /**
     * Log API requests
     */
    static logRequest(method: string, url: string, params?: any): void;
    /**
     * Log API responses
     */
    static logResponse(method: string, url: string, status: number, duration: number): void;
    /**
     * Log tool execution
     */
    static logTool(toolName: string, args: any, duration?: number): void;
    /**
     * Log resource access
     */
    static logResource(uri: string, operation: 'read' | 'list', duration?: number): void;
}
//# sourceMappingURL=logging.d.ts.map