"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CephClient = exports.CephError = void 0;
const axios_1 = __importStar(require("axios"));
const child_process_1 = require("child_process");
/**
 * Error class for Ceph operations
 */
class CephError extends Error {
    code;
    details;
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'CephError';
    }
}
exports.CephError = CephError;
/**
 * Client for interacting with Ceph cluster
 */
class CephClient {
    config;
    apiClient;
    constructor(config) {
        this.config = config;
        // Initialize API client if API URL is provided
        if (config.api_url) {
            this.apiClient = axios_1.default.create({
                baseURL: config.api_url,
                timeout: config.timeout || 30000,
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            // Add authentication
            if (config.api_key) {
                this.apiClient.defaults.headers.common['Authorization'] = `Bearer ${config.api_key}`;
            }
            else if (config.api_username && config.api_password) {
                this.apiClient.defaults.auth = {
                    username: config.api_username,
                    password: config.api_password
                };
            }
        }
    }
    /**
     * Execute a Ceph command using the CLI
     */
    async execCommand(command, args = []) {
        return new Promise((resolve, reject) => {
            const cmdArgs = [];
            // Add cluster name if specified
            if (this.config.cluster_name && this.config.cluster_name !== 'ceph') {
                cmdArgs.push('--cluster', this.config.cluster_name);
            }
            // Add monitor hosts if specified
            if (this.config.monitor_hosts && this.config.monitor_hosts.length > 0) {
                cmdArgs.push('-m', this.config.monitor_hosts.join(','));
            }
            // Add username if specified
            if (this.config.username) {
                cmdArgs.push('--name', this.config.username);
            }
            // Add keyring path if specified
            if (this.config.keyring_path) {
                cmdArgs.push('--keyring', this.config.keyring_path);
            }
            // Add the actual command and its arguments
            cmdArgs.push(command, ...args, '--format', 'json');
            const proc = (0, child_process_1.spawn)('ceph', cmdArgs);
            let stdout = '';
            let stderr = '';
            proc.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            proc.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            proc.on('close', (code) => {
                if (code !== 0) {
                    reject(new CephError(`Command failed: ${stderr}`, 'COMMAND_FAILED', { code, stderr }));
                }
                else {
                    try {
                        const result = stdout.trim() ? JSON.parse(stdout) : {};
                        resolve(result);
                    }
                    catch (e) {
                        // If not JSON, return raw output
                        resolve(stdout.trim());
                    }
                }
            });
            proc.on('error', (err) => {
                reject(new CephError(`Failed to execute command: ${err.message}`, 'EXEC_ERROR', err));
            });
        });
    }
    /**
     * Make an API request to the Ceph REST API
     */
    async apiRequest(method, path, data) {
        if (!this.apiClient) {
            throw new CephError('API client not initialized', 'NO_API_CLIENT');
        }
        try {
            const response = await this.apiClient.request({
                method,
                url: path,
                data
            });
            return response.data;
        }
        catch (error) {
            if (error instanceof axios_1.AxiosError) {
                throw new CephError(error.response?.data?.message || error.message, error.code, error.response?.data);
            }
            throw error;
        }
    }
    // Cluster Operations
    /**
     * Get cluster status
     */
    async getStatus() {
        if (this.apiClient) {
            return this.apiRequest('GET', '/api/health/full');
        }
        return this.execCommand('status');
    }
    /**
     * Get cluster health
     */
    async getHealth() {
        if (this.apiClient) {
            return this.apiRequest('GET', '/api/health/status');
        }
        return this.execCommand('health');
    }
    /**
     * Get cluster configuration
     */
    async getConfig(section, name) {
        const args = ['get'];
        if (section)
            args.push(section);
        if (name)
            args.push(name);
        return this.execCommand('config', args);
    }
    /**
     * Set cluster configuration
     */
    async setConfig(section, name, value) {
        return this.execCommand('config', ['set', section, name, value]);
    }
    // Pool Operations
    /**
     * List all pools
     */
    async listPools() {
        if (this.apiClient) {
            return this.apiRequest('GET', '/api/pool');
        }
        return this.execCommand('osd', ['pool', 'ls', 'detail']);
    }
    /**
     * Create a new pool
     */
    async createPool(name, pgNum = 128) {
        return this.execCommand('osd', ['pool', 'create', name, pgNum.toString()]);
    }
    /**
     * Delete a pool
     */
    async deletePool(name) {
        return this.execCommand('osd', ['pool', 'delete', name, name, '--yes-i-really-really-mean-it']);
    }
    /**
     * Get pool stats
     */
    async getPoolStats(poolName) {
        const args = ['pool', 'stats'];
        if (poolName)
            args.push(poolName);
        return this.execCommand('osd', args);
    }
    // Object Operations
    /**
     * Put an object into a pool
     */
    async putObject(pool, objectName, data) {
        // This would typically use librados, but for CLI we need to write to a temp file
        throw new CephError('Object operations require librados integration', 'NOT_IMPLEMENTED');
    }
    /**
     * Get an object from a pool
     */
    async getObject(pool, objectName) {
        // This would typically use librados
        throw new CephError('Object operations require librados integration', 'NOT_IMPLEMENTED');
    }
    /**
     * List objects in a pool
     */
    async listObjects(pool) {
        return this.execCommand('rados', ['-p', pool, 'ls']);
    }
    /**
     * Delete an object
     */
    async deleteObject(pool, objectName) {
        return this.execCommand('rados', ['-p', pool, 'rm', objectName]);
    }
    // OSD Operations
    /**
     * List OSDs
     */
    async listOSDs() {
        if (this.apiClient) {
            return this.apiRequest('GET', '/api/osd');
        }
        return this.execCommand('osd', ['ls']);
    }
    /**
     * Get OSD tree
     */
    async getOSDTree() {
        return this.execCommand('osd', ['tree']);
    }
    /**
     * Get OSD stats
     */
    async getOSDStats() {
        return this.execCommand('osd', ['df']);
    }
    // Monitor Operations
    /**
     * Get monitor status
     */
    async getMonitorStatus() {
        return this.execCommand('mon', ['stat']);
    }
    /**
     * List monitors
     */
    async listMonitors() {
        return this.execCommand('mon', ['dump']);
    }
    // PG Operations
    /**
     * Get PG stats
     */
    async getPGStats() {
        return this.execCommand('pg', ['stat']);
    }
    /**
     * List PGs
     */
    async listPGs() {
        return this.execCommand('pg', ['ls']);
    }
    // MDS Operations (CephFS)
    /**
     * Get MDS status
     */
    async getMDSStatus() {
        return this.execCommand('mds', ['stat']);
    }
    /**
     * List filesystems
     */
    async listFilesystems() {
        return this.execCommand('fs', ['ls']);
    }
    // RBD Operations
    /**
     * List RBD images
     */
    async listRBDImages(pool) {
        const args = ['ls'];
        if (pool)
            args.push('-p', pool);
        return this.execCommand('rbd', args);
    }
    /**
     * Create RBD image
     */
    async createRBDImage(name, size, pool) {
        const args = ['create', name, '--size', size];
        if (pool)
            args.push('-p', pool);
        return this.execCommand('rbd', args);
    }
    /**
     * Delete RBD image
     */
    async deleteRBDImage(name, pool) {
        const args = ['rm', name];
        if (pool)
            args.push('-p', pool);
        return this.execCommand('rbd', args);
    }
    /**
     * Get RBD image info
     */
    async getRBDImageInfo(name, pool) {
        const args = ['info', name];
        if (pool)
            args.push('-p', pool);
        return this.execCommand('rbd', args);
    }
    // S3/RGW Operations
    /**
     * List RGW users
     */
    async listRGWUsers() {
        return this.execCommand('radosgw-admin', ['user', 'list']);
    }
    /**
     * Create RGW user
     */
    async createRGWUser(uid, displayName) {
        return this.execCommand('radosgw-admin', ['user', 'create', '--uid', uid, '--display-name', displayName]);
    }
    /**
     * Get RGW user info
     */
    async getRGWUserInfo(uid) {
        return this.execCommand('radosgw-admin', ['user', 'info', '--uid', uid]);
    }
    /**
     * Delete RGW user
     */
    async deleteRGWUser(uid) {
        return this.execCommand('radosgw-admin', ['user', 'rm', '--uid', uid]);
    }
    /**
     * List RGW buckets
     */
    async listRGWBuckets() {
        return this.execCommand('radosgw-admin', ['bucket', 'list']);
    }
    /**
     * Get RGW bucket stats
     */
    async getRGWBucketStats(bucket) {
        return this.execCommand('radosgw-admin', ['bucket', 'stats', '--bucket', bucket]);
    }
}
exports.CephClient = CephClient;
//# sourceMappingURL=ceph-client.js.map