# Ansible MCP Server

A Model Context Protocol (MCP) server for Ansible automation. Manage playbooks, inventories, and orchestrate infrastructure with comprehensive tracking and Proxmox integration.

## Features

- **Playbook Execution**: Run playbooks with full option support and execution tracking
- **Inventory Management**: Dynamic inventory with database backend
- **Ad-hoc Commands**: Execute Ansible modules on any host pattern  
- **Execution History**: Track all runs with detailed logging
- **Playbook Library**: Organize and categorize playbooks
- **Vault Integration**: Encrypt/decrypt sensitive data
- **Galaxy Support**: Install roles and collections
- **Proxmox Integration**: Import and manage Proxmox VMs/containers
- **Syntax Checking**: Validate playbooks before execution
- **Dynamic Inventory Generation**: Export inventory in multiple formats

## Prerequisites

- Node.js 18 or higher
- Ansible 2.9+ installed and accessible
- Python 3.x (for Ansible)
- SSH access to managed hosts
- Optional: Proxmox VE for container/VM management

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mcp-servers.git
cd mcp-servers/ansible-mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Build the TypeScript code:
```bash
npm run build
```

4. Make the server executable:
```bash
chmod +x dist/mcp-server.js
```

## Multiple Instance Support

The Ansible MCP server supports running multiple instances with different configurations by using the `MCP_SERVER_NAME` environment variable. This enables you to manage multiple Ansible environments or use different configurations for different infrastructure setups.

### Instance-Specific Configuration

When `MCP_SERVER_NAME` is set, the server will look for a configuration file named `.{MCP_SERVER_NAME}-ansible-mcp.json` instead of the default `.ansible-mcp.json`.

**Example: Multiple Ansible Environments**
```bash
# Development environment
export MCP_SERVER_NAME=dev
# Uses: .dev-ansible-mcp.json

# Production environment
export MCP_SERVER_NAME=prod
# Uses: .prod-ansible-mcp.json

# Staging environment
export MCP_SERVER_NAME=staging
# Uses: .staging-ansible-mcp.json
```

### Configuration File Resolution

The server resolves configuration in this order:
1. **Instance-specific config**: `.{MCP_SERVER_NAME}-ansible-mcp.json` (if MCP_SERVER_NAME is set)
2. **Default config file**: `.ansible-mcp.json`
3. **Environment variables**
4. **Default values**

### Benefits of Multiple Instances

- **Multi-environment**: Separate dev, staging, and production Ansible setups
- **Infrastructure isolation**: Different configurations for different client environments
- **Team collaboration**: Team members with different Ansible access levels
- **Project separation**: Different projects with different inventory and playbook structures
- **Claude Code**: Perfect for managing multiple infrastructure projects

### Example: Multiple Ansible Environments

**.dev-ansible-mcp.json** (Development):
```json
{
  "inventoryPath": "./dev-inventory",
  "playbooksPath": "./dev-playbooks",
  "rolesPath": "./roles",
  "remoteUser": "devuser",
  "becomeMethod": "sudo",
  "forks": 5,
  "dbPath": "./dev-ansible-mcp.db"
}
```

**.prod-ansible-mcp.json** (Production):
```json
{
  "inventoryPath": "./prod-inventory",
  "playbooksPath": "./prod-playbooks",
  "rolesPath": "./roles",
  "vaultPasswordFile": "./.prod_vault_pass",
  "remoteUser": "ansible",
  "becomeMethod": "sudo",
  "forks": 20,
  "dbPath": "./prod-ansible-mcp.db"
}
```

### Claude Code Usage

With Claude Code, you can easily switch between Ansible environments:

```bash
# Work with development environment
MCP_SERVER_NAME=dev claude-code "Run deployment playbook on dev servers"

# Work with production environment
MCP_SERVER_NAME=prod claude-code "Check status of production infrastructure"

# Work with staging
MCP_SERVER_NAME=staging claude-code "Deploy and test new application version"

# Default environment
claude-code "List all available playbooks and their descriptions"
```

### Claude Desktop Integration

For Claude Desktop, configure multiple Ansible servers:

```json
{
  "mcpServers": {
    "ansible-dev": {
      "command": "/path/to/ansible-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "MCP_SERVER_NAME": "dev"
      }
    },
    "ansible-prod": {
      "command": "/path/to/ansible-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "MCP_SERVER_NAME": "prod"
      }
    },
    "ansible-staging": {
      "command": "/path/to/ansible-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "MCP_SERVER_NAME": "staging"
      }
    },
    "ansible": {
      "command": "/path/to/ansible-mcp-server/dist/mcp-server.js",
      "args": []
    }
  }
}
```

## Configuration

### Method 1: Configuration File (Recommended)

Create `.ansible-mcp.json` in your project directory:

```json
{
  "inventoryPath": "./inventory",
  "playbooksPath": "./playbooks",
  "rolesPath": "./roles",
  "vaultPasswordFile": "./.vault_pass",
  "privateKeyFile": "~/.ssh/id_rsa",
  "remoteUser": "ansible",
  "becomeMethod": "sudo",
  "becomeUser": "root",
  "forks": 10,
  "timeout": 30,
  "hostKeyChecking": false,
  "dbPath": "./ansible-mcp.db",
  "proxmoxDefaults": {
    "apiHost": "proxmox.example.com",
    "apiUser": "ansible@pve",
    "apiTokenId": "ansible",
    "apiTokenSecret": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "verifySsl": true
  }
}
```

### Method 2: Environment Variables

```bash
export ANSIBLE_INVENTORY=./inventory
export ANSIBLE_PLAYBOOKS_PATH=./playbooks
export ANSIBLE_ROLES_PATH=./roles
export ANSIBLE_VAULT_PASSWORD_FILE=./.vault_pass
export ANSIBLE_PRIVATE_KEY_FILE=~/.ssh/id_rsa
export ANSIBLE_REMOTE_USER=ansible
export ANSIBLE_BECOME_METHOD=sudo
export ANSIBLE_BECOME_USER=root
export ANSIBLE_FORKS=10
export ANSIBLE_HOST_KEY_CHECKING=false
export ANSIBLE_MCP_DB_PATH=./ansible-mcp.db
```

### Directory Structure

Recommended project structure:
```
ansible-project/
├── .ansible-mcp.json      # MCP configuration
├── .vault_pass           # Vault password file (git-ignored)
├── ansible.cfg           # Ansible configuration
├── inventory/            # Inventory files
│   ├── hosts.yml
│   └── group_vars/
├── playbooks/            # Playbook library
│   ├── infrastructure/
│   ├── applications/
│   └── maintenance/
├── roles/               # Ansible roles
├── collections/         # Ansible collections
└── ansible-mcp.db      # MCP database (auto-created)
```

## Claude Desktop Integration

Add to your Claude Desktop configuration:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "ansible": {
      "command": "/path/to/ansible-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "ANSIBLE_INVENTORY": "/path/to/inventory",
        "ANSIBLE_PLAYBOOKS_PATH": "/path/to/playbooks"
      }
    }
  }
}
```

## Available Tools

### Playbook Execution

#### run_playbook
Execute an Ansible playbook with options.

**Parameters:**
- `playbook` (required): Path to the playbook file
- `inventory` (optional): Inventory file or host pattern
- `limit` (optional): Limit execution to specific hosts
- `tags` (optional): Only run plays and tasks tagged with these values
- `skipTags` (optional): Skip plays and tasks tagged with these values
- `extraVars` (optional): Additional variables as key-value pairs
- `become` (optional): Run operations with become
- `checkMode` (optional): Run in check mode (dry run)
- `verbose` (optional): Verbosity level (0-4)

**Example:**
```
Run the playbook playbooks/deploy-app.yml on production servers with tag "webapp"
```

#### run_command
Execute ad-hoc Ansible commands.

**Parameters:**
- `pattern` (required): Host pattern (e.g., "all", "webservers")
- `module` (required): Ansible module (e.g., "ping", "shell", "apt")
- `args` (optional): Module arguments
- `inventory` (optional): Inventory file
- `become` (optional): Run with become
- `verbose` (optional): Verbosity level (0-4)

**Example:**
```
Run "apt update" on all Ubuntu containers using the apt module
```

#### check_syntax
Validate playbook syntax without execution.

**Parameters:**
- `playbook` (required): Path to playbook
- `inventory` (optional): Inventory file

**Example:**
```
Check syntax of playbooks/site.yml
```

### Inventory Management

#### get_inventory
Retrieve current Ansible inventory.

**Parameters:**
- `inventory` (optional): Inventory file path
- `host` (optional): Get variables for specific host
- `graph` (optional): Show as graph
- `vars` (optional): Include variables

**Example:**
```
Show the inventory graph with all variables
```

#### add_host
Add a host to the inventory database.

**Parameters:**
- `hostname` (required): Hostname
- `group` (required): Group name
- `ansibleHost` (optional): IP address or FQDN
- `ansiblePort` (optional): SSH port
- `ansibleUser` (optional): SSH user
- `variables` (optional): Additional host variables
- `isContainer` (optional): Is this a container?
- `proxmoxNode` (optional): Proxmox node name
- `proxmoxVmid` (optional): Proxmox VM/CT ID

**Example:**
```
Add host "web01" to group "webservers" with IP 10.0.0.10
```

#### update_host
Update host information.

**Parameters:**
- `hostname` (required): Hostname to update
- `enabled` (optional): Enable/disable host
- `variables` (optional): Update variables
- `group` (optional): Move to different group

**Example:**
```
Disable host "web01" for maintenance
```

#### get_hosts
Retrieve hosts from inventory database.

**Parameters:**
- `group` (optional): Filter by group
- `enabled` (optional): Show enabled/disabled hosts
- `containers` (optional): Show only containers

**Example:**
```
Get all enabled containers
```

#### generate_inventory
Generate inventory file from database.

**Parameters:**
- `format` (optional): Output format (json, yaml, ini)
- `outputFile` (optional): Save to file

**Example:**
```
Generate inventory in YAML format and save to inventory/dynamic.yml
```

### Playbook Management

#### scan_playbooks
Scan directory for Ansible playbooks.

**Parameters:**
- `directory` (optional): Directory to scan

**Example:**
```
Scan the playbooks directory and register all playbooks
```

#### register_playbook
Register a playbook in the database.

**Parameters:**
- `name` (required): Playbook name
- `path` (required): Path to playbook
- `description` (optional): Description
- `category` (optional): Category
- `tags` (optional): Playbook tags
- `requiresVault` (optional): Requires vault?

**Example:**
```
Register playbook "deploy-webapp" in category "applications"
```

#### get_playbooks
Get registered playbooks.

**Parameters:**
- `category` (optional): Filter by category

**Example:**
```
Get all playbooks in the "maintenance" category
```

### Execution History

#### get_runs
Get playbook execution history.

**Parameters:**
- `limit` (optional): Number of runs (default: 10)
- `status` (optional): Filter by status (running, success, failed, cancelled)
- `playbook` (optional): Filter by playbook name

**Example:**
```
Show the last 5 failed playbook runs
```

#### get_run_details
Get detailed information about a run.

**Parameters:**
- `runId` (required): Run ID

**Example:**
```
Get details for run ID 42
```

### Vault Operations

#### vault_encrypt
Encrypt content using Ansible Vault.

**Parameters:**
- `content` (required): Content to encrypt
- `vaultPasswordFile` (optional): Password file path

**Example:**
```
Encrypt the database password "mySecretPass123"
```

#### vault_decrypt
Decrypt Ansible Vault content.

**Parameters:**
- `content` (required): Encrypted content
- `vaultPasswordFile` (optional): Password file path

**Example:**
```
Decrypt the vault-encrypted string
```

### Galaxy Operations

#### install_requirements
Install Ansible Galaxy requirements.

**Parameters:**
- `requirementsFile` (required): Path to requirements file
- `type` (optional): Type (role or collection)

**Example:**
```
Install requirements from requirements.yml
```

### Proxmox Integration

#### import_proxmox_inventory
Import Proxmox VMs and containers.

**Parameters:**
- `proxmoxHosts` (required): Array of Proxmox hosts
- `defaultGroup` (optional): Default group name
- `groupByNode` (optional): Group by Proxmox node
- `groupByType` (optional): Group by type (containers/vms)

**Example:**
```
Import all Proxmox containers and group them by node
```

## Common Workflows

### Deploy Application to Production

```
1. Check syntax of deploy-app.yml
2. Run deploy-app.yml on production servers with check mode
3. If no issues, run deploy-app.yml on production servers
4. Check execution history for success
```

### Manage Proxmox Infrastructure

```
1. Import Proxmox inventory grouping by type
2. Run ping command on all containers
3. Update all containers using apt module
4. Generate inventory file for backup
```

### Secure Configuration Management

```
1. Encrypt database password with vault
2. Add encrypted password to host variables
3. Run database configuration playbook
4. Check run details for any issues
```

## Database Schema

The MCP server uses SQLite to track:

### Playbook Runs
- Execution history with full output
- Success/failure tracking
- Performance metrics
- Tag and limit tracking

### Inventory Hosts
- Host configuration
- Group membership
- Variables
- Proxmox metadata
- Enable/disable status

### Playbooks
- Playbook registry
- Categories and tags
- Execution statistics
- Vault requirements

## Best Practices

1. **Inventory Organization**
   - Use groups to organize hosts logically
   - Store sensitive variables in vault
   - Keep inventory in version control

2. **Playbook Structure**
   - Organize playbooks by category
   - Use tags for selective execution
   - Always test with check mode first

3. **Security**
   - Use vault for sensitive data
   - Configure SSH keys properly
   - Limit sudo access appropriately

4. **Performance**
   - Adjust forks based on infrastructure
   - Use limits to target specific hosts
   - Monitor execution times

## Troubleshooting

### Common Issues

1. **"Ansible command not found"**
   - Ensure Ansible is installed: `pip install ansible`
   - Check PATH includes Ansible location
   - Set `ansiblePath` in configuration

2. **"Host unreachable"**
   - Verify SSH connectivity
   - Check inventory host variables
   - Ensure SSH keys are configured

3. **"Vault password file not found"**
   - Create vault password file
   - Set correct path in configuration
   - Ensure file permissions (600)

4. **"Permission denied"**
   - Check sudo configuration
   - Verify become settings
   - Ensure user has required permissions

### Debug Mode

Enable verbose output:
```bash
export ANSIBLE_VERBOSITY=4
```

Check MCP database:
```bash
sqlite3 ansible-mcp.db "SELECT * FROM playbook_runs ORDER BY start_time DESC LIMIT 5;"
```

## Integration with Proxmox

The server includes special support for Proxmox environments:

1. **Container Management**
   - Track LXC containers separately
   - Group by node or type
   - Monitor container status

2. **VM Management**
   - Track QEMU VMs
   - Store VM metadata
   - Link to Proxmox node

3. **Bulk Operations**
   - Update all containers
   - Restart VMs by node
   - Backup configuration

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add tests if applicable
4. Submit a pull request

## License

ISC License

## Support

For issues or questions:
- Open an issue on GitHub
- Check Ansible documentation
- Review execution logs in database

Last Updated On: June 14, 2025