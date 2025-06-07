export interface ProxmoxConfig {
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    realm?: string;
    tokenId?: string;
    tokenSecret?: string;
    verifySsl?: boolean;
    timeout?: number;
}
/**
 * Loads Proxmox configuration from multiple sources
 * Priority: local config file > environment variables > defaults
 */
export declare function loadConfig(): ProxmoxConfig;
//# sourceMappingURL=config-loader.d.ts.map