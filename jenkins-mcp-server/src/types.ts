/**
 * Type extensions for Jenkins MCP Server
 */

import 'axios';

declare module 'axios' {
  export interface AxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
  }
}