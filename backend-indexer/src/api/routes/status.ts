import { Router, Request, Response } from 'express';
import syncRepository from '../../db/repositories/syncRepository';

const router = Router();

/**
 * GET /api/status
 * Get indexer sync status for both chains
 */
router.get('/', async (_req: Request, res: Response) => {
    const btcStatus = await syncRepository.getSyncStatus('BTC');
    const ethStatus = await syncRepository.getSyncStatus('ETH');

    res.json({
        success: true,
        data: {
            btc: btcStatus ? {
                lastIndexedBlock: btcStatus.lastIndexedBlock,
                lastIndexedHash: btcStatus.lastIndexedHash,
                isSyncing: btcStatus.isSyncing,
                lastSyncAt: btcStatus.lastSyncAt,
            } : null,
            eth: ethStatus ? {
                lastIndexedBlock: ethStatus.lastIndexedBlock,
                lastIndexedHash: ethStatus.lastIndexedHash,
                isSyncing: ethStatus.isSyncing,
                lastSyncAt: ethStatus.lastSyncAt,
            } : null,
        },
    });
});

export default router;
