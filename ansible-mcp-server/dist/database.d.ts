export interface PlaybookRun {
    id?: number;
    playbook: string;
    inventory: string;
    startTime: string;
    endTime?: string;
    status: 'running' | 'success' | 'failed' | 'cancelled';
    exitCode?: number;
    stdout?: string;
    stderr?: string;
    tags?: string;
    limit?: string;
    extraVars?: string;
    checkMode?: boolean;
}
export interface InventoryHost {
    id?: number;
    hostname: string;
    groupName: string;
    variables?: string;
    enabled: boolean;
    lastSeen?: string;
    osType?: string;
    osVersion?: string;
    ansibleHost?: string;
    ansiblePort?: number;
    ansibleUser?: string;
    isContainer?: boolean;
    proxmoxNode?: string;
    proxmoxVmid?: number;
}
export interface Playbook {
    id?: number;
    name: string;
    path: string;
    description?: string;
    tags?: string;
    category?: string;
    requiresVault?: boolean;
    lastModified?: string;
    lastRun?: string;
    runCount?: number;
    avgDuration?: number;
}
export declare class AnsibleDatabase {
    private db;
    private run;
    private get;
    private all;
    constructor(dbPath: string);
    initialize(): Promise<void>;
    createRun(run: PlaybookRun): Promise<number>;
    updateRun(id: number, updates: Partial<PlaybookRun>): Promise<void>;
    getRun(id: number): Promise<PlaybookRun | null>;
    getRecentRuns(limit?: number): Promise<PlaybookRun[]>;
    getRunsByStatus(status: string): Promise<PlaybookRun[]>;
    private mapRun;
    upsertHost(host: InventoryHost): Promise<void>;
    getHost(hostname: string): Promise<InventoryHost | null>;
    getHostsByGroup(groupName: string): Promise<InventoryHost[]>;
    getAllHosts(enabled?: boolean): Promise<InventoryHost[]>;
    getContainers(): Promise<InventoryHost[]>;
    private mapHost;
    upsertPlaybook(playbook: Playbook): Promise<void>;
    getPlaybook(name: string): Promise<Playbook | null>;
    getPlaybooksByCategory(category: string): Promise<Playbook[]>;
    getAllPlaybooks(): Promise<Playbook[]>;
    updatePlaybookStats(name: string, duration: number): Promise<void>;
    private mapPlaybook;
    close(): Promise<void>;
}
//# sourceMappingURL=database.d.ts.map