import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Load PocketBase configuration from various sources
 */
export function loadPocketBaseUrl(): string {
  // Determine config file name - check for MCP instance name first
  const mcpServerName = process.env.MCP_SERVER_NAME || 'pocketbase-mcp';
  const configFileName = `.${mcpServerName}.json`;
  const configPath = join(process.cwd(), configFileName);
  
  // Fallback to default name if custom name doesn't exist
  const defaultConfigPath = join(process.cwd(), '.pocketbase-mcp.json');
  
  // 1. Check for instance-specific config file in current directory
  if (existsSync(configPath)) {
    try {
      const config = JSON.parse(readFileSync(configPath, 'utf-8'));
      if (config.url) {
        console.error(`Using PocketBase URL from config ${configFileName}: ${config.url}`);
        return config.url;
      }
    } catch (e) {
      console.error(`Error reading config file ${configFileName}:`, e);
    }
  } else if (existsSync(defaultConfigPath)) {
    try {
      const config = JSON.parse(readFileSync(defaultConfigPath, 'utf-8'));
      if (config.url) {
        console.error(`Using PocketBase URL from config .pocketbase-mcp.json (fallback): ${config.url}`);
        return config.url;
      }
    } catch (e) {
      console.error('Error reading config file .pocketbase-mcp.json:', e);
    }
  } else {
    console.error(`No config file found. Checked: ${configFileName}, .pocketbase-mcp.json`);
  }

  // 2. Check environment variables
  const envUrl = process.env.POCKETBASE_URL;
  if (envUrl) {
    console.error(`Using PocketBase URL from environment: ${envUrl}`);
    return envUrl;
  }

  // 3. Default URL
  const defaultUrl = 'http://127.0.0.1:8090';
  console.error(`Using default PocketBase URL: ${defaultUrl}`);
  return defaultUrl;
}