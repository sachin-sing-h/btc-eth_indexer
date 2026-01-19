import fs from 'fs';
import path from 'path';
import db from '../db/connection';
import logger from '../config/logger';

/**
 * Run database migrations
 */
async function migrate(): Promise<void> {
    try {
        logger.info('Starting database migration');

        // Connect to database
        await db.connect();

        // Read schema file
        const schemaPath = path.join(__dirname, '../db/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf-8');

        // Execute schema
        await db.query(schema);

        logger.info('Database migration completed successfully');

        process.exit(0);
    } catch (error) {
        const err = error as Error;
        logger.error('Database migration failed', { error: err.message, stack: err.stack });
        process.exit(1);
    }
}

// Run migration
migrate();
