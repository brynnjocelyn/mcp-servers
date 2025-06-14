import { CephConfig } from './config-loader.js';
/**
 * Error class for Ceph operations
 */
export declare class CephError extends Error {
    code?: string | undefined;
    details?: any | undefined;
    constructor(message: string, code?: string | undefined, details?: any | undefined);
}
/**
 * Client for interacting with Ceph cluster
 */
export declare class CephClient {
    private config;
    private apiClient?;
    constructor(config: CephConfig);
    /**
     * Execute a Ceph command using the CLI
     */
    private execCommand;
    /**
     * Make an API request to the Ceph REST API
     */
    private apiRequest;
    /**
     * Get cluster status
     */
    getStatus(): Promise<any>;
    /**
     * Get cluster health
     */
    getHealth(): Promise<any>;
    /**
     * Get cluster configuration
     */
    getConfig(section?: string, name?: string): Promise<any>;
    /**
     * Set cluster configuration
     */
    setConfig(section: string, name: string, value: string): Promise<any>;
    /**
     * List all pools
     */
    listPools(): Promise<any>;
    /**
     * Create a new pool
     */
    createPool(name: string, pgNum?: number): Promise<any>;
    /**
     * Delete a pool
     */
    deletePool(name: string): Promise<any>;
    /**
     * Get pool stats
     */
    getPoolStats(poolName?: string): Promise<any>;
    /**
     * Put an object into a pool
     */
    putObject(pool: string, objectName: string, data: Buffer | string): Promise<any>;
    /**
     * Get an object from a pool
     */
    getObject(pool: string, objectName: string): Promise<any>;
    /**
     * List objects in a pool
     */
    listObjects(pool: string): Promise<any>;
    /**
     * Delete an object
     */
    deleteObject(pool: string, objectName: string): Promise<any>;
    /**
     * List OSDs
     */
    listOSDs(): Promise<any>;
    /**
     * Get OSD tree
     */
    getOSDTree(): Promise<any>;
    /**
     * Get OSD stats
     */
    getOSDStats(): Promise<any>;
    /**
     * Get monitor status
     */
    getMonitorStatus(): Promise<any>;
    /**
     * List monitors
     */
    listMonitors(): Promise<any>;
    /**
     * Get PG stats
     */
    getPGStats(): Promise<any>;
    /**
     * List PGs
     */
    listPGs(): Promise<any>;
    /**
     * Get MDS status
     */
    getMDSStatus(): Promise<any>;
    /**
     * List filesystems
     */
    listFilesystems(): Promise<any>;
    /**
     * List RBD images
     */
    listRBDImages(pool?: string): Promise<any>;
    /**
     * Create RBD image
     */
    createRBDImage(name: string, size: string, pool?: string): Promise<any>;
    /**
     * Delete RBD image
     */
    deleteRBDImage(name: string, pool?: string): Promise<any>;
    /**
     * Get RBD image info
     */
    getRBDImageInfo(name: string, pool?: string): Promise<any>;
    /**
     * List RGW users
     */
    listRGWUsers(): Promise<any>;
    /**
     * Create RGW user
     */
    createRGWUser(uid: string, displayName: string): Promise<any>;
    /**
     * Get RGW user info
     */
    getRGWUserInfo(uid: string): Promise<any>;
    /**
     * Delete RGW user
     */
    deleteRGWUser(uid: string): Promise<any>;
    /**
     * List RGW buckets
     */
    listRGWBuckets(): Promise<any>;
    /**
     * Get RGW bucket stats
     */
    getRGWBucketStats(bucket: string): Promise<any>;
}
//# sourceMappingURL=ceph-client.d.ts.map