import db from './db/connection';
import logger from './config/logger';
import { startServer } from './api/server';
import btcIndexer from './indexers/btc/indexer';
import ethIndexer from './indexers/eth/indexer';

/**
 * Main application entry point
 */
async function main(): Promise<void> {
    try {
        logger.info('Starting Blockchain Indexer');

        // Connect to database
        logger.info('Connecting to database...');
        await db.connect();
        logger.info('Database connected');

        // Start API server
        logger.info('Starting API server...');
        await startServer();

        // Start indexers
        logger.info('Starting blockchain indexers...');

        // Start BTC indexer
        btcIndexer.start().catch((error) => {
            logger.error('BTC indexer failed', { error: error.message });
        });

        // Start ETH indexer
        ethIndexer.start().catch((error) => {
            logger.error('ETH indexer failed', { error: error.message });
        });

        logger.info('Blockchain Indexer is running');

        // Handle graceful shutdown
        const shutdown = async (signal: string) => {
            logger.info(`Received ${signal}, shutting down gracefully...`);

            // Stop indexers
            await Promise.all([
                btcIndexer.stop(),
                ethIndexer.stop(),
            ]);

            // Close database connection
            await db.close();

            logger.info('Shutdown complete');
            process.exit(0);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    } catch (error) {
        const err = error as Error;
        logger.error('Failed to start application', { error: err.message, stack: err.stack });
        process.exit(1);
    }
}

// Start the application
main();
