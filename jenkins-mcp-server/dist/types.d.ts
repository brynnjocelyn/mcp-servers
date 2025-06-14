/**
 * Type extensions for Jenkins MCP Server
 */
import 'axios';
declare module 'axios' {
    interface AxiosRequestConfig {
        metadata?: {
            startTime: number;
        };
    }
}
//# sourceMappingURL=types.d.ts.map