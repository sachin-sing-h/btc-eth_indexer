import db from '../connection';
import logger from '../../config/logger';
import { DatabaseError } from '../../utils/errors';
import { PoolClient } from 'pg';

export interface BTCBlock {
    blockHash: string;
    blockHeight: number;
    previousBlockHash: string | null;
    timestamp: number;
    difficulty?: number;
    nonce?: number;
    merkleRoot?: string;
    transactionCount: number;
}

export interface BTCTransaction {
    txHash: string;
    blockHash: string;
    blockHeight: number;
    timestamp: number;
    size?: number;
    virtualSize?: number;
    weight?: number;
    version?: number;
    locktime?: number;
    inputs: any[];
    outputs: any[];
    totalInputValue?: number;
    totalOutputValue?: number;
    fee?: number;
}

export interface BTCAddressTransaction {
    address: string;
    txHash: string;
    blockHeight: number;
    isInput: boolean;
    amount: number;
}

export class BTCRepository {
    /**
     * Save a block
     */
    async saveBlock(block: BTCBlock, client?: PoolClient): Promise<void> {
        const executor: any = client || db;
        try {
            await executor.query(
                `INSERT INTO btc_blocks 
         (block_hash, block_height, previous_block_hash, timestamp, difficulty, nonce, merkle_root, transaction_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (block_hash) DO NOTHING`,
                [
                    block.blockHash,
                    block.blockHeight,
                    block.previousBlockHash,
                    block.timestamp,
                    block.difficulty,
                    block.nonce,
                    block.merkleRoot,
                    block.transactionCount,
                ]
            );
        } catch (error) {
            const err = error as Error;
            logger.error('Failed to save BTC block', { blockHash: block.blockHash, error: err.message });
            throw new DatabaseError(`Failed to save BTC block: ${err.message}`);
        }
    }

    /**
     * Save a transaction
     */
    async saveTransaction(tx: BTCTransaction, client?: PoolClient): Promise<void> {
        const executor: any = client || db;
        try {
            await executor.query(
                `INSERT INTO btc_transactions 
         (tx_hash, block_hash, block_height, timestamp, size, virtual_size, weight, version, locktime, 
          inputs, outputs, total_input_value, total_output_value, fee)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (tx_hash) DO NOTHING`,
                [
                    tx.txHash,
                    tx.blockHash,
                    tx.blockHeight,
                    tx.timestamp,
                    tx.size,
                    tx.virtualSize,
                    tx.weight,
                    tx.version,
                    tx.locktime,
                    JSON.stringify(tx.inputs),
                    JSON.stringify(tx.outputs),
                    tx.totalInputValue,
                    tx.totalOutputValue,
                    tx.fee,
                ]
            );
        } catch (error) {
            const err = error as Error;
            logger.error('Failed to save BTC transaction', { txHash: tx.txHash, error: err.message });
            throw new DatabaseError(`Failed to save BTC transaction: ${err.message}`);
        }
    }

    /**
     * Save address transaction mapping
     */
    async saveAddressTransaction(addrTx: BTCAddressTransaction, client?: PoolClient): Promise<void> {
        const executor: any = client || db;
        try {
            await executor.query(
                `INSERT INTO btc_address_transactions (address, tx_hash, block_height, is_input, amount)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT DO NOTHING`,
                [addrTx.address, addrTx.txHash, addrTx.blockHeight, addrTx.isInput, addrTx.amount]
            );
        } catch (error) {
            const err = error as Error;
            logger.error('Failed to save BTC address transaction', { error: err.message });
            throw new DatabaseError(`Failed to save BTC address transaction: ${err.message}`);
        }
    }

    /**
     * Get block by hash
     */
    async getBlockByHash(blockHash: string): Promise<BTCBlock | null> {
        try {
            const result = await db.query(
                'SELECT * FROM btc_blocks WHERE block_hash = $1',
                [blockHash]
            );

            if (result.rows.length === 0) {
                return null;
            }

            const row = result.rows[0];
            return this.mapRowToBlock(row);
        } catch (error) {
            const err = error as Error;
            logger.error('Failed to get BTC block', { blockHash, error: err.message });
            throw new DatabaseError(`Failed to get BTC block: ${err.message}`);
        }
    }

    /**
     * Get block by height
     */
    async getBlockByHeight(blockHeight: number): Promise<BTCBlock | null> {
        try {
            const result = await db.query(
                'SELECT * FROM btc_blocks WHERE block_height = $1',
                [blockHeight]
            );

            if (result.rows.length === 0) {
                return null;
            }

            return this.mapRowToBlock(result.rows[0]);
        } catch (error) {
            const err = error as Error;
            logger.error('Failed to get BTC block by height', { blockHeight, error: err.message });
            throw new DatabaseError(`Failed to get BTC block: ${err.message}`);
        }
    }

    /**
     * Get transaction by hash
     */
    async getTransactionByHash(txHash: string): Promise<BTCTransaction | null> {
        try {
            const result = await db.query(
                'SELECT * FROM btc_transactions WHERE tx_hash = $1',
                [txHash]
            );

            if (result.rows.length === 0) {
                return null;
            }

            return this.mapRowToTransaction(result.rows[0]);
        } catch (error) {
            const err = error as Error;
            logger.error('Failed to get BTC transaction', { txHash, error: err.message });
            throw new DatabaseError(`Failed to get BTC transaction: ${err.message}`);
        }
    }

    /**
     * Get transactions for an address
     */
    async getAddressTransactions(
        address: string,
        limit: number = 50,
        offset: number = 0
    ): Promise<{ transactions: BTCTransaction[]; total: number }> {
        try {
            // Get total count
            const countResult = await db.query(
                'SELECT COUNT(*) FROM btc_address_transactions WHERE address = $1',
                [address]
            );
            const total = parseInt(countResult.rows[0].count, 10);

            // Get transactions
            const result = await db.query(
                `SELECT DISTINCT t.* FROM btc_transactions t
         INNER JOIN btc_address_transactions at ON t.tx_hash = at.tx_hash
         WHERE at.address = $1
         ORDER BY t.block_height DESC, t.id DESC
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

    private mapRowToBlock(row: any): BTCBlock {
        return {
            blockHash: row.block_hash,
            blockHeight: parseInt(row.block_height, 10),
            previousBlockHash: row.previous_block_hash,
            timestamp: parseInt(row.timestamp, 10),
            difficulty: row.difficulty ? parseFloat(row.difficulty) : undefined,
            nonce: row.nonce ? parseInt(row.nonce, 10) : undefined,
            merkleRoot: row.merkle_root,
            transactionCount: row.transaction_count,
        };
    }

    private mapRowToTransaction(row: any): BTCTransaction {
        return {
            txHash: row.tx_hash,
            blockHash: row.block_hash,
            blockHeight: parseInt(row.block_height, 10),
            timestamp: parseInt(row.timestamp, 10),
            size: row.size,
            virtualSize: row.virtual_size,
            weight: row.weight,
            version: row.version,
            locktime: row.locktime ? parseInt(row.locktime, 10) : undefined,
            inputs: row.inputs,
            outputs: row.outputs,
            totalInputValue: row.total_input_value ? parseInt(row.total_input_value, 10) : undefined,
            totalOutputValue: row.total_output_value ? parseInt(row.total_output_value, 10) : undefined,
            fee: row.fee ? parseInt(row.fee, 10) : undefined,
        };
    }
}

export default new BTCRepository();
