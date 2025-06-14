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
  // Determine config file name - check for MCP instance name first
  const mcpServerName = process.env.MCP_SERVER_NAME || 'proxmox-mcp';
  const configFileName = `.${mcpServerName}.json`;
  const configPath = join(process.cwd(), configFileName);
  
  // Fallback to default name if custom name doesn't exist
  const defaultConfigPath = join(process.cwd(), '.proxmox-mcp.json');
  
  let fileConfig: ProxmoxConfig = {};
  
  if (existsSync(configPath)) {
    try {
      const configData = readFileSync(configPath, 'utf-8');
      fileConfig = JSON.parse(configData);
      console.error(`Loaded config from ${configFileName}`);
    } catch (error) {
      console.error(`Error reading config file ${configFileName}:`, error);
    }
  } else if (existsSync(defaultConfigPath)) {
    try {
      const configData = readFileSync(defaultConfigPath, 'utf-8');
      fileConfig = JSON.parse(configData);
      console.error('Loaded config from .proxmox-mcp.json (fallback)');
    } catch (error) {
      console.error('Error reading config file .proxmox-mcp.json:', error);
    }
  } else {
    console.error(`No config file found. Checked: ${configFileName}, .proxmox-mcp.json`);
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