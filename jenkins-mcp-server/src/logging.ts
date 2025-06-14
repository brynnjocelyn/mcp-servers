/**
 * Logging utility for Jenkins MCP Server
 * Provides debug logging based on environment settings
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export class Logger {
  private static logLevel: LogLevel = LogLevel.INFO;
  private static debugMode: boolean = false;

  static {
    // Initialize from environment
    const envLogLevel = process.env.JENKINS_LOG_LEVEL?.toUpperCase();
    if (envLogLevel && LogLevel[envLogLevel as keyof typeof LogLevel] !== undefined) {
      this.logLevel = LogLevel[envLogLevel as keyof typeof LogLevel];
    }
    
    this.debugMode = process.env.JENKINS_DEBUG === 'true' || 
                    process.env.DEBUG === 'jenkins-mcp' ||
                    process.env.DEBUG === '*';
  }

  /**
   * Log error messages
   */
  static error(message: string, error?: any): void {
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
  static warn(message: string, details?: any): void {
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
  static info(message: string, details?: any): void {
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
  static debug(message: string, details?: any): void {
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
  static logRequest(method: string, url: string, params?: any): void {
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
  static logResponse(method: string, url: string, status: number, duration: number): void {
    if (this.debugMode) {
      console.error(`[API] ${new Date().toISOString()} - ${method} ${url} - ${status} (${duration}ms)`);
    }
  }

  /**
   * Log tool execution
   */
  static logTool(toolName: string, args: any, duration?: number): void {
    const durationStr = duration ? ` (${duration}ms)` : '';
    this.info(`Tool executed: ${toolName}${durationStr}`, args);
  }

  /**
   * Log resource access
   */
  static logResource(uri: string, operation: 'read' | 'list', duration?: number): void {
    const durationStr = duration ? ` (${duration}ms)` : '';
    this.info(`Resource ${operation}: ${uri}${durationStr}`);
  }
}