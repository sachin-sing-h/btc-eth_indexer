import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

interface Config {
    // Database
    database: {
        host: string;
        port: number;
        name: string;
        user: string;
        password: string;
    };

    // Bitcoin RPC
    btc: {
        rpcUrl: string;
        rpcUser: string;
        rpcPassword: string;
        startBlock: number;
    };

    // Ethereum RPC
    eth: {
        rpcUrl: string;
        startBlock: number;
    };

    // API Server
    api: {
        port: number;
        host: string;
    };

    // Logging
    logging: {
        level: string;
        dir: string;
    };

    // Indexer
    indexer: {
        pollInterval: number;
        maxBlocksPerBatch: number;
        maxReorgDepth: number;
    };
}

const config: Config = {
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        name: process.env.DB_NAME || 'blockchain_indexer',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
    },

    btc: {
        rpcUrl: process.env.BTC_RPC_URL || 'http://localhost:8332',
        rpcUser: process.env.BTC_RPC_USER || 'bitcoin',
        rpcPassword: process.env.BTC_RPC_PASSWORD || '',
        startBlock: parseInt(process.env.BTC_START_BLOCK || '0', 10),
    },

    eth: {
        rpcUrl: process.env.ETH_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo',
        startBlock: parseInt(process.env.ETH_START_BLOCK || '0', 10),
    },

    api: {
        port: parseInt(process.env.API_PORT || '3000', 10),
        host: process.env.API_HOST || '0.0.0.0',
    },

    logging: {
        level: process.env.LOG_LEVEL || 'info',
        dir: process.env.LOG_DIR || path.join(process.cwd(), 'logs'),
    },

    indexer: {
        pollInterval: parseInt(process.env.INDEXER_POLL_INTERVAL || '10000', 10),
        maxBlocksPerBatch: parseInt(process.env.MAX_BLOCKS_PER_BATCH || '100', 10),
        maxReorgDepth: parseInt(process.env.MAX_REORG_DEPTH || '6', 10),
    },
};

// Validate required configuration
function validateConfig(): void {
    if (!config.database.password) {
        console.warn('Warning: DB_PASSWORD is not set');
    }

    if (!config.btc.rpcPassword) {
        console.warn('Warning: BTC_RPC_PASSWORD is not set');
    }

    if (config.eth.rpcUrl.includes('demo')) {
        console.warn('Warning: Using demo ETH RPC URL. Please configure a proper RPC endpoint.');
    }
}

validateConfig();

export default config;
