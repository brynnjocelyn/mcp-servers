import axios, { AxiosInstance, AxiosError } from 'axios';
import { spawn } from 'child_process';
import { CephConfig } from './config-loader.js';

/**
 * Error class for Ceph operations
 */
export class CephError extends Error {
  constructor(message: string, public code?: string, public details?: any) {
    super(message);
    this.name = 'CephError';
  }
}

/**
 * Client for interacting with Ceph cluster
 */
export class CephClient {
  private config: CephConfig;
  private apiClient?: AxiosInstance;

  constructor(config: CephConfig) {
    this.config = config;
    
    // Initialize API client if API URL is provided
    if (config.api_url) {
      this.apiClient = axios.create({
        baseURL: config.api_url,
        timeout: config.timeout || 30000,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      // Add authentication
      if (config.api_key) {
        this.apiClient.defaults.headers.common['Authorization'] = `Bearer ${config.api_key}`;
      } else if (config.api_username && config.api_password) {
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
  private async execCommand(command: string, args: string[] = []): Promise<any> {
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
      
      const proc = spawn('ceph', cmdArgs);
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
        } else {
          try {
            const result = stdout.trim() ? JSON.parse(stdout) : {};
            resolve(result);
          } catch (e) {
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
  private async apiRequest(method: string, path: string, data?: any): Promise<any> {
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
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new CephError(
          error.response?.data?.message || error.message,
          error.code,
          error.response?.data
        );
      }
      throw error;
    }
  }

  // Cluster Operations
  
  /**
   * Get cluster status
   */
  async getStatus(): Promise<any> {
    if (this.apiClient) {
      return this.apiRequest('GET', '/api/health/full');
    }
    return this.execCommand('status');
  }

  /**
   * Get cluster health
   */
  async getHealth(): Promise<any> {
    if (this.apiClient) {
      return this.apiRequest('GET', '/api/health/status');
    }
    return this.execCommand('health');
  }

  /**
   * Get cluster configuration
   */
  async getConfig(section?: string, name?: string): Promise<any> {
    const args = ['get'];
    if (section) args.push(section);
    if (name) args.push(name);
    return this.execCommand('config', args);
  }

  /**
   * Set cluster configuration
   */
  async setConfig(section: string, name: string, value: string): Promise<any> {
    return this.execCommand('config', ['set', section, name, value]);
  }

  // Pool Operations
  
  /**
   * List all pools
   */
  async listPools(): Promise<any> {
    if (this.apiClient) {
      return this.apiRequest('GET', '/api/pool');
    }
    return this.execCommand('osd', ['pool', 'ls', 'detail']);
  }

  /**
   * Create a new pool
   */
  async createPool(name: string, pgNum: number = 128): Promise<any> {
    return this.execCommand('osd', ['pool', 'create', name, pgNum.toString()]);
  }

  /**
   * Delete a pool
   */
  async deletePool(name: string): Promise<any> {
    return this.execCommand('osd', ['pool', 'delete', name, name, '--yes-i-really-really-mean-it']);
  }

  /**
   * Get pool stats
   */
  async getPoolStats(poolName?: string): Promise<any> {
    const args = ['pool', 'stats'];
    if (poolName) args.push(poolName);
    return this.execCommand('osd', args);
  }

  // Object Operations
  
  /**
   * Put an object into a pool
   */
  async putObject(pool: string, objectName: string, data: Buffer | string): Promise<any> {
    // This would typically use librados, but for CLI we need to write to a temp file
    throw new CephError('Object operations require librados integration', 'NOT_IMPLEMENTED');
  }

  /**
   * Get an object from a pool
   */
  async getObject(pool: string, objectName: string): Promise<any> {
    // This would typically use librados
    throw new CephError('Object operations require librados integration', 'NOT_IMPLEMENTED');
  }

  /**
   * List objects in a pool
   */
  async listObjects(pool: string): Promise<any> {
    return this.execCommand('rados', ['-p', pool, 'ls']);
  }

  /**
   * Delete an object
   */
  async deleteObject(pool: string, objectName: string): Promise<any> {
    return this.execCommand('rados', ['-p', pool, 'rm', objectName]);
  }

  // OSD Operations
  
  /**
   * List OSDs
   */
  async listOSDs(): Promise<any> {
    if (this.apiClient) {
      return this.apiRequest('GET', '/api/osd');
    }
    return this.execCommand('osd', ['ls']);
  }

  /**
   * Get OSD tree
   */
  async getOSDTree(): Promise<any> {
    return this.execCommand('osd', ['tree']);
  }

  /**
   * Get OSD stats
   */
  async getOSDStats(): Promise<any> {
    return this.execCommand('osd', ['df']);
  }

  // Monitor Operations
  
  /**
   * Get monitor status
   */
  async getMonitorStatus(): Promise<any> {
    return this.execCommand('mon', ['stat']);
  }

  /**
   * List monitors
   */
  async listMonitors(): Promise<any> {
    return this.execCommand('mon', ['dump']);
  }

  // PG Operations
  
  /**
   * Get PG stats
   */
  async getPGStats(): Promise<any> {
    return this.execCommand('pg', ['stat']);
  }

  /**
   * List PGs
   */
  async listPGs(): Promise<any> {
    return this.execCommand('pg', ['ls']);
  }

  // MDS Operations (CephFS)
  
  /**
   * Get MDS status
   */
  async getMDSStatus(): Promise<any> {
    return this.execCommand('mds', ['stat']);
  }

  /**
   * List filesystems
   */
  async listFilesystems(): Promise<any> {
    return this.execCommand('fs', ['ls']);
  }

  // RBD Operations
  
  /**
   * List RBD images
   */
  async listRBDImages(pool?: string): Promise<any> {
    const args = ['ls'];
    if (pool) args.push('-p', pool);
    return this.execCommand('rbd', args);
  }

  /**
   * Create RBD image
   */
  async createRBDImage(name: string, size: string, pool?: string): Promise<any> {
    const args = ['create', name, '--size', size];
    if (pool) args.push('-p', pool);
    return this.execCommand('rbd', args);
  }

  /**
   * Delete RBD image
   */
  async deleteRBDImage(name: string, pool?: string): Promise<any> {
    const args = ['rm', name];
    if (pool) args.push('-p', pool);
    return this.execCommand('rbd', args);
  }

  /**
   * Get RBD image info
   */
  async getRBDImageInfo(name: string, pool?: string): Promise<any> {
    const args = ['info', name];
    if (pool) args.push('-p', pool);
    return this.execCommand('rbd', args);
  }

  // S3/RGW Operations
  
  /**
   * List RGW users
   */
  async listRGWUsers(): Promise<any> {
    return this.execCommand('radosgw-admin', ['user', 'list']);
  }

  /**
   * Create RGW user
   */
  async createRGWUser(uid: string, displayName: string): Promise<any> {
    return this.execCommand('radosgw-admin', ['user', 'create', '--uid', uid, '--display-name', displayName]);
  }

  /**
   * Get RGW user info
   */
  async getRGWUserInfo(uid: string): Promise<any> {
    return this.execCommand('radosgw-admin', ['user', 'info', '--uid', uid]);
  }

  /**
   * Delete RGW user
   */
  async deleteRGWUser(uid: string): Promise<any> {
    return this.execCommand('radosgw-admin', ['user', 'rm', '--uid', uid]);
  }

  /**
   * List RGW buckets
   */
  async listRGWBuckets(): Promise<any> {
    return this.execCommand('radosgw-admin', ['bucket', 'list']);
  }

  /**
   * Get RGW bucket stats
   */
  async getRGWBucketStats(bucket: string): Promise<any> {
    return this.execCommand('radosgw-admin', ['bucket', 'stats', '--bucket', bucket]);
  }
}