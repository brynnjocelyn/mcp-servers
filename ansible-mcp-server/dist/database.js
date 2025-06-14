import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
export class AnsibleDatabase {
    db;
    run;
    get;
    all;
    constructor(dbPath) {
        // Ensure directory exists
        const dir = dirname(dbPath);
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
        this.db = new sqlite3.Database(dbPath);
        this.run = promisify(this.db.run.bind(this.db));
        this.get = promisify(this.db.get.bind(this.db));
        this.all = promisify(this.db.all.bind(this.db));
    }
    async initialize() {
        // Create tables
        await this.run(`
      CREATE TABLE IF NOT EXISTS playbook_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        playbook TEXT NOT NULL,
        inventory TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT,
        status TEXT NOT NULL,
        exit_code INTEGER,
        stdout TEXT,
        stderr TEXT,
        tags TEXT,
        limit_hosts TEXT,
        extra_vars TEXT,
        check_mode INTEGER DEFAULT 0
      )
    `);
        await this.run(`
      CREATE TABLE IF NOT EXISTS inventory_hosts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hostname TEXT NOT NULL UNIQUE,
        group_name TEXT NOT NULL,
        variables TEXT,
        enabled INTEGER DEFAULT 1,
        last_seen TEXT,
        os_type TEXT,
        os_version TEXT,
        ansible_host TEXT,
        ansible_port INTEGER,
        ansible_user TEXT,
        is_container INTEGER DEFAULT 0,
        proxmox_node TEXT,
        proxmox_vmid INTEGER
      )
    `);
        await this.run(`
      CREATE TABLE IF NOT EXISTS playbooks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        path TEXT NOT NULL,
        description TEXT,
        tags TEXT,
        category TEXT,
        requires_vault INTEGER DEFAULT 0,
        last_modified TEXT,
        last_run TEXT,
        run_count INTEGER DEFAULT 0,
        avg_duration INTEGER DEFAULT 0
      )
    `);
        // Create indexes
        await this.run('CREATE INDEX IF NOT EXISTS idx_runs_status ON playbook_runs(status)');
        await this.run('CREATE INDEX IF NOT EXISTS idx_runs_playbook ON playbook_runs(playbook)');
        await this.run('CREATE INDEX IF NOT EXISTS idx_hosts_group ON inventory_hosts(group_name)');
        await this.run('CREATE INDEX IF NOT EXISTS idx_hosts_enabled ON inventory_hosts(enabled)');
        await this.run('CREATE INDEX IF NOT EXISTS idx_playbooks_category ON playbooks(category)');
    }
    // Playbook run methods
    async createRun(run) {
        const result = await this.run(`INSERT INTO playbook_runs (playbook, inventory, start_time, status, tags, limit_hosts, extra_vars, check_mode)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [run.playbook, run.inventory, run.startTime, run.status, run.tags, run.limit, run.extraVars, run.checkMode ? 1 : 0]);
        return result.lastID;
    }
    async updateRun(id, updates) {
        const fields = [];
        const values = [];
        if (updates.endTime !== undefined) {
            fields.push('end_time = ?');
            values.push(updates.endTime);
        }
        if (updates.status !== undefined) {
            fields.push('status = ?');
            values.push(updates.status);
        }
        if (updates.exitCode !== undefined) {
            fields.push('exit_code = ?');
            values.push(updates.exitCode);
        }
        if (updates.stdout !== undefined) {
            fields.push('stdout = ?');
            values.push(updates.stdout);
        }
        if (updates.stderr !== undefined) {
            fields.push('stderr = ?');
            values.push(updates.stderr);
        }
        if (fields.length > 0) {
            values.push(id);
            await this.run(`UPDATE playbook_runs SET ${fields.join(', ')} WHERE id = ?`, values);
        }
    }
    async getRun(id) {
        const row = await this.get('SELECT * FROM playbook_runs WHERE id = ?', [id]);
        return row ? this.mapRun(row) : null;
    }
    async getRecentRuns(limit = 10) {
        const rows = await this.all('SELECT * FROM playbook_runs ORDER BY start_time DESC LIMIT ?', [limit]);
        return rows.map(this.mapRun);
    }
    async getRunsByStatus(status) {
        const rows = await this.all('SELECT * FROM playbook_runs WHERE status = ? ORDER BY start_time DESC', [status]);
        return rows.map(this.mapRun);
    }
    mapRun(row) {
        return {
            id: row.id,
            playbook: row.playbook,
            inventory: row.inventory,
            startTime: row.start_time,
            endTime: row.end_time,
            status: row.status,
            exitCode: row.exit_code,
            stdout: row.stdout,
            stderr: row.stderr,
            tags: row.tags,
            limit: row.limit_hosts,
            extraVars: row.extra_vars,
            checkMode: row.check_mode === 1,
        };
    }
    // Inventory methods
    async upsertHost(host) {
        await this.run(`INSERT OR REPLACE INTO inventory_hosts 
       (hostname, group_name, variables, enabled, last_seen, os_type, os_version, 
        ansible_host, ansible_port, ansible_user, is_container, proxmox_node, proxmox_vmid)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            host.hostname, host.groupName, host.variables, host.enabled ? 1 : 0,
            host.lastSeen, host.osType, host.osVersion, host.ansibleHost,
            host.ansiblePort, host.ansibleUser, host.isContainer ? 1 : 0,
            host.proxmoxNode, host.proxmoxVmid
        ]);
    }
    async getHost(hostname) {
        const row = await this.get('SELECT * FROM inventory_hosts WHERE hostname = ?', [hostname]);
        return row ? this.mapHost(row) : null;
    }
    async getHostsByGroup(groupName) {
        const rows = await this.all('SELECT * FROM inventory_hosts WHERE group_name = ? AND enabled = 1', [groupName]);
        return rows.map(this.mapHost);
    }
    async getAllHosts(enabled = true) {
        const rows = await this.all('SELECT * FROM inventory_hosts WHERE enabled = ? ORDER BY group_name, hostname', [enabled ? 1 : 0]);
        return rows.map(this.mapHost);
    }
    async getContainers() {
        const rows = await this.all('SELECT * FROM inventory_hosts WHERE is_container = 1 AND enabled = 1 ORDER BY proxmox_node, proxmox_vmid', []);
        return rows.map(this.mapHost);
    }
    mapHost(row) {
        return {
            id: row.id,
            hostname: row.hostname,
            groupName: row.group_name,
            variables: row.variables,
            enabled: row.enabled === 1,
            lastSeen: row.last_seen,
            osType: row.os_type,
            osVersion: row.os_version,
            ansibleHost: row.ansible_host,
            ansiblePort: row.ansible_port,
            ansibleUser: row.ansible_user,
            isContainer: row.is_container === 1,
            proxmoxNode: row.proxmox_node,
            proxmoxVmid: row.proxmox_vmid,
        };
    }
    // Playbook methods
    async upsertPlaybook(playbook) {
        await this.run(`INSERT OR REPLACE INTO playbooks 
       (name, path, description, tags, category, requires_vault, last_modified)
       VALUES (?, ?, ?, ?, ?, ?, ?)`, [
            playbook.name, playbook.path, playbook.description, playbook.tags,
            playbook.category, playbook.requiresVault ? 1 : 0, playbook.lastModified
        ]);
    }
    async getPlaybook(name) {
        const row = await this.get('SELECT * FROM playbooks WHERE name = ?', [name]);
        return row ? this.mapPlaybook(row) : null;
    }
    async getPlaybooksByCategory(category) {
        const rows = await this.all('SELECT * FROM playbooks WHERE category = ? ORDER BY name', [category]);
        return rows.map(this.mapPlaybook);
    }
    async getAllPlaybooks() {
        const rows = await this.all('SELECT * FROM playbooks ORDER BY category, name', []);
        return rows.map(this.mapPlaybook);
    }
    async updatePlaybookStats(name, duration) {
        await this.run(`UPDATE playbooks 
       SET last_run = datetime('now'), 
           run_count = run_count + 1,
           avg_duration = ((avg_duration * run_count) + ?) / (run_count + 1)
       WHERE name = ?`, [duration, name]);
    }
    mapPlaybook(row) {
        return {
            id: row.id,
            name: row.name,
            path: row.path,
            description: row.description,
            tags: row.tags,
            category: row.category,
            requiresVault: row.requires_vault === 1,
            lastModified: row.last_modified,
            lastRun: row.last_run,
            runCount: row.run_count,
            avgDuration: row.avg_duration,
        };
    }
    async close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
}
//# sourceMappingURL=database.js.map