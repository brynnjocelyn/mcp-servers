interface PostgresConfig {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    ssl?: boolean | {
        rejectUnauthorized?: boolean;
        ca?: string;
        cert?: string;
        key?: string;
    };
    connectionTimeoutMillis?: number;
    query_timeout?: number;
    statement_timeout?: number;
    idle_in_transaction_session_timeout?: number;
    max?: number;
}
/**
 * Loads PostgreSQL configuration from multiple sources
 * Priority: local config file > environment variables > defaults
 */
export declare function loadConfig(): PostgresConfig;
export {};
//# sourceMappingURL=config-loader.d.ts.map