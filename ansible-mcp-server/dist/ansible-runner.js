import { spawn } from 'child_process';
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, basename, extname } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';
import * as yaml from 'js-yaml';
export class AnsibleRunner {
    config;
    db;
    constructor(config, db) {
        this.config = config;
        this.db = db;
    }
    /**
     * Run an Ansible playbook
     */
    async runPlaybook(playbookPath, options = {}) {
        const startTime = Date.now();
        const inventory = options.inventory || this.config.inventoryPath || 'inventory';
        // Create run record
        const runId = await this.db.createRun({
            playbook: playbookPath,
            inventory,
            startTime: new Date().toISOString(),
            status: 'running',
            tags: options.tags,
            limit: options.limit,
            extraVars: options.extraVars ? JSON.stringify(options.extraVars) : undefined,
            checkMode: options.checkMode,
        });
        const args = [playbookPath];
        // Add inventory
        args.push('-i', inventory);
        // Add options
        if (options.limit)
            args.push('--limit', options.limit);
        if (options.tags)
            args.push('--tags', options.tags);
        if (options.skipTags)
            args.push('--skip-tags', options.skipTags);
        if (options.become)
            args.push('--become');
        if (options.becomeUser)
            args.push('--become-user', options.becomeUser);
        if (options.checkMode)
            args.push('--check');
        if (options.diff)
            args.push('--diff');
        if (options.forks)
            args.push('--forks', options.forks.toString());
        if (options.verbose)
            args.push(`-${'v'.repeat(Math.min(options.verbose, 4))}`);
        if (options.privateKey)
            args.push('--private-key', options.privateKey);
        if (options.vaultPasswordFile)
            args.push('--vault-password-file', options.vaultPasswordFile);
        if (options.startAtTask)
            args.push('--start-at-task', options.startAtTask);
        if (options.step)
            args.push('--step');
        if (options.timeout)
            args.push('--timeout', options.timeout.toString());
        // Add extra vars
        if (options.extraVars) {
            for (const [key, value] of Object.entries(options.extraVars)) {
                args.push('-e', `${key}=${JSON.stringify(value)}`);
            }
        }
        // Add config options
        if (!this.config.hostKeyChecking) {
            args.push('-e', 'ansible_host_key_checking=False');
        }
        const result = await this.executeAnsible('ansible-playbook', args);
        const duration = Date.now() - startTime;
        // Update run record
        await this.db.updateRun(runId, {
            endTime: new Date().toISOString(),
            status: result.success ? 'success' : 'failed',
            exitCode: result.exitCode,
            stdout: result.stdout,
            stderr: result.stderr,
        });
        // Update playbook stats
        const playbookName = basename(playbookPath);
        await this.db.updatePlaybookStats(playbookName, duration);
        return { ...result, duration, runId };
    }
    /**
     * Run an ad-hoc Ansible command
     */
    async runCommand(pattern, module, moduleArgs, options = {}) {
        const startTime = Date.now();
        const args = [pattern, '-m', module];
        if (moduleArgs)
            args.push('-a', moduleArgs);
        // Add inventory
        const inventory = options.inventory || this.config.inventoryPath || 'inventory';
        args.push('-i', inventory);
        // Add options
        if (options.become)
            args.push('--become');
        if (options.becomeUser)
            args.push('--become-user', options.becomeUser);
        if (options.forks)
            args.push('--forks', options.forks.toString());
        if (options.verbose)
            args.push(`-${'v'.repeat(Math.min(options.verbose, 4))}`);
        if (options.privateKey)
            args.push('--private-key', options.privateKey);
        if (options.timeout)
            args.push('--timeout', options.timeout.toString());
        // Add extra vars
        if (options.extraVars) {
            for (const [key, value] of Object.entries(options.extraVars)) {
                args.push('-e', `${key}=${JSON.stringify(value)}`);
            }
        }
        const result = await this.executeAnsible('ansible', args);
        const duration = Date.now() - startTime;
        return { ...result, duration };
    }
    /**
     * Execute ansible-inventory to get inventory data
     */
    async getInventory(options = {}) {
        const args = [];
        // Add inventory
        const inventory = options.inventory || this.config.inventoryPath || 'inventory';
        args.push('-i', inventory);
        if (options.list || (!options.host && !options.graph)) {
            args.push('--list');
        }
        if (options.host) {
            args.push('--host', options.host);
        }
        if (options.graph) {
            args.push('--graph');
            if (options.vars)
                args.push('--vars');
        }
        const result = await this.executeAnsible('ansible-inventory', args);
        if (result.success && (options.list || options.host)) {
            try {
                return JSON.parse(result.stdout);
            }
            catch (e) {
                return result.stdout;
            }
        }
        return result.stdout;
    }
    /**
     * Check playbook syntax
     */
    async checkSyntax(playbookPath, inventory) {
        const args = [playbookPath, '--syntax-check'];
        const inventoryPath = inventory || this.config.inventoryPath;
        if (inventoryPath) {
            args.push('-i', inventoryPath);
        }
        return this.executeAnsible('ansible-playbook', args);
    }
    /**
     * Install Ansible Galaxy requirements
     */
    async installGalaxyRequirements(requirementsFile, type = 'role') {
        const args = [type, 'install', '-r', requirementsFile];
        if (type === 'role' && this.config.rolesPath) {
            args.push('-p', this.config.rolesPath);
        }
        return this.executeAnsible('ansible-galaxy', args);
    }
    /**
     * Encrypt a file or string with ansible-vault
     */
    async vaultEncrypt(content, vaultPasswordFile) {
        const passwordFile = vaultPasswordFile || this.config.vaultPasswordFile;
        if (!passwordFile) {
            throw new Error('Vault password file not configured');
        }
        const tempFile = join(tmpdir(), `ansible-vault-${randomBytes(8).toString('hex')}.tmp`);
        writeFileSync(tempFile, content);
        try {
            const args = ['encrypt', tempFile, '--vault-password-file', passwordFile];
            const result = await this.executeAnsible('ansible-vault', args);
            if (result.success) {
                return readFileSync(tempFile, 'utf-8');
            }
            else {
                throw new Error(`Vault encryption failed: ${result.stderr}`);
            }
        }
        finally {
            // Clean up temp file
            if (existsSync(tempFile)) {
                const fs = require('fs');
                fs.unlinkSync(tempFile);
            }
        }
    }
    /**
     * Decrypt a file or string with ansible-vault
     */
    async vaultDecrypt(encryptedContent, vaultPasswordFile) {
        const passwordFile = vaultPasswordFile || this.config.vaultPasswordFile;
        if (!passwordFile) {
            throw new Error('Vault password file not configured');
        }
        const tempFile = join(tmpdir(), `ansible-vault-${randomBytes(8).toString('hex')}.tmp`);
        writeFileSync(tempFile, encryptedContent);
        try {
            const args = ['decrypt', tempFile, '--vault-password-file', passwordFile];
            const result = await this.executeAnsible('ansible-vault', args);
            if (result.success) {
                return readFileSync(tempFile, 'utf-8');
            }
            else {
                throw new Error(`Vault decryption failed: ${result.stderr}`);
            }
        }
        finally {
            // Clean up temp file
            if (existsSync(tempFile)) {
                const fs = require('fs');
                fs.unlinkSync(tempFile);
            }
        }
    }
    /**
     * Scan directory for playbooks
     */
    async scanForPlaybooks(directory) {
        const playbooksDir = directory || this.config.playbooksPath || './playbooks';
        const playbooks = [];
        if (!existsSync(playbooksDir)) {
            return playbooks;
        }
        const scanDir = (dir, category = '') => {
            const entries = readdirSync(dir);
            for (const entry of entries) {
                const fullPath = join(dir, entry);
                const stat = statSync(fullPath);
                if (stat.isDirectory()) {
                    scanDir(fullPath, category ? `${category}/${entry}` : entry);
                }
                else if (stat.isFile() && (entry.endsWith('.yml') || entry.endsWith('.yaml'))) {
                    try {
                        const content = readFileSync(fullPath, 'utf-8');
                        const parsed = yaml.load(content);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            const play = parsed[0];
                            const name = basename(fullPath, extname(fullPath));
                            playbooks.push({
                                name,
                                path: fullPath,
                                category: category || 'uncategorized',
                                description: play.name || undefined,
                                tags: play.tags || [],
                            });
                        }
                    }
                    catch (e) {
                        // Skip invalid YAML files
                    }
                }
            }
        };
        scanDir(playbooksDir);
        return playbooks;
    }
    /**
     * Generate a dynamic inventory from database
     */
    async generateInventory() {
        const hosts = await this.db.getAllHosts(true);
        const inventory = {
            _meta: {
                hostvars: {},
            },
        };
        // Group hosts
        for (const host of hosts) {
            if (!inventory[host.groupName]) {
                inventory[host.groupName] = {
                    hosts: [],
                    vars: {},
                };
            }
            inventory[host.groupName].hosts.push(host.hostname);
            // Add host vars
            const hostVars = {};
            if (host.ansibleHost)
                hostVars.ansible_host = host.ansibleHost;
            if (host.ansiblePort)
                hostVars.ansible_port = host.ansiblePort;
            if (host.ansibleUser)
                hostVars.ansible_user = host.ansibleUser;
            // Parse additional variables
            if (host.variables) {
                try {
                    const vars = JSON.parse(host.variables);
                    Object.assign(hostVars, vars);
                }
                catch (e) {
                    // Skip invalid JSON
                }
            }
            // Add Proxmox metadata
            if (host.proxmoxNode) {
                hostVars.proxmox_node = host.proxmoxNode;
                hostVars.proxmox_vmid = host.proxmoxVmid;
                hostVars.is_container = host.isContainer;
            }
            inventory._meta.hostvars[host.hostname] = hostVars;
        }
        // Add special groups
        const containers = hosts.filter(h => h.isContainer);
        if (containers.length > 0) {
            inventory.containers = {
                hosts: containers.map(h => h.hostname),
            };
        }
        const vms = hosts.filter(h => !h.isContainer && h.proxmoxVmid);
        if (vms.length > 0) {
            inventory.vms = {
                hosts: vms.map(h => h.hostname),
            };
        }
        return inventory;
    }
    /**
     * Execute an Ansible command
     */
    executeAnsible(command, args) {
        return new Promise((resolve) => {
            const env = { ...process.env };
            // Set Ansible environment variables
            if (this.config.rolesPath) {
                env.ANSIBLE_ROLES_PATH = this.config.rolesPath;
            }
            if (!this.config.hostKeyChecking) {
                env.ANSIBLE_HOST_KEY_CHECKING = 'False';
            }
            if (this.config.remoteUser) {
                env.ANSIBLE_REMOTE_USER = this.config.remoteUser;
            }
            if (this.config.privateKeyFile) {
                env.ANSIBLE_PRIVATE_KEY_FILE = this.config.privateKeyFile;
            }
            // Use configured paths
            const execCommand = command === 'ansible' ? this.config.ansiblePath || command : command;
            const proc = spawn(execCommand, args, {
                env,
                shell: true,
            });
            let stdout = '';
            let stderr = '';
            proc.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            proc.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            proc.on('close', (code) => {
                resolve({
                    success: code === 0,
                    exitCode: code || 0,
                    stdout,
                    stderr,
                    duration: 0,
                });
            });
            proc.on('error', (err) => {
                resolve({
                    success: false,
                    exitCode: -1,
                    stdout,
                    stderr: stderr + '\n' + err.message,
                    duration: 0,
                });
            });
        });
    }
}
//# sourceMappingURL=ansible-runner.js.map