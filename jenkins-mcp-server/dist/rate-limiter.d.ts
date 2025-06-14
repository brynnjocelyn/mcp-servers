/**
 * Rate limiting and sampling implementation for Jenkins MCP Server
 * Prevents overwhelming the Jenkins server with too many requests
 */
interface RateLimitConfig {
    maxRequestsPerMinute: number;
    maxConcurrentRequests: number;
    burstSize: number;
}
export declare class RateLimiter {
    private requestTimes;
    private concurrentRequests;
    private config;
    constructor(config?: Partial<RateLimitConfig>);
    /**
     * Check if request should be allowed
     */
    checkLimit(): Promise<boolean>;
    /**
     * Record a request
     */
    recordRequest(): void;
    /**
     * Mark request as completed
     */
    completeRequest(): void;
    /**
     * Wait if rate limited
     */
    waitIfNeeded(): Promise<void>;
    /**
     * Execute with rate limiting
     */
    execute<T>(fn: () => Promise<T>): Promise<T>;
}
/**
 * Sampling configuration for expensive operations
 */
export declare class Sampler {
    private sampleRate;
    private sampleCount;
    private totalCount;
    constructor(sampleRate?: number);
    /**
     * Check if this request should be sampled
     */
    shouldSample(): boolean;
    /**
     * Get sampling statistics
     */
    getStats(): {
        totalRequests: number;
        sampledRequests: number;
        sampleRate: number;
        actualRate: number;
    };
}
/**
 * Create samplers for different operation types
 */
export declare const samplers: {
    buildLogs: Sampler;
    artifacts: Sampler;
    systemInfo: Sampler;
};
export {};
//# sourceMappingURL=rate-limiter.d.ts.map