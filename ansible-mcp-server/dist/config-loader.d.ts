export interface AnsibleConfig {
    ansiblePath?: string;
    pythonPath?: string;
    inventoryPath?: string;
    playbooksPath?: string;
    rolesPath?: string;
    vaultPasswordFile?: string;
    privateKeyFile?: string;
    remoteUser?: string;
    becomeMethod?: string;
    becomeUser?: string;
    forks?: number;
    timeout?: number;
    hostKeyChecking?: boolean;
    callbackPlugins?: string[];
    strategyPlugins?: string[];
    dbPath?: string;
    proxmoxDefaults?: {
        apiHost?: string;
        apiUser?: string;
        apiTokenId?: string;
        apiTokenSecret?: string;
        verifySsl?: boolean;
    };
}
/**
 * Load configuration from multiple sources
 * Priority: local config file > environment variables > defaults
 * @returns AnsibleConfig object
 */
export declare function loadConfig(): AnsibleConfig;
//# sourceMappingURL=config-loader.d.ts.map