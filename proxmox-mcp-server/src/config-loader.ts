import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

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
export function loadConfig(): ProxmoxConfig {
  // Check for local config file
  const configPath = join(process.cwd(), '.proxmox-mcp.json');
  let fileConfig: ProxmoxConfig = {};
  
  if (existsSync(configPath)) {
    try {
      const configData = readFileSync(configPath, 'utf-8');
      fileConfig = JSON.parse(configData);
      console.error('Loaded config from .proxmox-mcp.json');
    } catch (error) {
      console.error('Error reading config file:', error);
    }
  }

  // Build configuration with precedence
  const config: ProxmoxConfig = {
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