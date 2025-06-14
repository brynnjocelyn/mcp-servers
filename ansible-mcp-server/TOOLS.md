# Ansible MCP Server Tools Reference

This document provides detailed information about all available tools in the Ansible MCP Server.

## Table of Contents

- [Playbook Execution](#playbook-execution)
- [Ad-hoc Commands](#ad-hoc-commands)
- [Inventory Management](#inventory-management)
- [Playbook Management](#playbook-management)
- [Execution History](#execution-history)
- [Vault Operations](#vault-operations)
- [Galaxy Operations](#galaxy-operations)
- [Proxmox Integration](#proxmox-integration)

## Playbook Execution

### run_playbook
Execute an Ansible playbook with full option support and execution tracking.

**Parameters:**
- `playbook` (string, required): Path to the playbook file
- `inventory` (string, optional): Inventory file or host pattern
- `limit` (string, optional): Limit execution to specific hosts
- `tags` (string, optional): Only run plays and tasks tagged with these values
- `skipTags` (string, optional): Skip plays and tasks tagged with these values
- `extraVars` (object, optional): Additional variables as key-value pairs
- `become` (boolean, optional): Run operations with become (sudo)
- `checkMode` (boolean, optional): Run in check mode (dry run)
- `verbose` (number, optional): Verbosity level (0-4)

**Returns:**
- Execution status (success/failed)
- Exit code
- Duration in milliseconds
- Run ID for history tracking
- Full stdout and stderr output

**Examples:**

Basic playbook execution:
```json
{
  "tool": "run_playbook",
  "arguments": {
    "playbook": "playbooks/site.yml",
    "inventory": "inventory/production"
  }
}
```

Deploy with specific tags and limit:
```json
{
  "tool": "run_playbook",
  "arguments": {
    "playbook": "playbooks/deploy-app.yml",
    "inventory": "inventory/production",
    "limit": "webservers",
    "tags": "deploy,config",
    "extraVars": {
      "app_version": "2.1.0",
      "environment": "production"
    }
  }
}
```

Dry run with verbosity:
```json
{
  "tool": "run_playbook",
  "arguments": {
    "playbook": "playbooks/update-systems.yml",
    "checkMode": true,
    "verbose": 2,
    "become": true
  }
}
```

### check_syntax
Validate playbook syntax without executing.

**Parameters:**
- `playbook` (string, required): Path to playbook to check
- `inventory` (string, optional): Inventory file (some syntax checks need inventory)

**Returns:**
- Syntax check result (passed/failed)
- Error details if syntax issues found

**Example:**
```json
{
  "tool": "check_syntax",
  "arguments": {
    "playbook": "playbooks/new-playbook.yml",
    "inventory": "inventory/staging"
  }
}
```

## Ad-hoc Commands

### run_command
Execute ad-hoc Ansible commands on hosts.

**Parameters:**
- `pattern` (string, required): Host pattern (e.g., "all", "webservers", "db*")
- `module` (string, required): Ansible module to execute
- `args` (string, optional): Module arguments
- `inventory` (string, optional): Inventory file
- `become` (boolean, optional): Run operations with become
- `verbose` (number, optional): Verbosity level (0-4)

**Common Modules:**
- `ping`: Test connectivity
- `shell`: Execute shell commands
- `command`: Execute commands (safer than shell)
- `apt`/`yum`: Package management
- `systemd`: Service management
- `file`: File operations
- `copy`: Copy files
- `template`: Template files
- `user`: User management
- `group`: Group management

**Examples:**

Test connectivity:
```json
{
  "tool": "run_command",
  "arguments": {
    "pattern": "all",
    "module": "ping"
  }
}
```

Update packages:
```json
{
  "tool": "run_command",
  "arguments": {
    "pattern": "containers",
    "module": "apt",
    "args": "update_cache=yes upgrade=dist",
    "become": true
  }
}
```

Restart service:
```json
{
  "tool": "run_command",
  "arguments": {
    "pattern": "webservers",
    "module": "systemd",
    "args": "name=nginx state=restarted",
    "become": true
  }
}
```

## Inventory Management

### get_inventory
Retrieve current Ansible inventory information.

**Parameters:**
- `inventory` (string, optional): Inventory file path
- `host` (string, optional): Get variables for specific host
- `graph` (boolean, optional): Show inventory as graph
- `vars` (boolean, optional): Include variables in graph output

**Returns:**
- JSON inventory data or graph representation

**Examples:**

Get full inventory:
```json
{
  "tool": "get_inventory",
  "arguments": {
    "inventory": "inventory/production"
  }
}
```

Get host variables:
```json
{
  "tool": "get_inventory",
  "arguments": {
    "host": "web01"
  }
}
```

Show inventory graph:
```json
{
  "tool": "get_inventory",
  "arguments": {
    "graph": true,
    "vars": true
  }
}
```

### add_host
Add a host to the inventory database.

**Parameters:**
- `hostname` (string, required): Hostname
- `group` (string, required): Group name
- `ansibleHost` (string, optional): IP address or FQDN
- `ansiblePort` (number, optional): SSH port (default: 22)
- `ansibleUser` (string, optional): SSH user
- `variables` (object, optional): Additional host variables
- `isContainer` (boolean, optional): Is this a container?
- `proxmoxNode` (string, optional): Proxmox node name
- `proxmoxVmid` (number, optional): Proxmox VM/CT ID

**Example:**
```json
{
  "tool": "add_host",
  "arguments": {
    "hostname": "web01",
    "group": "webservers",
    "ansibleHost": "10.0.0.10",
    "ansibleUser": "ansible",
    "variables": {
      "http_port": 80,
      "max_clients": 200
    },
    "isContainer": true,
    "proxmoxNode": "pve01",
    "proxmoxVmid": 101
  }
}
```

### update_host
Update existing host information.

**Parameters:**
- `hostname` (string, required): Hostname to update
- `enabled` (boolean, optional): Enable/disable host
- `variables` (object, optional): Update host variables
- `group` (string, optional): Move to different group

**Examples:**

Disable host for maintenance:
```json
{
  "tool": "update_host",
  "arguments": {
    "hostname": "web01",
    "enabled": false
  }
}
```

Update host variables:
```json
{
  "tool": "update_host",
  "arguments": {
    "hostname": "web01",
    "variables": {
      "max_clients": 500,
      "environment": "production"
    }
  }
}
```

### get_hosts
Retrieve hosts from inventory database.

**Parameters:**
- `group` (string, optional): Filter by group
- `enabled` (boolean, optional): Show enabled/disabled hosts (default: true)
- `containers` (boolean, optional): Show only containers

**Examples:**

Get all webservers:
```json
{
  "tool": "get_hosts",
  "arguments": {
    "group": "webservers"
  }
}
```

Get all containers:
```json
{
  "tool": "get_hosts",
  "arguments": {
    "containers": true
  }
}
```

Get disabled hosts:
```json
{
  "tool": "get_hosts",
  "arguments": {
    "enabled": false
  }
}
```

### generate_inventory
Generate inventory file from database.

**Parameters:**
- `format` (string, optional): Output format - "json", "yaml", "ini" (default: "json")
- `outputFile` (string, optional): Save to file instead of returning

**Examples:**

Generate YAML inventory:
```json
{
  "tool": "generate_inventory",
  "arguments": {
    "format": "yaml",
    "outputFile": "inventory/dynamic.yml"
  }
}
```

Generate INI format:
```json
{
  "tool": "generate_inventory",
  "arguments": {
    "format": "ini"
  }
}
```

## Playbook Management

### scan_playbooks
Scan directory for Ansible playbooks and register them.

**Parameters:**
- `directory` (string, optional): Directory to scan (default: configured playbooks path)

**Returns:**
- List of found playbooks with metadata
- Automatically registers playbooks in database

**Example:**
```json
{
  "tool": "scan_playbooks",
  "arguments": {
    "directory": "./playbooks"
  }
}
```

### register_playbook
Manually register a playbook in the database.

**Parameters:**
- `name` (string, required): Playbook name
- `path` (string, required): Path to playbook file
- `description` (string, optional): Playbook description
- `category` (string, optional): Category for organization
- `tags` (array[string], optional): Playbook tags
- `requiresVault` (boolean, optional): Does this playbook require vault?

**Example:**
```json
{
  "tool": "register_playbook",
  "arguments": {
    "name": "deploy-webapp",
    "path": "playbooks/applications/deploy-webapp.yml",
    "description": "Deploy web application with rolling updates",
    "category": "applications",
    "tags": ["deploy", "webapp", "production"],
    "requiresVault": true
  }
}
```

### get_playbooks
Get registered playbooks from database.

**Parameters:**
- `category` (string, optional): Filter by category

**Returns:**
- List of playbooks with metadata including:
  - Name and path
  - Description and category
  - Tags
  - Vault requirements
  - Last run time
  - Run count
  - Average duration

**Examples:**

Get all playbooks:
```json
{
  "tool": "get_playbooks",
  "arguments": {}
}
```

Get playbooks by category:
```json
{
  "tool": "get_playbooks",
  "arguments": {
    "category": "maintenance"
  }
}
```

## Execution History

### get_runs
Get playbook execution history.

**Parameters:**
- `limit` (number, optional): Number of runs to retrieve (default: 10)
- `status` (string, optional): Filter by status - "running", "success", "failed", "cancelled"
- `playbook` (string, optional): Filter by playbook name

**Returns:**
- List of execution records with:
  - Run ID
  - Playbook name
  - Inventory used
  - Start and end times
  - Status and exit code
  - Tags and limits used
  - Check mode flag

**Examples:**

Get recent runs:
```json
{
  "tool": "get_runs",
  "arguments": {
    "limit": 20
  }
}
```

Get failed runs:
```json
{
  "tool": "get_runs",
  "arguments": {
    "status": "failed",
    "limit": 5
  }
}
```

### get_run_details
Get detailed information about a specific run.

**Parameters:**
- `runId` (number, required): Run ID

**Returns:**
- Complete run record including:
  - All metadata
  - Full stdout output
  - Full stderr output
  - Extra variables used

**Example:**
```json
{
  "tool": "get_run_details",
  "arguments": {
    "runId": 42
  }
}
```

## Vault Operations

### vault_encrypt
Encrypt content using Ansible Vault.

**Parameters:**
- `content` (string, required): Content to encrypt
- `vaultPasswordFile` (string, optional): Path to vault password file

**Returns:**
- Encrypted content in Ansible Vault format

**Example:**
```json
{
  "tool": "vault_encrypt",
  "arguments": {
    "content": "supersecretpassword123",
    "vaultPasswordFile": "./.vault_pass"
  }
}
```

### vault_decrypt
Decrypt Ansible Vault encrypted content.

**Parameters:**
- `content` (string, required): Encrypted content
- `vaultPasswordFile` (string, optional): Path to vault password file

**Returns:**
- Decrypted plaintext content

**Example:**
```json
{
  "tool": "vault_decrypt",
  "arguments": {
    "content": "$ANSIBLE_VAULT;1.1;AES256\n3633363435646...",
    "vaultPasswordFile": "./.vault_pass"
  }
}
```

## Galaxy Operations

### install_requirements
Install Ansible Galaxy requirements (roles or collections).

**Parameters:**
- `requirementsFile` (string, required): Path to requirements file
- `type` (string, optional): Type of requirements - "role" or "collection" (default: "role")

**Returns:**
- Installation result with output

**Examples:**

Install roles:
```json
{
  "tool": "install_requirements",
  "arguments": {
    "requirementsFile": "requirements.yml",
    "type": "role"
  }
}
```

Install collections:
```json
{
  "tool": "install_requirements",
  "arguments": {
    "requirementsFile": "collections/requirements.yml",
    "type": "collection"
  }
}
```

## Proxmox Integration

### import_proxmox_inventory
Import Proxmox VMs and containers into inventory.

**Parameters:**
- `proxmoxHosts` (array[object], required): Array of Proxmox hosts to import
  - `hostname` (string): Hostname
  - `ip` (string): IP address
  - `type` (string): "lxc" or "qemu"
  - `node` (string): Proxmox node name
  - `vmid` (number): VM/Container ID
  - `status` (string, optional): Current status
  - `ostype` (string, optional): OS type
- `defaultGroup` (string, optional): Default group name (default: "proxmox")
- `groupByNode` (boolean, optional): Create groups by Proxmox node
- `groupByType` (boolean, optional): Create groups by type (containers/vms)

**Example:**
```json
{
  "tool": "import_proxmox_inventory",
  "arguments": {
    "proxmoxHosts": [
      {
        "hostname": "web01",
        "ip": "10.0.0.10",
        "type": "lxc",
        "node": "pve01",
        "vmid": 101,
        "status": "running",
        "ostype": "ubuntu"
      },
      {
        "hostname": "db01",
        "ip": "10.0.0.20",
        "type": "qemu",
        "node": "pve01",
        "vmid": 201,
        "status": "running",
        "ostype": "debian"
      }
    ],
    "groupByType": true
  }
}
```

## Common Patterns and Examples

### Full Deployment Workflow

1. Check syntax:
```json
{
  "tool": "check_syntax",
  "arguments": {
    "playbook": "playbooks/deploy-app.yml"
  }
}
```

2. Dry run:
```json
{
  "tool": "run_playbook",
  "arguments": {
    "playbook": "playbooks/deploy-app.yml",
    "inventory": "inventory/staging",
    "checkMode": true,
    "verbose": 1
  }
}
```

3. Deploy:
```json
{
  "tool": "run_playbook",
  "arguments": {
    "playbook": "playbooks/deploy-app.yml",
    "inventory": "inventory/production",
    "limit": "webservers[0:2]",
    "extraVars": {
      "version": "2.1.0"
    }
  }
}
```

4. Check status:
```json
{
  "tool": "get_runs",
  "arguments": {
    "limit": 1
  }
}
```

### Proxmox Management Workflow

1. Import inventory:
```json
{
  "tool": "import_proxmox_inventory",
  "arguments": {
    "proxmoxHosts": [...],
    "groupByNode": true
  }
}
```

2. Test connectivity:
```json
{
  "tool": "run_command",
  "arguments": {
    "pattern": "node_pve01",
    "module": "ping"
  }
}
```

3. Update containers:
```json
{
  "tool": "run_command",
  "arguments": {
    "pattern": "containers",
    "module": "apt",
    "args": "update_cache=yes upgrade=safe",
    "become": true
  }
}
```

### Secure Variable Management

1. Encrypt password:
```json
{
  "tool": "vault_encrypt",
  "arguments": {
    "content": "MyDatabasePassword123"
  }
}
```

2. Add to host:
```json
{
  "tool": "update_host",
  "arguments": {
    "hostname": "db01",
    "variables": {
      "db_password": "$ANSIBLE_VAULT;1.1;AES256..."
    }
  }
}
```

3. Run playbook:
```json
{
  "tool": "run_playbook",
  "arguments": {
    "playbook": "playbooks/configure-database.yml",
    "limit": "db01",
    "vaultPasswordFile": "./.vault_pass"
  }
}
```

Last Updated On: 2025-06-07