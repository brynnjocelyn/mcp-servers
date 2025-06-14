# Ansible MCP Server Configuration Examples

This document provides various configuration examples for different Ansible automation scenarios.

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

# Client environments
export MCP_SERVER_NAME=client1
# Uses: .client1-ansible-mcp.json
```

### Configuration File Resolution

The server resolves configuration in this order:
1. **Instance-specific config**: `.{MCP_SERVER_NAME}-ansible-mcp.json` (if MCP_SERVER_NAME is set)
2. **Default config file**: `.ansible-mcp.json`
3. **Environment variables**
4. **Default values**

### Benefits of Multiple Instances

- **Multi-environment**: Separate dev, staging, and production Ansible configurations
- **Client isolation**: Different configurations for different client environments
- **Infrastructure separation**: Different inventory and playbook structures per project
- **Team collaboration**: Team members with different access levels and responsibilities
- **Claude Code**: Perfect for managing multiple infrastructure automation projects

## Configuration Methods

The Ansible MCP Server can be configured in multiple ways (in order of precedence):

## Instance-Specific Configuration Examples

**.dev-ansible-mcp.json** (Development):
```json
{
  "inventoryPath": "./dev-inventory",
  "playbooksPath": "./dev-playbooks",
  "rolesPath": "./roles",
  "remoteUser": "devuser",
  "becomeMethod": "sudo",
  "forks": 5,
  "timeout": 60,
  "hostKeyChecking": false,
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
  "privateKeyFile": "~/.ssh/prod_ansible_key",
  "remoteUser": "ansible",
  "becomeMethod": "sudo",
  "becomeUser": "root",
  "forks": 20,
  "timeout": 30,
  "hostKeyChecking": true,
  "dbPath": "./prod-ansible-mcp.db"
}
```

**.client1-ansible-mcp.json** (Client Environment):
```json
{
  "inventoryPath": "./client1-inventory",
  "playbooksPath": "./client1-playbooks",
  "rolesPath": "./shared-roles",
  "vaultPasswordFile": "./.client1_vault_pass",
  "privateKeyFile": "~/.ssh/client1_key",
  "remoteUser": "client1user",
  "forks": 10,
  "dbPath": "./client1-ansible-mcp.db"
}
```

## Basic Configuration Examples

### Minimal Configuration

**.ansible-mcp.json:**
```json
{
  "inventoryPath": "./inventory",
  "playbooksPath": "./playbooks"
}
```

### Standard Configuration

**.ansible-mcp.json:**
```json
{
  "inventoryPath": "./inventory",
  "playbooksPath": "./playbooks",
  "rolesPath": "./roles",
  "vaultPasswordFile": "./.vault_pass",
  "privateKeyFile": "~/.ssh/ansible_key",
  "remoteUser": "ansible",
  "forks": 10,
  "timeout": 30,
  "hostKeyChecking": false,
  "dbPath": "./ansible-mcp.db"
}
```

### Advanced Configuration with Proxmox

**.ansible-mcp.json:**
```json
{
  "ansiblePath": "/usr/local/bin/ansible",
  "pythonPath": "/usr/bin/python3",
  "inventoryPath": "./inventory",
  "playbooksPath": "./playbooks",
  "rolesPath": "./roles:~/.ansible/roles:/usr/share/ansible/roles",
  "vaultPasswordFile": "./.vault_pass",
  "privateKeyFile": "~/.ssh/ansible_ed25519",
  "remoteUser": "ansible",
  "becomeMethod": "sudo",
  "becomeUser": "root",
  "forks": 20,
  "timeout": 60,
  "hostKeyChecking": false,
  "callbackPlugins": ["profile_tasks", "timer"],
  "strategyPlugins": ["free"],
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

## Environment Variable Configuration

```bash
# Basic Ansible settings
export ANSIBLE_PATH=/usr/local/bin/ansible
export PYTHON_PATH=/usr/bin/python3
export ANSIBLE_INVENTORY=./inventory
export ANSIBLE_PLAYBOOKS_PATH=./playbooks
export ANSIBLE_ROLES_PATH=./roles:~/.ansible/roles

# Authentication
export ANSIBLE_VAULT_PASSWORD_FILE=./.vault_pass
export ANSIBLE_PRIVATE_KEY_FILE=~/.ssh/ansible_key
export ANSIBLE_REMOTE_USER=ansible

# Execution settings
export ANSIBLE_BECOME_METHOD=sudo
export ANSIBLE_BECOME_USER=root
export ANSIBLE_FORKS=10
export ANSIBLE_TIMEOUT=30
export ANSIBLE_HOST_KEY_CHECKING=false

# MCP Database
export ANSIBLE_MCP_DB_PATH=./ansible-mcp.db

# Proxmox integration
export PROXMOX_HOST=proxmox.example.com
export PROXMOX_USER=ansible@pve
export PROXMOX_TOKEN_ID=ansible
export PROXMOX_TOKEN_SECRET=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
export PROXMOX_VERIFY_SSL=true
```

## Claude Desktop Configuration Examples

### Basic Setup

```json
{
  "mcpServers": {
    "ansible": {
      "command": "/path/to/ansible-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {}
    }
  }
}
```

### With Environment Variables

```json
{
  "mcpServers": {
    "ansible": {
      "command": "/path/to/ansible-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "ANSIBLE_INVENTORY": "/home/ansible/inventory",
        "ANSIBLE_PLAYBOOKS_PATH": "/home/ansible/playbooks",
        "ANSIBLE_VAULT_PASSWORD_FILE": "/home/ansible/.vault_pass",
        "ANSIBLE_PRIVATE_KEY_FILE": "/home/ansible/.ssh/id_rsa"
      }
    }
  }
}
```

### Multiple Environments

```json
{
  "mcpServers": {
    "ansible-dev": {
      "command": "/path/to/ansible-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "ANSIBLE_INVENTORY": "/ansible/dev/inventory",
        "ANSIBLE_PLAYBOOKS_PATH": "/ansible/dev/playbooks",
        "ANSIBLE_MCP_DB_PATH": "/ansible/dev/ansible-mcp.db"
      }
    },
    "ansible-prod": {
      "command": "/path/to/ansible-mcp-server/dist/mcp-server.js",
      "args": [],
      "env": {
        "ANSIBLE_INVENTORY": "/ansible/prod/inventory",
        "ANSIBLE_PLAYBOOKS_PATH": "/ansible/prod/playbooks",
        "ANSIBLE_MCP_DB_PATH": "/ansible/prod/ansible-mcp.db",
        "ANSIBLE_VAULT_PASSWORD_FILE": "/ansible/prod/.vault_pass"
      }
    }
  }
}
```

## Use Case Configurations

### Home Lab with Proxmox

**.ansible-mcp.json:**
```json
{
  "inventoryPath": "./inventory",
  "playbooksPath": "./playbooks",
  "rolesPath": "./roles",
  "remoteUser": "root",
  "forks": 5,
  "hostKeyChecking": false,
  "dbPath": "./homelab.db",
  "proxmoxDefaults": {
    "apiHost": "192.168.1.10",
    "apiUser": "root@pam",
    "apiTokenId": "ansible",
    "apiTokenSecret": "your-token-here",
    "verifySsl": false
  }
}
```

### Enterprise Infrastructure

**.ansible-mcp.json:**
```json
{
  "ansiblePath": "/opt/ansible/bin/ansible",
  "inventoryPath": "./inventory/production",
  "playbooksPath": "./playbooks",
  "rolesPath": "./roles:./vendor/roles",
  "vaultPasswordFile": "/secure/vault/ansible_vault_pass",
  "privateKeyFile": "/secure/keys/ansible_deploy_key",
  "remoteUser": "svc_ansible",
  "becomeMethod": "sudo",
  "becomeUser": "root",
  "forks": 50,
  "timeout": 300,
  "hostKeyChecking": true,
  "callbackPlugins": ["profile_tasks", "timer", "log_plays"],
  "strategyPlugins": ["mitogen_linear"],
  "dbPath": "/var/lib/ansible-mcp/production.db"
}
```

### Development Environment

**.ansible-mcp.json:**
```json
{
  "inventoryPath": "./inventory/dev",
  "playbooksPath": "./playbooks",
  "rolesPath": "./roles:./test-roles",
  "remoteUser": "vagrant",
  "privateKeyFile": "./.vagrant/machines/default/virtualbox/private_key",
  "hostKeyChecking": false,
  "forks": 2,
  "dbPath": "./dev-ansible.db"
}
```

### Container-Heavy Environment

**.ansible-mcp.json:**
```json
{
  "inventoryPath": "./inventory/containers",
  "playbooksPath": "./playbooks/containers",
  "remoteUser": "root",
  "forks": 20,
  "timeout": 10,
  "hostKeyChecking": false,
  "dbPath": "./containers.db",
  "proxmoxDefaults": {
    "apiHost": "pve-cluster.local",
    "apiUser": "ansible@pve",
    "apiTokenId": "automation",
    "apiTokenSecret": "container-token-secret"
  }
}
```

## Project Structure Examples

### Standard Project Layout

```
ansible-project/
├── .ansible-mcp.json
├── .vault_pass
├── ansible.cfg
├── inventory/
│   ├── production/
│   │   ├── hosts.yml
│   │   └── group_vars/
│   │       ├── all.yml
│   │       ├── webservers.yml
│   │       └── databases.yml
│   └── staging/
│       ├── hosts.yml
│       └── group_vars/
├── playbooks/
│   ├── site.yml
│   ├── webservers.yml
│   ├── databases.yml
│   └── maintenance/
│       ├── update-systems.yml
│       └── backup-configs.yml
├── roles/
│   ├── common/
│   ├── nginx/
│   ├── postgresql/
│   └── monitoring/
├── collections/
│   └── requirements.yml
└── ansible-mcp.db
```

### Proxmox-Focused Layout

```
proxmox-ansible/
├── .ansible-mcp.json
├── .vault_pass
├── inventory/
│   ├── proxmox.yml         # Dynamic inventory script
│   ├── static_hosts.yml    # Non-Proxmox hosts
│   └── group_vars/
│       ├── containers/
│       │   └── main.yml
│       └── vms/
│           └── main.yml
├── playbooks/
│   ├── containers/
│   │   ├── create-container.yml
│   │   ├── update-containers.yml
│   │   └── container-backup.yml
│   ├── vms/
│   │   ├── provision-vm.yml
│   │   └── vm-maintenance.yml
│   └── cluster/
│       ├── cluster-update.yml
│       └── storage-management.yml
├── roles/
│   ├── proxmox-container/
│   ├── proxmox-vm/
│   └── proxmox-backup/
└── proxmox-ansible.db
```

## Ansible.cfg Integration

While MCP server handles many settings, you may still want an ansible.cfg:

```ini
[defaults]
inventory = ./inventory
roles_path = ./roles:~/.ansible/roles
host_key_checking = False
timeout = 30
forks = 10
callback_whitelist = profile_tasks, timer
stdout_callback = yaml
bin_ansible_callbacks = True

[privilege_escalation]
become = True
become_method = sudo
become_user = root
become_ask_pass = False

[ssh_connection]
ssh_args = -o ControlMaster=auto -o ControlPersist=60s
pipelining = True
```

## Security Configurations

### Vault Password File

**.vault_pass:**
```
MySecureVaultPassword123!
```

**Permissions:**
```bash
chmod 600 .vault_pass
```

### SSH Key Configuration

Generate dedicated Ansible SSH key:
```bash
ssh-keygen -t ed25519 -f ~/.ssh/ansible_ed25519 -C "ansible-automation"
```

### Secure Production Config

**.ansible-mcp.json:**
```json
{
  "inventoryPath": "./inventory/production",
  "playbooksPath": "./playbooks",
  "rolesPath": "./roles",
  "vaultPasswordFile": "/secure/vault/pass",
  "privateKeyFile": "/secure/keys/ansible_prod",
  "remoteUser": "ansible",
  "becomeMethod": "sudo",
  "forks": 10,
  "timeout": 60,
  "hostKeyChecking": true,
  "dbPath": "/secure/db/ansible-prod.db"
}
```

## Performance Tuning

### High-Performance Config

**.ansible-mcp.json:**
```json
{
  "forks": 50,
  "timeout": 10,
  "strategyPlugins": ["free"],
  "callbackPlugins": ["profile_tasks"]
}
```

### Resource-Constrained Config

**.ansible-mcp.json:**
```json
{
  "forks": 2,
  "timeout": 300,
  "strategyPlugins": ["linear"]
}
```

## Troubleshooting Configurations

### Debug Configuration

**.ansible-mcp-debug.json:**
```json
{
  "inventoryPath": "./inventory/test",
  "playbooksPath": "./playbooks",
  "remoteUser": "test",
  "forks": 1,
  "timeout": 600,
  "hostKeyChecking": false,
  "callbackPlugins": ["debug"],
  "dbPath": "./debug.db"
}
```

### Minimal Test Config

**.ansible-mcp-test.json:**
```json
{
  "inventoryPath": "./test-inventory",
  "playbooksPath": "./test-playbooks",
  "hostKeyChecking": false
}
```

## Integration Examples

### GitLab CI/CD Integration

**.gitlab-ci.yml:**
```yaml
ansible-deploy:
  image: ansible/ansible:latest
  script:
    - npm install --prefix /ansible-mcp-server
    - npm run build --prefix /ansible-mcp-server
    - export ANSIBLE_MCP_DB_PATH=/tmp/ansible.db
    - node /ansible-mcp-server/dist/mcp-server.js
  variables:
    ANSIBLE_INVENTORY: ./inventory/production
    ANSIBLE_VAULT_PASSWORD_FILE: $CI_PROJECT_DIR/.vault_pass
```

### Docker Configuration

**Dockerfile:**
```dockerfile
FROM node:18-alpine

RUN apk add --no-cache ansible openssh-client python3 py3-pip

WORKDIR /app
COPY . .

RUN npm install && npm run build

ENV ANSIBLE_HOST_KEY_CHECKING=false
ENV ANSIBLE_MCP_DB_PATH=/data/ansible.db

VOLUME ["/data", "/ansible"]

CMD ["node", "dist/mcp-server.js"]
```

**docker-compose.yml:**
```yaml
version: '3'
services:
  ansible-mcp:
    build: .
    volumes:
      - ./ansible:/ansible
      - ansible-data:/data
    environment:
      - ANSIBLE_INVENTORY=/ansible/inventory
      - ANSIBLE_PLAYBOOKS_PATH=/ansible/playbooks
      - ANSIBLE_VAULT_PASSWORD_FILE=/ansible/.vault_pass

volumes:
  ansible-data:
```

## Claude Code Usage Examples

### Multiple Ansible Environments with Claude Code

```bash
# Development environment testing
MCP_SERVER_NAME=dev claude-code "Run syntax check on all playbooks"

# Production deployment
MCP_SERVER_NAME=prod claude-code "Deploy application to production servers"

# Client environment management
MCP_SERVER_NAME=client1 claude-code "Update and patch all client1 servers"

# Default environment
claude-code "Show execution history for the last 10 runs"
```

### Environment-Specific Operations

```bash
# Development: Safe experimentation
MCP_SERVER_NAME=dev claude-code "Test new playbook configuration"

# Production: Controlled operations
MCP_SERVER_NAME=prod claude-code "Execute maintenance playbook with approval"

# Client: Dedicated management
MCP_SERVER_NAME=client1 claude-code "Generate inventory report for client1"
```

Last Updated On: June 14, 2025