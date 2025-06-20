import { exec, ExecException } from 'child_process';
import { promisify } from 'util';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

export interface ExecResult {
  stdout: string;
  stderr: string;
}

/**
 * Service for managing Prisma operations
 */
export class PrismaService {
  private schemaPath: string;
  private migrationsDir: string;
  private projectRoot: string;
  
  constructor(schemaPath: string, migrationsDir: string, projectRoot?: string) {
    this.schemaPath = schemaPath;
    this.migrationsDir = migrationsDir;
    this.projectRoot = projectRoot || process.cwd();
  }

  /**
   * Execute a Prisma CLI command
   */
  async executePrismaCommand(command: string): Promise<ExecResult> {
    try {
      // Use the schema path directly when executing from the project root
      // Prisma will look for it relative to the cwd
      const fullCommand = `npx prisma ${command} --schema="${this.schemaPath}"`;
      
      const { stdout, stderr } = await execAsync(fullCommand, {
        cwd: this.projectRoot,
        env: process.env
      });
      return { stdout, stderr };
    } catch (error) {
      const execError = error as ExecException & { stdout?: string; stderr?: string };
      throw new Error(`Prisma command failed: ${execError.message}\n${execError.stderr || ''}`);
    }
  }

  /**
   * Get the full schema path, handling both absolute and relative paths
   */
  private getFullSchemaPath(): string {
    // If schemaPath is absolute, use it directly
    if (this.schemaPath.startsWith('/')) {
      return this.schemaPath;
    }
    // Otherwise, resolve it relative to projectRoot
    return join(this.projectRoot, this.schemaPath);
  }

  /**
   * Read the Prisma schema file
   */
  readSchema(): string {
    const fullSchemaPath = this.getFullSchemaPath();
    if (!existsSync(fullSchemaPath)) {
      throw new Error(`Schema file not found at ${fullSchemaPath}`);
    }
    return readFileSync(fullSchemaPath, 'utf-8');
  }

  /**
   * Write to the Prisma schema file
   */
  writeSchema(content: string): void {
    const fullSchemaPath = this.getFullSchemaPath();
    writeFileSync(fullSchemaPath, content, 'utf-8');
  }

  /**
   * Check if schema file exists
   */
  schemaExists(): boolean {
    const fullSchemaPath = this.getFullSchemaPath();
    return existsSync(fullSchemaPath);
  }

  /**
   * Initialize a new Prisma project
   */
  async init(datasourceProvider: string = 'postgresql'): Promise<void> {
    const result = await this.executePrismaCommand(`init --datasource-provider ${datasourceProvider}`);
    if (result.stderr && !result.stderr.includes('success')) {
      throw new Error(`Failed to initialize Prisma: ${result.stderr}`);
    }
  }

  /**
   * Format the Prisma schema
   */
  async format(): Promise<void> {
    await this.executePrismaCommand('format');
  }

  /**
   * Validate the Prisma schema
   */
  async validate(): Promise<void> {
    await this.executePrismaCommand('validate');
  }

  /**
   * Generate Prisma Client
   */
  async generate(): Promise<void> {
    await this.executePrismaCommand('generate');
  }

  /**
   * Pull database schema
   */
  async dbPull(): Promise<void> {
    await this.executePrismaCommand('db pull');
  }

  /**
   * Push schema changes without migrations
   */
  async dbPush(acceptDataLoss: boolean = false): Promise<ExecResult> {
    const command = acceptDataLoss ? 'db push --accept-data-loss' : 'db push';
    return await this.executePrismaCommand(command);
  }

  /**
   * Create a new migration
   */
  async migrateCreate(name: string): Promise<void> {
    await this.executePrismaCommand(`migrate dev --name ${name} --create-only`);
  }

  /**
   * Apply migrations in development
   */
  async migrateDev(name?: string): Promise<ExecResult> {
    const command = name ? `migrate dev --name ${name}` : 'migrate dev';
    return await this.executePrismaCommand(command);
  }

  /**
   * Deploy migrations in production
   */
  async migrateDeploy(): Promise<void> {
    await this.executePrismaCommand('migrate deploy');
  }

  /**
   * Reset database
   */
  async migrateReset(force: boolean = false): Promise<void> {
    const command = force ? 'migrate reset --force' : 'migrate reset';
    await this.executePrismaCommand(command);
  }

  /**
   * Get migration status
   */
  async migrateStatus(): Promise<string> {
    const result = await this.executePrismaCommand('migrate status');
    return result.stdout;
  }

  /**
   * Resolve migration issues
   */
  async migrateResolve(applied?: string, rolledBack?: string): Promise<void> {
    let command = 'migrate resolve';
    if (applied) command += ` --applied ${applied}`;
    if (rolledBack) command += ` --rolled-back ${rolledBack}`;
    await this.executePrismaCommand(command);
  }

  /**
   * Get schema diff
   */
  async migrateDiff(from: string, to: string, script: boolean = false): Promise<string> {
    const scriptFlag = script ? '--script' : '';
    const result = await this.executePrismaCommand(`migrate diff --from-${from} --to-${to} ${scriptFlag}`);
    return result.stdout;
  }

  /**
   * Seed the database
   */
  async seed(): Promise<void> {
    await this.executePrismaCommand('db seed');
  }

  /**
   * Execute raw SQL
   */
  async executeRaw(query: string): Promise<any> {
    // This would require a Prisma Client instance
    // For now, we'll return a placeholder
    throw new Error('Raw query execution requires an active Prisma Client instance');
  }

  /**
   * Parse schema to extract models
   */
  parseSchema(): { models: string[]; enums: string[] } {
    const schema = this.readSchema();
    const models: string[] = [];
    const enums: string[] = [];
    
    // Simple regex parsing for models
    const modelRegex = /model\s+(\w+)\s*{/g;
    let match;
    while ((match = modelRegex.exec(schema)) !== null) {
      models.push(match[1]);
    }
    
    // Simple regex parsing for enums
    const enumRegex = /enum\s+(\w+)\s*{/g;
    while ((match = enumRegex.exec(schema)) !== null) {
      enums.push(match[1]);
    }
    
    return { models, enums };
  }
}