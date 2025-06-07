# MCP Server Scopes Guide

This guide explains the different scope options available when installing and managing Model Context Protocol (MCP) servers using the `-s` flag.

## Overview

MCP servers can be installed at different scope levels, which determines where the server configuration is stored and who can access it. The scope is specified using the `-s` or `--scope` flag during installation.

## Available Scopes

### 1. Local Scope (Default)
**Flag:** `-s local` or `--scope local`

The local scope installs the MCP server configuration in the current project directory. This is the default scope when no `-s` flag is specified.

**Configuration Location:**
- `.claude/claude_desktop_config.json` (in the current directory)

**Use Cases:**
- Project-specific MCP servers
- When different projects need different server configurations
- Testing and development of MCP servers
- Isolated environments

**Example:**
```bash
# Install PocketBase MCP server for current project only
npx -y @pocketbase/mcp-server init -s local

# Or without the flag (local is default)
npx -y @pocketbase/mcp-server init
```

### 2. User Scope
**Flag:** `-s user` or `--scope user`

The user scope installs the MCP server configuration globally for the current user, making it available across all projects.

**Configuration Location:**
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

**Use Cases:**
- MCP servers you want available in all projects
- General-purpose tools and utilities
- Personal productivity servers
- Avoiding repeated installations

**Example:**
```bash
# Install PostgreSQL MCP server globally for user
npx -y @postgresql/mcp-server init -s user
```

### 3. Project Scope
**Flag:** `-s project` or `--scope project`

The project scope is similar to local scope but specifically indicates that the configuration should be treated as part of the project's shared configuration.

**Configuration Location:**
- `.claude/claude_desktop_config.json` (in the project root)

**Use Cases:**
- Team projects where all developers need the same MCP servers
- When the MCP configuration should be committed to version control
- Ensuring consistent development environments

**Example:**
```bash
# Install Redis MCP server as part of project configuration
npx -y @redis/mcp-server init -s project
```

## Scope Precedence

When Claude Desktop starts, it loads MCP server configurations in the following order:

1. **User scope** - Loaded first, available globally
2. **Project/Local scope** - Loaded second, can override user settings

If the same MCP server is configured in multiple scopes, the more specific scope (project/local) takes precedence.

## Best Practices

### When to Use Local/Project Scope
- **Project-specific databases**: If your project uses a specific database instance
- **Custom configurations**: When server settings are unique to the project
- **Team collaboration**: Share MCP configurations with your team via version control
- **Testing**: Isolate experimental servers to specific projects

### When to Use User Scope
- **General utilities**: File system tools, general-purpose databases
- **Personal tools**: Your preferred development servers
- **Cross-project resources**: Servers that connect to shared resources
- **Convenience**: Avoid reinstalling common servers for each project

## Managing Scopes

### Checking Current Configuration
To see which MCP servers are installed at each scope:

```bash
# Check local/project scope
cat .claude/claude_desktop_config.json

# Check user scope (macOS)
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

### Removing MCP Servers
To remove an MCP server, edit the appropriate configuration file and remove the server entry from the `mcpServers` object.

### Moving Between Scopes
To move an MCP server from one scope to another:
1. Copy the server configuration from the source config file
2. Paste it into the destination config file
3. Remove it from the source config file
4. Restart Claude Desktop

## Examples

### Example 1: Development Environment Setup
```bash
# Install project-specific database server
npx -y @postgresql/mcp-server init -s project

# Install general file system utilities globally
npx -y @cloudflare/mcp-server-filesystem init -s user
```

### Example 2: Team Project Configuration
```bash
# All team members need these servers
npx -y @pocketbase/mcp-server init -s project
npx -y @redis/mcp-server init -s project

# Commit the configuration
git add .claude/claude_desktop_config.json
git commit -m "Add required MCP servers for project"
```

### Example 3: Personal Development Setup
```bash
# Install your preferred tools globally
npx -y @sqlite/mcp-server init -s user
npx -y @github/mcp-server init -s user
npx -y @google-drive/mcp-server init -s user
```

## Configuration File Structure

Both scope types use the same configuration structure:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["/path/to/server/index.js"],
      "env": {
        "SERVER_URL": "http://localhost:8080",
        "API_KEY": "your-api-key"
      }
    }
  }
}
```

## Troubleshooting

### Server Not Loading
1. Check if Claude Desktop is reading from the correct scope
2. Verify the configuration file exists in the expected location
3. Ensure the JSON syntax is valid
4. Restart Claude Desktop after configuration changes

### Scope Conflicts
If a server behaves unexpectedly:
1. Check if it's defined in multiple scopes
2. Remember that project/local scope overrides user scope
3. Remove duplicate configurations if needed

### Path Issues
- Local/Project scope paths are relative to the config file location
- User scope paths should be absolute
- Use appropriate path separators for your OS

## Security Considerations

### Local/Project Scope
- Configuration may be committed to version control
- Avoid hardcoding sensitive credentials
- Use environment variables for secrets

### User Scope
- Configuration is private to your user account
- Still avoid storing sensitive data directly
- Consider using credential managers

## Summary

- **Local scope** (`-s local`): Project-specific, stored in `.claude/`
- **User scope** (`-s user`): Global for user, stored in OS-specific location
- **Project scope** (`-s project`): Team-shared, stored in `.claude/`
- Choose scope based on server purpose and sharing needs
- Project/local scope overrides user scope for the same server

Last Updated On: January 6, 2025