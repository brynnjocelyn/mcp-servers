import { ProxmoxConfig } from './config-loader.js';
export interface ProxmoxAuthTicket {
    ticket: string;
    CSRFPreventionToken: string;
    username: string;
}
export declare class ProxmoxClient {
    private client;
    private config;
    private authTicket?;
    private baseUrl;
    constructor(config: ProxmoxConfig);
    /**
     * Authenticate with Proxmox using username/password
     */
    authenticateWithPassword(): Promise<void>;
    /**
     * Configure client for API token authentication
     */
    configureTokenAuth(): void;
    /**
     * Initialize authentication
     */
    initialize(): Promise<void>;
    /**
     * Make a GET request
     */
    get(path: string, params?: any): Promise<any>;
    /**
     * Make a POST request
     */
    post(path: string, data?: any): Promise<any>;
    /**
     * Make a PUT request
     */
    put(path: string, data?: any): Promise<any>;
    /**
     * Make a DELETE request
     */
    delete(path: string): Promise<any>;
    /**
     * Get cluster status
     */
    getClusterStatus(): Promise<any>;
    /**
     * Get list of nodes
     */
    getNodes(): Promise<any[]>;
    /**
     * Get node status
     */
    getNodeStatus(node: string): Promise<any>;
    /**
     * Get list of VMs on a node
     */
    getVMs(node: string): Promise<any[]>;
    /**
     * Get VM status
     */
    getVMStatus(node: string, vmid: number): Promise<any>;
    /**
     * Get list of containers on a node
     */
    getContainers(node: string): Promise<any[]>;
    /**
     * Get container status
     */
    getContainerStatus(node: string, vmid: number): Promise<any>;
    /**
     * Get storage list
     */
    getStorage(node?: string): Promise<any[]>;
    /**
     * Get version information
     */
    getVersion(): Promise<any>;
}
//# sourceMappingURL=proxmox-client.d.ts.map