/**
 * Rate limiting and sampling implementation for Jenkins MCP Server
 * Prevents overwhelming the Jenkins server with too many requests
 */
import { Logger } from './logging.js';
export class RateLimiter {
    constructor(config) {
        this.requestTimes = [];
        this.concurrentRequests = 0;
        this.config = {
            maxRequestsPerMinute: parseInt(process.env.JENKINS_MAX_REQUESTS_PER_MINUTE || '60'),
            maxConcurrentRequests: parseInt(process.env.JENKINS_MAX_CONCURRENT_REQUESTS || '5'),
            burstSize: parseInt(process.env.JENKINS_BURST_SIZE || '10'),
            ...config
        };
        Logger.info('Rate limiter initialized', this.config);
    }
    /**
     * Check if request should be allowed
     */
    async checkLimit() {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        // Clean up old request times
        this.requestTimes = this.requestTimes.filter(time => time > oneMinuteAgo);
        // Check rate limit
        if (this.requestTimes.length >= this.config.maxRequestsPerMinute) {
            Logger.warn('Rate limit exceeded', {
                current: this.requestTimes.length,
                limit: this.config.maxRequestsPerMinute
            });
            return false;
        }
        // Check concurrent requests
        if (this.concurrentRequests >= this.config.maxConcurrentRequests) {
            Logger.warn('Concurrent request limit exceeded', {
                current: this.concurrentRequests,
                limit: this.config.maxConcurrentRequests
            });
            return false;
        }
        // Check burst limit (requests in last 5 seconds)
        const fiveSecondsAgo = now - 5000;
        const recentRequests = this.requestTimes.filter(time => time > fiveSecondsAgo).length;
        if (recentRequests >= this.config.burstSize) {
            Logger.warn('Burst limit exceeded', {
                recent: recentRequests,
                limit: this.config.burstSize
            });
            return false;
        }
        return true;
    }
    /**
     * Record a request
     */
    recordRequest() {
        this.requestTimes.push(Date.now());
        this.concurrentRequests++;
        Logger.debug('Request recorded', {
            total: this.requestTimes.length,
            concurrent: this.concurrentRequests
        });
    }
    /**
     * Mark request as completed
     */
    completeRequest() {
        this.concurrentRequests = Math.max(0, this.concurrentRequests - 1);
        Logger.debug('Request completed', { concurrent: this.concurrentRequests });
    }
    /**
     * Wait if rate limited
     */
    async waitIfNeeded() {
        while (!(await this.checkLimit())) {
            // Wait 1 second before checking again
            Logger.info('Rate limited, waiting 1 second...');
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    /**
     * Execute with rate limiting
     */
    async execute(fn) {
        await this.waitIfNeeded();
        this.recordRequest();
        try {
            return await fn();
        }
        finally {
            this.completeRequest();
        }
    }
}
/**
 * Sampling configuration for expensive operations
 */
export class Sampler {
    constructor(sampleRate = 1.0) {
        this.sampleCount = 0;
        this.totalCount = 0;
        this.sampleRate = Math.max(0, Math.min(1, sampleRate));
        Logger.info(`Sampler initialized with rate: ${this.sampleRate}`);
    }
    /**
     * Check if this request should be sampled
     */
    shouldSample() {
        this.totalCount++;
        // Always sample if rate is 1.0
        if (this.sampleRate >= 1.0) {
            this.sampleCount++;
            return true;
        }
        // Never sample if rate is 0
        if (this.sampleRate <= 0) {
            return false;
        }
        // Probabilistic sampling
        const sample = Math.random() < this.sampleRate;
        if (sample) {
            this.sampleCount++;
        }
        // Log sampling stats every 100 requests
        if (this.totalCount % 100 === 0) {
            Logger.debug('Sampling statistics', {
                total: this.totalCount,
                sampled: this.sampleCount,
                actualRate: (this.sampleCount / this.totalCount).toFixed(3)
            });
        }
        return sample;
    }
    /**
     * Get sampling statistics
     */
    getStats() {
        return {
            totalRequests: this.totalCount,
            sampledRequests: this.sampleCount,
            sampleRate: this.sampleRate,
            actualRate: this.totalCount > 0 ? this.sampleCount / this.totalCount : 0
        };
    }
}
/**
 * Create samplers for different operation types
 */
export const samplers = {
    buildLogs: new Sampler(parseFloat(process.env.JENKINS_SAMPLE_BUILD_LOGS || '0.5')),
    artifacts: new Sampler(parseFloat(process.env.JENKINS_SAMPLE_ARTIFACTS || '0.3')),
    systemInfo: new Sampler(parseFloat(process.env.JENKINS_SAMPLE_SYSTEM_INFO || '0.1'))
};
//# sourceMappingURL=rate-limiter.js.map