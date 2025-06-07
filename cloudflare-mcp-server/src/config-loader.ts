import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface CloudflareConfig {
  apiToken?: string;
  apiKey?: string;
  email?: string;
  accountId?: string;
  zoneId?: string;
  baseUrl?: string;
  timeout?: number;
}

/**
 * Loads Cloudflare configuration from multiple sources
 * Priority: local config file > environment variables > defaults
 */
export function loadConfig(): CloudflareConfig {
  // Check for local config file
  const configPath = join(process.cwd(), '.cloudflare-mcp.json');
  let fileConfig: CloudflareConfig = {};
  
  if (existsSync(configPath)) {
    try {
      const configData = readFileSync(configPath, 'utf-8');
      fileConfig = JSON.parse(configData);
      console.error('Loaded config from .cloudflare-mcp.json');
    } catch (error) {
      console.error('Error reading config file:', error);
    }
  }

  // Build configuration with precedence
  const config: CloudflareConfig = {
    apiToken: fileConfig.apiToken || process.env.CLOUDFLARE_API_TOKEN,
    apiKey: fileConfig.apiKey || process.env.CLOUDFLARE_API_KEY,
    email: fileConfig.email || process.env.CLOUDFLARE_EMAIL,
    accountId: fileConfig.accountId || process.env.CLOUDFLARE_ACCOUNT_ID,
    zoneId: fileConfig.zoneId || process.env.CLOUDFLARE_ZONE_ID,
    baseUrl: fileConfig.baseUrl || process.env.CLOUDFLARE_BASE_URL || 'https://api.cloudflare.com/client/v4',
    timeout: fileConfig.timeout || parseInt(process.env.CLOUDFLARE_TIMEOUT || '30000')
  };

  // Validate configuration
  const hasToken = !!config.apiToken;
  const hasApiKey = !!(config.apiKey && config.email);

  if (!hasToken && !hasApiKey) {
    throw new Error('Cloudflare authentication not configured. Provide either apiToken or apiKey+email');
  }

  if (hasToken && hasApiKey) {
    console.error('Both API token and API key provided. API token will be used.');
  }

  return config;
}