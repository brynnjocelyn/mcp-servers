"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
const fs_1 = require("fs");
const path_1 = require("path");
/**
 * Loads Proxmox configuration from multiple sources
 * Priority: local config file > environment variables > defaults
 */
function loadConfig() {
    // Check for local config file
    const configPath = (0, path_1.join)(process.cwd(), '.proxmox-mcp.json');
    let fileConfig = {};
    if ((0, fs_1.existsSync)(configPath)) {
        try {
            const configData = (0, fs_1.readFileSync)(configPath, 'utf-8');
            fileConfig = JSON.parse(configData);
            console.error('Loaded config from .proxmox-mcp.json');
        }
        catch (error) {
            console.error('Error reading config file:', error);
        }
    }
    // Build configuration with precedence
    const config = {
        host: fileConfig.host || process.env.PROXMOX_HOST || 'localhost',
        port: fileConfig.port || parseInt(process.env.PROXMOX_PORT || '8006'),
        username: fileConfig.username || process.env.PROXMOX_USERNAME,
        password: fileConfig.password || process.env.PROXMOX_PASSWORD,
        realm: fileConfig.realm || process.env.PROXMOX_REALM || 'pam',
        tokenId: fileConfig.tokenId || process.env.PROXMOX_TOKEN_ID,
        tokenSecret: fileConfig.tokenSecret || process.env.PROXMOX_TOKEN_SECRET,
        verifySsl: fileConfig.verifySsl !== undefined ? fileConfig.verifySsl : process.env.PROXMOX_VERIFY_SSL !== 'false',
        timeout: fileConfig.timeout || parseInt(process.env.PROXMOX_TIMEOUT || '30000')
    };
    // Validate configuration
    if (!config.host) {
        throw new Error('Proxmox host not configured');
    }
    // Check authentication method
    const hasUserAuth = config.username && config.password;
    const hasTokenAuth = config.tokenId && config.tokenSecret;
    if (!hasUserAuth && !hasTokenAuth) {
        throw new Error('Proxmox authentication not configured. Provide either username/password or tokenId/tokenSecret');
    }
    return config;
}
//# sourceMappingURL=config-loader.js.map