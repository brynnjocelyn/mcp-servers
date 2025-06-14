import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { config as dotenvConfig } from 'dotenv';

// Load .env file if it exists
dotenvConfig();

export interface LinkedInConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

/**
 * Load configuration from multiple sources
 * Priority: local config file > environment variables > defaults
 * @returns LinkedInConfig object
 */
export function loadConfig(): LinkedInConfig {
  // Determine config file name - check for MCP instance name first
  const mcpServerName = process.env.MCP_SERVER_NAME || 'linkedin-mcp';
  const configFileName = `.${mcpServerName}.json`;
  const configPath = join(process.cwd(), configFileName);
  
  // Fallback to default name if custom name doesn't exist
  const defaultConfigPath = join(process.cwd(), '.linkedin-mcp.json');
  
  let fileConfig: Partial<LinkedInConfig> = {};
  
  if (existsSync(configPath)) {
    try {
      const configContent = readFileSync(configPath, 'utf-8');
      fileConfig = JSON.parse(configContent);
      console.error(`Loaded config from ${configFileName}`);
    } catch (error) {
      console.error(`Error reading config file ${configFileName}:`, error);
    }
  } else if (existsSync(defaultConfigPath)) {
    try {
      const configContent = readFileSync(defaultConfigPath, 'utf-8');
      fileConfig = JSON.parse(configContent);
      console.error('Loaded config from .linkedin-mcp.json (fallback)');
    } catch (error) {
      console.error('Error reading config file .linkedin-mcp.json:', error);
    }
  } else {
    console.error(`No config file found. Checked: ${configFileName}, .linkedin-mcp.json`);
  }

  // Build configuration with priority
  const config: LinkedInConfig = {
    clientId: fileConfig.clientId || process.env.LINKEDIN_CLIENT_ID || '',
    clientSecret: fileConfig.clientSecret || process.env.LINKEDIN_CLIENT_SECRET || '',
    redirectUri: fileConfig.redirectUri || process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3000/callback',
    scope: fileConfig.scope || process.env.LINKEDIN_SCOPE || 'openid profile email w_member_social',
    accessToken: fileConfig.accessToken || process.env.LINKEDIN_ACCESS_TOKEN,
    refreshToken: fileConfig.refreshToken || process.env.LINKEDIN_REFRESH_TOKEN,
    expiresAt: fileConfig.expiresAt ? Number(fileConfig.expiresAt) : 
               process.env.LINKEDIN_EXPIRES_AT ? Number(process.env.LINKEDIN_EXPIRES_AT) : undefined,
  };

  // Validate required fields for authentication
  if (!config.clientId || !config.clientSecret) {
    console.error('Warning: LinkedIn client_id and client_secret are required for authentication.');
    console.error('Please configure them in .linkedin-mcp.json or via environment variables:');
    console.error('  LINKEDIN_CLIENT_ID');
    console.error('  LINKEDIN_CLIENT_SECRET');
  }

  return config;
}

/**
 * Save updated configuration (primarily for tokens)
 * @param updates Partial configuration to update
 */
export function saveConfig(updates: Partial<LinkedInConfig>): void {
  // Use the same config file resolution logic as loadConfig
  const mcpServerName = process.env.MCP_SERVER_NAME || 'linkedin-mcp';
  const configFileName = `.${mcpServerName}.json`;
  const configPath = join(process.cwd(), configFileName);
  const defaultConfigPath = join(process.cwd(), '.linkedin-mcp.json');
  
  // Determine which config file to save to
  const saveToPath = existsSync(configPath) ? configPath : 
                     existsSync(defaultConfigPath) ? defaultConfigPath : 
                     configPath; // Use instance-specific path for new configs
  
  let currentConfig: Partial<LinkedInConfig> = {};

  // Read existing config
  if (existsSync(saveToPath)) {
    try {
      const configContent = readFileSync(saveToPath, 'utf-8');
      currentConfig = JSON.parse(configContent);
    } catch (error) {
      console.error('Error reading config file:', error);
    }
  }

  // Merge updates
  const newConfig = { ...currentConfig, ...updates };

  // Write back
  try {
    const fs = require('fs');
    fs.writeFileSync(saveToPath, JSON.stringify(newConfig, null, 2));
    console.error(`Config saved to ${saveToPath}`);
  } catch (error) {
    console.error('Error saving config file:', error);
  }
}