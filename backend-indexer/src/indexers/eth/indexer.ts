import ethClient from './client';
import ethRepository from '../../db/repositories/ethRepository';
import syncRepository from '../../db/repositories/syncRepository';
import db from '../../db/connection';
import logger from '../../config/logger';
import config from '../../config';
import { sleep } from '../../utils/retry';
import { extractTokenTransfers } from './erc20';

/**
 * Ethereum Blockchain Indexer
 */
export class ETHIndexer {
    private isRunning: boolean = false;
    private shouldStop: boolean = false;

    /**
     * Start the indexer
     */
    async start(): Promise<void> {
        if (this.isRunning) {
            logger.warn('ETH indexer is already running');
            return;
        }

        this.isRunning = true;
        this.shouldStop = false;

        logger.info('Starting ETH indexer');

        // Test connection first
        const connected = await ethClient.testConnection();
        if (!connected) {
            throw new Error('Failed to connect to Ethereum RPC');
        }

        // Start indexing loop
        await this.indexLoop();
    }

    /**
     * Stop the indexer
     */
    async stop(): Promise<void> {
        logger.info('Stopping ETH indexer');
        this.shouldStop = true;

        // Wait for current operation to complete
        while (this.isRunning) {
            await sleep(100);
        }

        logger.info('ETH indexer stopped');
    }

    /**
     * Main indexing loop
     */
    private async indexLoop(): Promise<void> {
        while (!this.shouldStop) {
            try {
                await syncRepository.setSyncing('ETH', true);

                // Get current sync status
                const syncStatus = await syncRepository.getSyncStatus('ETH');
                let currentBlock = syncStatus?.lastIndexedBlock ?? config.eth.startBlock;

                // Get latest block number from network
                const latestBlock = await ethClient.getBlockNumber();

                if (currentBlock >= latestBlock) {
                    logger.debug('ETH indexer is up to date', { currentBlock, latestBlock });
                    await syncRepository.setSyncing('ETH', false);
                    await sleep(config.indexer.pollInterval);
                    continue;
                }

                // Index blocks in batches
                const endBlock = Math.min(
                    currentBlock + config.indexer.maxBlocksPerBatch,
                    latestBlock
                );

                logger.info('Indexing ETH blocks', {
                    from: currentBlock + 1,
                    to: endBlock,
                    total: endBlock - currentBlock,
                });

                for (let blockNum = currentBlock + 1; blockNum <= endBlock && !this.shouldStop; blockNum++) {
                    await this.indexBlock(blockNum);
                }

                logger.info('ETH batch indexed successfully', {
                    from: currentBlock + 1,
                    to: endBlock,
                });
            } catch (error) {
                const err = error as Error;
                logger.error('Error in ETH indexing loop', { error: err.message, stack: err.stack });
                await syncRepository.setSyncing('ETH', false);

                // Wait before retrying
                await sleep(5000);
            }
        }

        this.isRunning = false;
    }

    /**
     * Index a single block
     */
    private async indexBlock(blockNumber: number): Promise<void> {
        try {
            // Fetch block with transactions
            const block = await ethClient.getBlock(blockNumber, true);

            if (!block) {
                logger.warn('Block not found', { blockNumber });
                return;
            }

            const blockHash = block.hash;

            // Check if already indexed (idempotency)
            const existingBlock = await ethRepository.getBlockByHash(blockHash);
            if (existingBlock) {
                logger.debug('Block already indexed, skipping', { blockNumber, blockHash });
                await syncRepository.updateSyncStatus('ETH', blockNumber, blockHash, true);
                return;
            }

            // Process block in a transaction
            await db.transaction(async (client) => {
                // Save block
                await ethRepository.saveBlock(
                    {
                        blockHash: block.hash,
                        blockNumber: block.number,
                        parentHash: block.parentHash,
                        timestamp: block.timestamp,
                        nonce: block.nonce || undefined,
                        difficulty: block.difficulty?.toString(),
                        totalDifficulty: undefined, // Not available in ethers v6 block
                        size: block.length || undefined,
                        gasLimit: Number(block.gasLimit),
                        gasUsed: Number(block.gasUsed),
                        miner: block.miner,
                        extraData: block.extraData,
                        transactionCount: block.transactions.length,
                    },
                    client
                );

                // Process transactions
                for (const txHash of block.transactions) {
                    await this.indexTransaction(txHash as string, block, client);
                }

                // Update sync status
                await syncRepository.updateSyncStatus('ETH', blockNumber, blockHash, true);
            });

            logger.debug('Indexed ETH block', {
                blockNumber,
                blockHash,
                txCount: block.transactions.length,
            });
        } catch (error) {
            const err = error as Error;
            logger.error('Failed to index ETH block', { blockNumber, error: err.message });
            throw error;
        }
    }

    /**
     * Index a transaction
     */
    private async indexTransaction(
        txHash: string,
        block: any,
        client: any
    ): Promise<void> {
        try {
            // Fetch transaction details
            const tx = await ethClient.getTransaction(txHash);
            if (!tx) {
                logger.warn('Transaction not found', { txHash });
                return;
            }

            // Fetch transaction receipt for status and logs
            const receipt = await ethClient.getTransactionReceipt(txHash);
            if (!receipt) {
                logger.warn('Transaction receipt not found', { txHash });
                return;
            }

            // Save transaction
            await ethRepository.saveTransaction(
                {
                    txHash: tx.hash,
                    blockHash: tx.blockHash!,
                    blockNumber: tx.blockNumber!,
                    timestamp: block.timestamp,
                    fromAddress: tx.from.toLowerCase(),
                    toAddress: tx.to ? tx.to.toLowerCase() : null,
                    value: tx.value.toString(),
                    gasPrice: tx.gasPrice?.toString(),
                    maxFeePerGas: tx.maxFeePerGas?.toString(),
                    maxPriorityFeePerGas: tx.maxPriorityFeePerGas?.toString(),
                    gasLimit: Number(tx.gasLimit),
                    gasUsed: Number(receipt.gasUsed),
                    nonce: tx.nonce,
                    transactionIndex: tx.index,
                    inputData: tx.data,
                    status: receipt.status ?? undefined,
                    contractAddress: receipt.contractAddress ? receipt.contractAddress.toLowerCase() : undefined,
                },
                client
            );

            // Update balances for from and to addresses
            await this.updateBalance(tx.from, block.number, client);
            if (tx.to) {
                await this.updateBalance(tx.to, block.number, client);
            }

            // Process ERC-20 token transfers from logs
            if (receipt.logs && receipt.logs.length > 0) {
                const tokenTransfers = extractTokenTransfers(receipt.logs);

                for (const transfer of tokenTransfers) {
                    await ethRepository.saveTokenTransfer(
                        {
                            txHash: tx.hash,
                            blockHash: tx.blockHash!,
                            blockNumber: tx.blockNumber!,
                            timestamp: block.timestamp,
                            logIndex: transfer.logIndex,
                            tokenAddress: transfer.tokenAddress,
                            fromAddress: transfer.from,
                            toAddress: transfer.to,
                            value: transfer.value,
                        },
                        client
                    );
                }
            }
        } catch (error) {
            const err = error as Error;
            logger.error('Failed to index ETH transaction', { txHash, error: err.message });
            throw error;
        }
    }

    /**
     * Update balance for an address at a specific block
     */
    private async updateBalance(
        address: string,
        blockNumber: number,
        client: any
    ): Promise<void> {
        try {
            const balance = await ethClient.getBalance(address, blockNumber);

            await ethRepository.saveBalance(
                {
                    address: address.toLowerCase(),
                    blockNumber,
                    balance: balance.toString(),
                },
                client
            );
        } catch (error) {
            const err = error as Error;
            logger.debug('Failed to update balance', { address, blockNumber, error: err.message });
            // Don't throw - balance updates are not critical
        }
    }
}

export default new ETHIndexer();
