import db from '../connection';
import logger from '../../config/logger';
import { DatabaseError } from '../../utils/errors';

export interface SyncStatus {
    chain: string;
    lastIndexedBlock: number;
    lastIndexedHash: string | null;
    isSyncing: boolean;
    lastSyncAt: Date | null;
}

export class SyncRepository {
    /**
     * Get sync status for a chain
     */
    async getSyncStatus(chain: 'BTC' | 'ETH'): Promise<SyncStatus | null> {
        try {
            const result = await db.query(
                'SELECT chain, last_indexed_block, last_indexed_hash, is_syncing, last_sync_at FROM sync_status WHERE chain = $1',
                [chain]
            );

            if (result.rows.length === 0) {
                return null;
            }

            const row = result.rows[0];
            return {
                chain: row.chain,
                lastIndexedBlock: parseInt(row.last_indexed_block, 10),
                lastIndexedHash: row.last_indexed_hash,
                isSyncing: row.is_syncing,
                lastSyncAt: row.last_sync_at,
            };
        } catch (error) {
            const err = error as Error;
            logger.error('Failed to get sync status', { chain, error: err.message });
            throw new DatabaseError(`Failed to get sync status: ${err.message}`);
        }
    }

    /**
     * Update sync status
     */
    async updateSyncStatus(
        chain: 'BTC' | 'ETH',
        blockNumber: number,
        blockHash: string,
        isSyncing: boolean = true
    ): Promise<void> {
        try {
            await db.query(
                `UPDATE sync_status 
         SET last_indexed_block = $1, 
             last_indexed_hash = $2, 
             is_syncing = $3,
             last_sync_at = CURRENT_TIMESTAMP
         WHERE chain = $4`,
                [blockNumber, blockHash, isSyncing, chain]
            );
        } catch (error) {
            const err = error as Error;
            logger.error('Failed to update sync status', { chain, error: err.message });
            throw new DatabaseError(`Failed to update sync status: ${err.message}`);
        }
    }

    /**
     * Set syncing flag
     */
    async setSyncing(chain: 'BTC' | 'ETH', isSyncing: boolean): Promise<void> {
        try {
            await db.query(
                'UPDATE sync_status SET is_syncing = $1 WHERE chain = $2',
                [isSyncing, chain]
            );
        } catch (error) {
            const err = error as Error;
            logger.error('Failed to set syncing flag', { chain, error: err.message });
            throw new DatabaseError(`Failed to set syncing flag: ${err.message}`);
        }
    }
}

export default new SyncRepository();
