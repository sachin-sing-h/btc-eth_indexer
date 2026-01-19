import btcClient from './client';
import btcRepository from '../../db/repositories/btcRepository';
import syncRepository from '../../db/repositories/syncRepository';
import db from '../../db/connection';
import logger from '../../config/logger';
import config from '../../config';
import { sleep } from '../../utils/retry';
import { BTCBlockResponse, BTCTransactionResponse, BTCOutput } from './types';

/**
 * Bitcoin Blockchain Indexer
 */
export class BTCIndexer {
    private isRunning: boolean = false;
    private shouldStop: boolean = false;

    /**
     * Start the indexer
     */
    async start(): Promise<void> {
        if (this.isRunning) {
            logger.warn('BTC indexer is already running');
            return;
        }

        this.isRunning = true;
        this.shouldStop = false;

        logger.info('Starting BTC indexer');

        // Test connection first
        const connected = await btcClient.testConnection();
        if (!connected) {
            throw new Error('Failed to connect to Bitcoin RPC');
        }

        // Start indexing loop
        await this.indexLoop();
    }

    /**
     * Stop the indexer
     */
    async stop(): Promise<void> {
        logger.info('Stopping BTC indexer');
        this.shouldStop = true;

        // Wait for current operation to complete
        while (this.isRunning) {
            await sleep(100);
        }

        logger.info('BTC indexer stopped');
    }

    /**
     * Main indexing loop
     */
    private async indexLoop(): Promise<void> {
        while (!this.shouldStop) {
            try {
                await syncRepository.setSyncing('BTC', true);

                // Get current sync status
                const syncStatus = await syncRepository.getSyncStatus('BTC');
                let currentHeight = syncStatus?.lastIndexedBlock ?? config.btc.startBlock;

                // Get latest block height from network
                const latestHeight = await btcClient.getBlockCount();

                if (currentHeight >= latestHeight) {
                    logger.debug('BTC indexer is up to date', { currentHeight, latestHeight });
                    await syncRepository.setSyncing('BTC', false);
                    await sleep(config.indexer.pollInterval);
                    continue;
                }

                // Index blocks in batches
                const endHeight = Math.min(
                    currentHeight + config.indexer.maxBlocksPerBatch,
                    latestHeight
                );

                logger.info('Indexing BTC blocks', {
                    from: currentHeight + 1,
                    to: endHeight,
                    total: endHeight - currentHeight,
                });

                for (let height = currentHeight + 1; height <= endHeight && !this.shouldStop; height++) {
                    await this.indexBlock(height);
                }

                logger.info('BTC batch indexed successfully', {
                    from: currentHeight + 1,
                    to: endHeight,
                });
            } catch (error) {
                const err = error as Error;
                logger.error('Error in BTC indexing loop', { error: err.message, stack: err.stack });
                await syncRepository.setSyncing('BTC', false);

                // Wait before retrying
                await sleep(5000);
            }
        }

        this.isRunning = false;
    }

    /**
     * Index a single block
     */
    private async indexBlock(height: number): Promise<void> {
        try {
            // Get block hash
            const blockHash = await btcClient.getBlockHash(height);

            // Check if already indexed (idempotency)
            const existingBlock = await btcRepository.getBlockByHash(blockHash);
            if (existingBlock) {
                logger.debug('Block already indexed, skipping', { height, blockHash });
                await syncRepository.updateSyncStatus('BTC', height, blockHash, true);
                return;
            }

            // Fetch block with transactions
            const block = await btcClient.getBlock(blockHash, 2);

            // Process block in a transaction
            await db.transaction(async (client) => {
                // Save block
                await btcRepository.saveBlock(
                    {
                        blockHash: block.hash,
                        blockHeight: block.height,
                        previousBlockHash: block.previousblockhash || null,
                        timestamp: block.time,
                        difficulty: block.difficulty,
                        nonce: block.nonce,
                        merkleRoot: block.merkleroot,
                        transactionCount: Array.isArray(block.tx) ? block.tx.length : 0,
                    },
                    client
                );

                // Process transactions
                if (Array.isArray(block.tx)) {
                    for (const tx of block.tx) {
                        if (typeof tx === 'string') {
                            // If tx is just a hash, fetch full transaction
                            const fullTx = await btcClient.getRawTransaction(tx, true, blockHash);
                            await this.indexTransaction(fullTx, block, client);
                        } else {
                            // Full transaction object
                            await this.indexTransaction(tx as BTCTransactionResponse, block, client);
                        }
                    }
                }

                // Update sync status
                await syncRepository.updateSyncStatus('BTC', height, blockHash, true);
            });

            logger.debug('Indexed BTC block', { height, blockHash, txCount: block.tx.length });
        } catch (error) {
            const err = error as Error;
            logger.error('Failed to index BTC block', { height, error: err.message });
            throw error;
        }
    }

    /**
     * Index a transaction
     */
    private async indexTransaction(
        tx: BTCTransactionResponse,
        block: BTCBlockResponse,
        client: any
    ): Promise<void> {
        // Calculate total input and output values
        let totalInputValue = 0;
        let totalOutputValue = 0;
        const addressTransactions: any[] = [];

        // Process outputs
        for (const output of tx.vout) {
            const amount = Math.round(output.value * 100000000); // Convert to satoshis
            totalOutputValue += amount;

            // Extract addresses from output
            const addresses = this.extractAddresses(output);
            for (const address of addresses) {
                addressTransactions.push({
                    address,
                    txHash: tx.txid,
                    blockHeight: block.height,
                    isInput: false,
                    amount,
                });
            }
        }

        // Process inputs (skip coinbase)
        for (const input of tx.vin) {
            if (!input.coinbase && input.txid) {
                // For inputs, we would need to look up the previous transaction
                // to get the value and address. For simplicity, we'll store what we have.
                // In production, you'd fetch the previous tx to get accurate input values.
            }
        }

        const fee = totalInputValue > 0 ? totalInputValue - totalOutputValue : 0;

        // Save transaction first (parent)
        await btcRepository.saveTransaction(
            {
                txHash: tx.txid,
                blockHash: block.hash,
                blockHeight: block.height,
                timestamp: block.time,
                size: tx.size,
                virtualSize: tx.vsize,
                weight: tx.weight,
                version: tx.version,
                locktime: tx.locktime,
                inputs: tx.vin,
                outputs: tx.vout,
                totalInputValue: totalInputValue > 0 ? totalInputValue : undefined,
                totalOutputValue,
                fee: fee > 0 ? fee : undefined,
            },
            client
        );

        // Save address transactions second (children)
        for (const addrTx of addressTransactions) {
            await btcRepository.saveAddressTransaction(addrTx, client);
        }
    }

    /**
     * Extract addresses from output
     */
    private extractAddresses(output: BTCOutput): string[] {
        const addresses: string[] = [];

        if (output.scriptPubKey.address) {
            addresses.push(output.scriptPubKey.address);
        }

        if (output.scriptPubKey.addresses) {
            addresses.push(...output.scriptPubKey.addresses);
        }

        return addresses;
    }
}

export default new BTCIndexer();
