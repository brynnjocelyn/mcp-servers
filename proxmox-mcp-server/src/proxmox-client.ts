import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import https from 'https';
import { ProxmoxConfig } from './config-loader.js';

export interface ProxmoxAuthTicket {
  ticket: string;
  CSRFPreventionToken: string;
  username: string;
}

export class ProxmoxClient {
  private client: AxiosInstance;
  private config: ProxmoxConfig;
  private authTicket?: ProxmoxAuthTicket;
  private baseUrl: string;

  constructor(config: ProxmoxConfig) {
    this.config = config;
    this.baseUrl = `https://${config.host}:${config.port}/api2/json`;
    
    // Create axios instance with custom https agent
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: config.timeout || 30000,
      httpsAgent: new https.Agent({
        rejectUnauthorized: config.verifySsl !== false
      })
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        if (error.response) {
          const errorMsg = error.response.data?.errors 
            ? JSON.stringify(error.response.data.errors)
            : error.response.statusText;
          throw new Error(`Proxmox API error: ${errorMsg}`);
        }
        throw error;
      }
    );
  }

  /**
   * Authenticate with Proxmox using username/password
   */
  async authenticateWithPassword(): Promise<void> {
    if (!this.config.username || !this.config.password) {
      throw new Error('Username and password required for password authentication');
    }

    try {
      const response = await this.client.post('/access/ticket', {
        username: `${this.config.username}@${this.config.realm}`,
        password: this.config.password
      });

      this.authTicket = {
        ticket: response.data.data.ticket,
        CSRFPreventionToken: response.data.data.CSRFPreventionToken,
        username: response.data.data.username
      };

      // Set default headers for authenticated requests
      this.client.defaults.headers.common['Cookie'] = `PVEAuthCookie=${this.authTicket.ticket}`;
      this.client.defaults.headers.common['CSRFPreventionToken'] = this.authTicket.CSRFPreventionToken;
    } catch (error) {
      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Configure client for API token authentication
   */
  configureTokenAuth(): void {
    if (!this.config.tokenId || !this.config.tokenSecret) {
      throw new Error('Token ID and secret required for token authentication');
    }

    // Format: PVEAPIToken=USER@REALM!TOKENID=UUID
    const tokenAuth = `PVEAPIToken=${this.config.username}@${this.config.realm}!${this.config.tokenId}=${this.config.tokenSecret}`;
    this.client.defaults.headers.common['Authorization'] = tokenAuth;
  }

  /**
   * Initialize authentication
   */
  async initialize(): Promise<void> {
    if (this.config.tokenId && this.config.tokenSecret) {
      this.configureTokenAuth();
    } else {
      await this.authenticateWithPassword();
    }
  }

  /**
   * Make a GET request
   */
  async get(path: string, params?: any): Promise<any> {
    const response = await this.client.get(path, { params });
    return response.data.data;
  }

  /**
   * Make a POST request
   */
  async post(path: string, data?: any): Promise<any> {
    const response = await this.client.post(path, data);
    return response.data.data;
  }

  /**
   * Make a PUT request
   */
  async put(path: string, data?: any): Promise<any> {
    const response = await this.client.put(path, data);
    return response.data.data;
  }

  /**
   * Make a DELETE request
   */
  async delete(path: string): Promise<any> {
    const response = await this.client.delete(path);
    return response.data.data;
  }

  /**
   * Get cluster status
   */
  async getClusterStatus(): Promise<any> {
    return this.get('/cluster/status');
  }

  /**
   * Get list of nodes
   */
  async getNodes(): Promise<any[]> {
    return this.get('/nodes');
  }

  /**
   * Get node status
   */
  async getNodeStatus(node: string): Promise<any> {
    return this.get(`/nodes/${node}/status`);
  }

  /**
   * Get list of VMs on a node
   */
  async getVMs(node: string): Promise<any[]> {
    return this.get(`/nodes/${node}/qemu`);
  }

  /**
   * Get VM status
   */
  async getVMStatus(node: string, vmid: number): Promise<any> {
    return this.get(`/nodes/${node}/qemu/${vmid}/status/current`);
  }

  /**
   * Get list of containers on a node
   */
  async getContainers(node: string): Promise<any[]> {
    return this.get(`/nodes/${node}/lxc`);
  }

  /**
   * Get container status
   */
  async getContainerStatus(node: string, vmid: number): Promise<any> {
    return this.get(`/nodes/${node}/lxc/${vmid}/status/current`);
  }

  /**
   * Get storage list
   */
  async getStorage(node?: string): Promise<any[]> {
    if (node) {
      return this.get(`/nodes/${node}/storage`);
    }
    return this.get('/storage');
  }

  /**
   * Get version information
   */
  async getVersion(): Promise<any> {
    return this.get('/version');
  }
}