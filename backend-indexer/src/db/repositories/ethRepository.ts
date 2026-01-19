import db from '../connection';
import logger from '../../config/logger';
import { DatabaseError } from '../../utils/errors';
import { PoolClient } from 'pg';

export interface ETHBlock {
    blockHash: string;
    blockNumber: number;
    parentHash: string | null;
    timestamp: number;
    nonce?: string;
    difficulty?: string;
    totalDifficulty?: string;
    size?: number;
    gasLimit?: number;
    gasUsed?: number;
    miner?: string;
    extraData?: string;
    transactionCount: number;
}

export interface ETHTransaction {
    txHash: string;
    blockHash: string;
    blockNumber: number;
    timestamp: number;
    fromAddress: string;
    toAddress: string | null;
    value: string;
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    gasLimit?: number;
    gasUsed?: number;
    nonce?: number;
    transactionIndex?: number;
    inputData?: string;
    status?: number;
    contractAddress?: string;
}

export interface ETHBalance {
    address: string;
    blockNumber: number;
    balance: string;
}

export interface ETHTokenTransfer {
    txHash: string;
    blockHash: string;
    blockNumber: number;
    timestamp: number;
    logIndex: number;
    tokenAddress: string;
    fromAddress: string;
    toAddress: string;
    value: string;
}

export class ETHRepository {
    /**
     * Save a block
     */
    async saveBlock(block: ETHBlock, client?: PoolClient): Promise<void> {
        const executor: any = client || db;
        try {
            await executor.query(
                `INSERT INTO eth_blocks 
         (block_hash, block_number, parent_hash, timestamp, nonce, difficulty, total_difficulty, 
          size, gas_limit, gas_used, miner, extra_data, transaction_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (block_hash) DO NOTHING`,
                [
                    block.blockHash,
                    block.blockNumber,
                    block.parentHash,
                    block.timestamp,
                    block.nonce,
                    block.difficulty,
                    block.totalDifficulty,
                    block.size,
                    block.gasLimit,
                    block.gasUsed,
                    block.miner,
                    block.extraData,
                    block.transactionCount,
                ]
            );
        } catch (error) {
            const err = error as Error;
            logger.error('Failed to save ETH block', { blockHash: block.blockHash, error: err.message });
            throw new DatabaseError(`Failed to save ETH block: ${err.message}`);
        }
    }

    /**
     * Save a transaction
     */
    async saveTransaction(tx: ETHTransaction, client?: PoolClient): Promise<void> {
        const executor: any = client || db;
        try {
            await executor.query(
                `INSERT INTO eth_transactions 
         (tx_hash, block_hash, block_number, timestamp, from_address, to_address, value, 
          gas_price, max_fee_per_gas, max_priority_fee_per_gas, gas_limit, gas_used, 
          nonce, transaction_index, input_data, status, contract_address)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
         ON CONFLICT (tx_hash) DO NOTHING`,
                [
                    tx.txHash,
                    tx.blockHash,
                    tx.blockNumber,
                    tx.timestamp,
                    tx.fromAddress,
                    tx.toAddress,
                    tx.value,
                    tx.gasPrice,
                    tx.maxFeePerGas,
                    tx.maxPriorityFeePerGas,
                    tx.gasLimit,
                    tx.gasUsed,
                    tx.nonce,
                    tx.transactionIndex,
                    tx.inputData,
                    tx.status,
                    tx.contractAddress,
                ]
            );
        } catch (error) {
            const err = error as Error;
            logger.error('Failed to save ETH transaction', { txHash: tx.txHash, error: err.message });
            throw new DatabaseError(`Failed to save ETH transaction: ${err.message}`);
        }
    }

    /**
     * Save or update balance
     */
    async saveBalance(balance: ETHBalance, client?: PoolClient): Promise<void> {
        const executor: any = client || db;
        try {
            await executor.query(
                `INSERT INTO eth_balances (address, block_number, balance)
         VALUES ($1, $2, $3)
         ON CONFLICT (address, block_number) 
         DO UPDATE SET balance = EXCLUDED.balance`,
                [balance.address, balance.blockNumber, balance.balance]
            );
        } catch (error) {
            const err = error as Error;
            logger.error('Failed to save ETH balance', { address: balance.address, error: err.message });
            throw new DatabaseError(`Failed to save ETH balance: ${err.message}`);
        }
    }

    /**
     * Save token transfer
     */
    async saveTokenTransfer(transfer: ETHTokenTransfer, client?: PoolClient): Promise<void> {
        const executor: any = client || db;
        try {
            await executor.query(
                `INSERT INTO eth_token_transfers 
         (tx_hash, block_hash, block_number, timestamp, log_index, token_address, from_address, to_address, value)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (tx_hash, log_index) DO NOTHING`,
                [
                    transfer.txHash,
                    transfer.blockHash,
                    transfer.blockNumber,
                    transfer.timestamp,
                    transfer.logIndex,
                    transfer.tokenAddress,
                    transfer.fromAddress,
                    transfer.toAddress,
                    transfer.value,
                ]
            );
        } catch (error) {
            const err = error as Error;
            logger.error('Failed to save token transfer', { txHash: transfer.txHash, error: err.message });
            throw new DatabaseError(`Failed to save token transfer: ${err.message}`);
        }
    }

    /**
     * Get block by hash
     */
    async getBlockByHash(blockHash: string): Promise<ETHBlock | null> {
        try {
            const result = await db.query(
                'SELECT * FROM eth_blocks WHERE block_hash = $1',
                [blockHash]
            );

            if (result.rows.length === 0) {
                return null;
            }

            return this.mapRowToBlock(result.rows[0]);
        } catch (error) {
            const err = error as Error;
            logger.error('Failed to get ETH block', { blockHash, error: err.message });
            throw new DatabaseError(`Failed to get ETH block: ${err.message}`);
        }
    }

    /**
     * Get block by number
     */
    async getBlockByNumber(blockNumber: number): Promise<ETHBlock | null> {
        try {
            const result = await db.query(
                'SELECT * FROM eth_blocks WHERE block_number = $1',
                [blockNumber]
            );

            if (result.rows.length === 0) {
                return null;
            }

            return this.mapRowToBlock(result.rows[0]);
        } catch (error) {
            const err = error as Error;
            logger.error('Failed to get ETH block by number', { blockNumber, error: err.message });
            throw new DatabaseError(`Failed to get ETH block: ${err.message}`);
        }
    }

    /**
     * Get transaction by hash
     */
    async getTransactionByHash(txHash: string): Promise<ETHTransaction | null> {
        try {
            const result = await db.query(
                'SELECT * FROM eth_transactions WHERE tx_hash = $1',
                [txHash]
            );

            if (result.rows.length === 0) {
                return null;
            }

            return this.mapRowToTransaction(result.rows[0]);
        } catch (error) {
            const err = error as Error;
            logger.error('Failed to get ETH transaction', { txHash, error: err.message });
            throw new DatabaseError(`Failed to get ETH transaction: ${err.message}`);
        }
    }

    /**
     * Get transactions for an address
     */
    async getAddressTransactions(
        address: string,
        limit: number = 50,
        offset: number = 0
    ): Promise<{ transactions: ETHTransaction[]; total: number }> {
        try {
            // Get total count
            const countResult = await db.query(
                'SELECT COUNT(*) FROM eth_transactions WHERE from_address = $1 OR to_address = $1',
                [address]
            );
            const total = parseInt(countResult.rows[0].count, 10);

            // Get transactions
            const result = await db.query(
                `SELECT * FROM eth_transactions 
         WHERE from_address = $1 OR to_address = $1
         ORDER BY block_number DESC, transaction_index DESC
         LIMIT $2 OFFSET $3`,
                [address, limit, offset]
            );

            const transactions = result.rows.map(row => this.mapRowToTransaction(row));
            return { transactions, total };
        } catch (error) {
            const err = error as Error;
            logger.error('Failed to get address transactions', { address, error: err.message });
            throw new DatabaseError(`Failed to get address transactions: ${err.message}`);
        }
    }

    /**
     * Get latest balance for an address
     */
    async getLatestBalance(address: string): Promise<string | null> {
        try {
            const result = await db.query(
                `SELECT balance FROM eth_balances 
         WHERE address = $1 
         ORDER BY block_number DESC 
         LIMIT 1`,
                [address]
            );

            if (result.rows.length === 0) {
                return null;
            }

            return result.rows[0].balance;
        } catch (error) {
            const err = error as Error;
            logger.error('Failed to get latest balance', { address, error: err.message });
            throw new DatabaseError(`Failed to get latest balance: ${err.message}`);
        }
    }

    /**
     * Get token transfers
     */
    async getTokenTransfers(
        tokenAddress: string,
        limit: number = 50,
        offset: number = 0
    ): Promise<{ transfers: ETHTokenTransfer[]; total: number }> {
        try {
            // Get total count
            const countResult = await db.query(
                'SELECT COUNT(*) FROM eth_token_transfers WHERE token_address = $1',
                [tokenAddress]
            );
            const total = parseInt(countResult.rows[0].count, 10);

            // Get transfers
            const result = await db.query(
                `SELECT * FROM eth_token_transfers 
         WHERE token_address = $1
         ORDER BY block_number DESC, log_index DESC
         LIMIT $2 OFFSET $3`,
                [tokenAddress, limit, offset]
            );

            const transfers = result.rows.map(row => this.mapRowToTokenTransfer(row));
            return { transfers, total };
        } catch (error) {
            const err = error as Error;
            logger.error('Failed to get token transfers', { tokenAddress, error: err.message });
            throw new DatabaseError(`Failed to get token transfers: ${err.message}`);
        }
    }

    private mapRowToBlock(row: any): ETHBlock {
        return {
            blockHash: row.block_hash,
            blockNumber: parseInt(row.block_number, 10),
            parentHash: row.parent_hash,
            timestamp: parseInt(row.timestamp, 10),
            nonce: row.nonce,
            difficulty: row.difficulty,
            totalDifficulty: row.total_difficulty,
            size: row.size,
            gasLimit: row.gas_limit ? parseInt(row.gas_limit, 10) : undefined,
            gasUsed: row.gas_used ? parseInt(row.gas_used, 10) : undefined,
            miner: row.miner,
            extraData: row.extra_data,
            transactionCount: row.transaction_count,
        };
    }

    private mapRowToTransaction(row: any): ETHTransaction {
        return {
            txHash: row.tx_hash,
            blockHash: row.block_hash,
            blockNumber: parseInt(row.block_number, 10),
            timestamp: parseInt(row.timestamp, 10),
            fromAddress: row.from_address,
            toAddress: row.to_address,
            value: row.value,
            gasPrice: row.gas_price,
            maxFeePerGas: row.max_fee_per_gas,
            maxPriorityFeePerGas: row.max_priority_fee_per_gas,
            gasLimit: row.gas_limit ? parseInt(row.gas_limit, 10) : undefined,
            gasUsed: row.gas_used ? parseInt(row.gas_used, 10) : undefined,
            nonce: row.nonce,
            transactionIndex: row.transaction_index,
            inputData: row.input_data,
            status: row.status,
            contractAddress: row.contract_address,
        };
    }

    private mapRowToTokenTransfer(row: any): ETHTokenTransfer {
        return {
            txHash: row.tx_hash,
            blockHash: row.block_hash,
            blockNumber: parseInt(row.block_number, 10),
            timestamp: parseInt(row.timestamp, 10),
            logIndex: row.log_index,
            tokenAddress: row.token_address,
            fromAddress: row.from_address,
            toAddress: row.to_address,
            value: row.value,
        };
    }
}

export default new ETHRepository();
