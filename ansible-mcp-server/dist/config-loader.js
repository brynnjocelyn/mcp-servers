import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
/**
 * Load configuration from multiple sources
 * Priority: local config file > environment variables > defaults
 * @returns AnsibleConfig object
 */
export function loadConfig() {
    // Check for local config file
    const configPath = join(process.cwd(), '.ansible-mcp.json');
    let fileConfig = {};
    if (existsSync(configPath)) {
        try {
            const configContent = readFileSync(configPath, 'utf-8');
            fileConfig = JSON.parse(configContent);
        }
        catch (error) {
            console.error('Error reading config file:', error);
        }
    }
    // Build configuration with priority
    const config = {
        ansiblePath: fileConfig.ansiblePath || process.env.ANSIBLE_PATH || 'ansible',
        pythonPath: fileConfig.pythonPath || process.env.PYTHON_PATH || 'python3',
        inventoryPath: fileConfig.inventoryPath || process.env.ANSIBLE_INVENTORY || './inventory',
        playbooksPath: fileConfig.playbooksPath || process.env.ANSIBLE_PLAYBOOKS_PATH || './playbooks',
        rolesPath: fileConfig.rolesPath || process.env.ANSIBLE_ROLES_PATH || './roles',
        vaultPasswordFile: fileConfig.vaultPasswordFile || process.env.ANSIBLE_VAULT_PASSWORD_FILE,
        privateKeyFile: fileConfig.privateKeyFile || process.env.ANSIBLE_PRIVATE_KEY_FILE,
        remoteUser: fileConfig.remoteUser || process.env.ANSIBLE_REMOTE_USER || 'root',
        becomeMethod: fileConfig.becomeMethod || process.env.ANSIBLE_BECOME_METHOD || 'sudo',
        becomeUser: fileConfig.becomeUser || process.env.ANSIBLE_BECOME_USER || 'root',
        forks: fileConfig.forks || (process.env.ANSIBLE_FORKS ? parseInt(process.env.ANSIBLE_FORKS) : 5),
        timeout: fileConfig.timeout || (process.env.ANSIBLE_TIMEOUT ? parseInt(process.env.ANSIBLE_TIMEOUT) : 30),
        hostKeyChecking: fileConfig.hostKeyChecking !== undefined ? fileConfig.hostKeyChecking :
            process.env.ANSIBLE_HOST_KEY_CHECKING !== 'false',
        callbackPlugins: fileConfig.callbackPlugins || [],
        strategyPlugins: fileConfig.strategyPlugins || [],
        dbPath: fileConfig.dbPath || process.env.ANSIBLE_MCP_DB_PATH || './ansible-mcp.db',
        proxmoxDefaults: fileConfig.proxmoxDefaults || {
            apiHost: process.env.PROXMOX_HOST,
            apiUser: process.env.PROXMOX_USER,
            apiTokenId: process.env.PROXMOX_TOKEN_ID,
            apiTokenSecret: process.env.PROXMOX_TOKEN_SECRET,
            verifySsl: process.env.PROXMOX_VERIFY_SSL !== 'false',
        },
    };
    return config;
}
//# sourceMappingURL=config-loader.js.map