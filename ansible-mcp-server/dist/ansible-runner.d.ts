import { AnsibleConfig } from './config-loader.js';
import { AnsibleDatabase } from './database.js';
export interface AnsibleOptions {
    inventory?: string;
    limit?: string;
    tags?: string;
    skipTags?: string;
    extraVars?: Record<string, any>;
    become?: boolean;
    becomeUser?: string;
    checkMode?: boolean;
    diff?: boolean;
    forks?: number;
    verbose?: number;
    privateKey?: string;
    vaultPasswordFile?: string;
    startAtTask?: string;
    step?: boolean;
    timeout?: number;
}
export interface AnsibleResult {
    success: boolean;
    exitCode: number;
    stdout: string;
    stderr: string;
    duration: number;
    runId?: number;
}
export declare class AnsibleRunner {
    private config;
    private db;
    constructor(config: AnsibleConfig, db: AnsibleDatabase);
    /**
     * Run an Ansible playbook
     */
    runPlaybook(playbookPath: string, options?: AnsibleOptions): Promise<AnsibleResult>;
    /**
     * Run an ad-hoc Ansible command
     */
    runCommand(pattern: string, module: string, moduleArgs?: string, options?: AnsibleOptions): Promise<AnsibleResult>;
    /**
     * Execute ansible-inventory to get inventory data
     */
    getInventory(options?: {
        inventory?: string;
        list?: boolean;
        host?: string;
        graph?: boolean;
        vars?: boolean;
    }): Promise<any>;
    /**
     * Check playbook syntax
     */
    checkSyntax(playbookPath: string, inventory?: string): Promise<AnsibleResult>;
    /**
     * Install Ansible Galaxy requirements
     */
    installGalaxyRequirements(requirementsFile: string, type?: 'role' | 'collection'): Promise<AnsibleResult>;
    /**
     * Encrypt a file or string with ansible-vault
     */
    vaultEncrypt(content: string, vaultPasswordFile?: string): Promise<string>;
    /**
     * Decrypt a file or string with ansible-vault
     */
    vaultDecrypt(encryptedContent: string, vaultPasswordFile?: string): Promise<string>;
    /**
     * Scan directory for playbooks
     */
    scanForPlaybooks(directory?: string): Promise<Array<{
        name: string;
        path: string;
        category: string;
        description?: string;
        tags?: string[];
    }>>;
    /**
     * Generate a dynamic inventory from database
     */
    generateInventory(): Promise<any>;
    /**
     * Execute an Ansible command
     */
    private executeAnsible;
}
//# sourceMappingURL=ansible-runner.d.ts.map