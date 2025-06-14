/**
 * Logging utility for Jenkins MCP Server
 * Provides debug logging based on environment settings
 */
var _a;
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
})(LogLevel || (LogLevel = {}));
export class Logger {
    /**
     * Log error messages
     */
    static error(message, error) {
        if (this.logLevel >= LogLevel.ERROR) {
            console.error(`[ERROR] ${new Date().toISOString()} - ${message}`);
            if (error && this.debugMode) {
                console.error('Stack trace:', error.stack || error);
            }
        }
    }
    /**
     * Log warning messages
     */
    static warn(message, details) {
        if (this.logLevel >= LogLevel.WARN) {
            console.error(`[WARN] ${new Date().toISOString()} - ${message}`);
            if (details && this.debugMode) {
                console.error('Details:', JSON.stringify(details, null, 2));
            }
        }
    }
    /**
     * Log info messages
     */
    static info(message, details) {
        if (this.logLevel >= LogLevel.INFO) {
            console.error(`[INFO] ${new Date().toISOString()} - ${message}`);
            if (details && this.debugMode) {
                console.error('Details:', JSON.stringify(details, null, 2));
            }
        }
    }
    /**
     * Log debug messages
     */
    static debug(message, details) {
        if (this.logLevel >= LogLevel.DEBUG || this.debugMode) {
            console.error(`[DEBUG] ${new Date().toISOString()} - ${message}`);
            if (details) {
                console.error('Details:', JSON.stringify(details, null, 2));
            }
        }
    }
    /**
     * Log API requests
     */
    static logRequest(method, url, params) {
        if (this.debugMode) {
            console.error(`[API] ${new Date().toISOString()} - ${method} ${url}`);
            if (params) {
                console.error('Parameters:', JSON.stringify(params, null, 2));
            }
        }
    }
    /**
     * Log API responses
     */
    static logResponse(method, url, status, duration) {
        if (this.debugMode) {
            console.error(`[API] ${new Date().toISOString()} - ${method} ${url} - ${status} (${duration}ms)`);
        }
    }
    /**
     * Log tool execution
     */
    static logTool(toolName, args, duration) {
        const durationStr = duration ? ` (${duration}ms)` : '';
        this.info(`Tool executed: ${toolName}${durationStr}`, args);
    }
    /**
     * Log resource access
     */
    static logResource(uri, operation, duration) {
        const durationStr = duration ? ` (${duration}ms)` : '';
        this.info(`Resource ${operation}: ${uri}${durationStr}`);
    }
}
_a = Logger;
Logger.logLevel = LogLevel.INFO;
Logger.debugMode = false;
(() => {
    // Initialize from environment
    const envLogLevel = process.env.JENKINS_LOG_LEVEL?.toUpperCase();
    if (envLogLevel && LogLevel[envLogLevel] !== undefined) {
        _a.logLevel = LogLevel[envLogLevel];
    }
    _a.debugMode = process.env.JENKINS_DEBUG === 'true' ||
        process.env.DEBUG === 'jenkins-mcp' ||
        process.env.DEBUG === '*';
})();
//# sourceMappingURL=logging.js.map