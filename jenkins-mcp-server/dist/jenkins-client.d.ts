import { JenkinsConfig } from './config-loader.js';
/**
 * Jenkins API client for interacting with Jenkins instances
 */
export declare class JenkinsClient {
    private client;
    private config;
    private crumbIssuer?;
    private rateLimiter;
    constructor(config: JenkinsConfig);
    /**
     * Get CSRF protection crumb
     */
    private ensureCrumb;
    /**
     * Test connection to Jenkins
     */
    testConnection(): Promise<boolean>;
    /**
     * Get Jenkins version and system info
     */
    getSystemInfo(): Promise<any>;
    /**
     * List all jobs with pagination support
     */
    listJobs(folderPath?: string, limit?: number, offset?: number): Promise<{
        jobs: any[];
        total: number;
        hasMore: boolean;
    }>;
    /**
     * Get job details
     */
    getJob(jobName: string): Promise<any>;
    /**
     * Get job configuration (XML)
     */
    getJobConfig(jobName: string): Promise<string>;
    /**
     * Create or update job configuration
     */
    createOrUpdateJob(jobName: string, configXml: string): Promise<void>;
    /**
     * Delete a job
     */
    deleteJob(jobName: string): Promise<void>;
    /**
     * Build a job
     */
    buildJob(jobName: string, parameters?: Record<string, any>, onProgress?: (message: string) => void): Promise<number>;
    /**
     * Get build info
     */
    getBuild(jobName: string, buildNumber: number): Promise<any>;
    /**
     * Get build log
     */
    getBuildLog(jobName: string, buildNumber: number, start?: number): Promise<string>;
    /**
     * Stop a build
     */
    stopBuild(jobName: string, buildNumber: number): Promise<void>;
    /**
     * Get queue info
     */
    getQueue(): Promise<any[]>;
    /**
     * Cancel queue item
     */
    cancelQueueItem(itemId: number): Promise<void>;
    /**
     * List build artifacts
     */
    listArtifacts(jobName: string, buildNumber: number): Promise<any[]>;
    /**
     * Download artifact
     */
    downloadArtifact(jobName: string, buildNumber: number, artifactPath: string): Promise<Buffer>;
    /**
     * List nodes/agents
     */
    listNodes(): Promise<any[]>;
    /**
     * Get node info
     */
    getNode(nodeName: string): Promise<any>;
    /**
     * Take node offline
     */
    setNodeOffline(nodeName: string, message?: string): Promise<void>;
    /**
     * List installed plugins
     */
    listPlugins(): Promise<any[]>;
    /**
     * Restart Jenkins
     */
    restart(safe?: boolean): Promise<void>;
    /**
     * Create a view
     */
    createView(viewName: string, viewType?: string): Promise<void>;
    /**
     * Enable/disable a job
     */
    setJobEnabled(jobName: string, enabled: boolean): Promise<void>;
}
//# sourceMappingURL=jenkins-client.d.ts.map