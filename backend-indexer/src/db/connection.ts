import { Pool, PoolClient, QueryResult } from 'pg';
import config from '../config';
import logger from '../config/logger';
import { DatabaseError } from '../utils/errors';

class Database {
    private pool: Pool | null = null;

    /**
     * Initialize database connection pool
     */
    async connect(): Promise<void> {
        if (this.pool) {
            logger.warn('Database pool already exists');
            return;
        }

        try {
            this.pool = new Pool({
                host: config.database.host,
                port: config.database.port,
                database: config.database.name,
                user: config.database.user,
                password: config.database.password,
                max: 20, // Maximum number of clients in the pool
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
            });

            // Test connection
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();

            logger.info('Database connection pool established', {
                host: config.database.host,
                database: config.database.name,
            });

            // Handle pool errors
            this.pool.on('error', (err) => {
                logger.error('Unexpected database pool error', { error: err.message });
            });
        } catch (error) {
            const err = error as Error;
            logger.error('Failed to connect to database', { error: err.message });
            throw new DatabaseError(`Database connection failed: ${err.message}`);
        }
    }

    /**
     * Get the pool instance
     */
    getPool(): Pool {
        if (!this.pool) {
            throw new DatabaseError('Database pool not initialized. Call connect() first.');
        }
        return this.pool;
    }

    /**
     * Execute a query
     */
    async query<T extends Record<string, any> = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
        const pool = this.getPool();
        try {
            const start = Date.now();
            const result = await pool.query<T>(text, params);
            const duration = Date.now() - start;

            if (duration > 1000) {
                logger.warn('Slow query detected', { duration, query: text.substring(0, 100) });
            }

            return result;
        } catch (error) {
            const err = error as Error;
            logger.error('Database query error', {
                error: err.message,
                query: text.substring(0, 100),
            });
            throw new DatabaseError(`Query failed: ${err.message}`);
        }
    }

    /**
     * Get a client from the pool for transactions
     */
    async getClient(): Promise<PoolClient> {
        const pool = this.getPool();
        try {
            return await pool.connect();
        } catch (error) {
            const err = error as Error;
            throw new DatabaseError(`Failed to get client: ${err.message}`);
        }
    }

    /**
     * Execute a transaction
     */
    async transaction<T>(
        callback: (client: PoolClient) => Promise<T>
    ): Promise<T> {
        const client = await this.getClient();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Close the database connection pool
     */
    async close(): Promise<void> {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
            logger.info('Database connection pool closed');
        }
    }
}

// Export singleton instance
export default new Database();
