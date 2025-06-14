import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { config as dotenvConfig } from 'dotenv';
// Load .env file if it exists
dotenvConfig();
/**
 * Load configuration from multiple sources
 * Priority: local config file > environment variables > defaults
 * @returns LinkedInConfig object
 */
export function loadConfig() {
    // Check for local config file
    const configPath = join(process.cwd(), '.linkedin-mcp.json');
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
export function saveConfig(updates) {
    const configPath = join(process.cwd(), '.linkedin-mcp.json');
    let currentConfig = {};
    // Read existing config
    if (existsSync(configPath)) {
        try {
            const configContent = readFileSync(configPath, 'utf-8');
            currentConfig = JSON.parse(configContent);
        }
        catch (error) {
            console.error('Error reading config file:', error);
        }
    }
    // Merge updates
    const newConfig = { ...currentConfig, ...updates };
    // Write back
    try {
        const fs = require('fs');
        fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
    }
    catch (error) {
        console.error('Error saving config file:', error);
    }
}
//# sourceMappingURL=config-loader.js.map