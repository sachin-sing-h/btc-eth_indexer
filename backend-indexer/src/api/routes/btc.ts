import { Router, Request, Response } from 'express';
import btcRepository from '../../db/repositories/btcRepository';
import { NotFoundError, ValidationError } from '../../utils/errors';
import {
    validatePagination,
    validateBTCAddress,
    validateBTCTxHash,
    validateBTCBlockHash,
} from '../middleware/validation';

const router = Router();

/**
 * GET /api/btc/blocks/:blockHash
 * Get Bitcoin block details by hash
 */
router.get('/blocks/:blockHashOrHeight', async (req: Request, res: Response, next) => {
    try {
        const { blockHashOrHeight } = req.params;

        // Check if input is a block height (numeric)
        if (/^\d+$/.test(blockHashOrHeight)) {
            const height = parseInt(blockHashOrHeight, 10);
            const block = await btcRepository.getBlockByHeight(height);

            if (!block) {
                throw new NotFoundError(`Bitcoin block #${height}`);
            }

            res.json({ success: true, data: block });
            return;
        }

        // Check if input is a block hash
        if (!validateBTCBlockHash(blockHashOrHeight)) {
            throw new ValidationError('Invalid Bitcoin block hash or height format');
        }

        const block = await btcRepository.getBlockByHash(blockHashOrHeight);

        if (!block) {
            throw new NotFoundError('Bitcoin block');
        }

        res.json({
            success: true,
            data: block,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/btc/transactions/:txHash
 * Get Bitcoin transaction details by hash
 */
router.get('/transactions/:txHash', async (req: Request, res: Response, next) => {
    try {
        const { txHash } = req.params;

        if (!validateBTCTxHash(txHash)) {
            throw new ValidationError('Invalid Bitcoin transaction hash format');
        }

        const transaction = await btcRepository.getTransactionByHash(txHash);

        if (!transaction) {
            throw new NotFoundError('Bitcoin transaction');
        }

        res.json({
            success: true,
            data: transaction,
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/btc/addresses/:address/transactions
 * Get Bitcoin address transaction history with pagination
 */
router.get(
    '/addresses/:address/transactions',
    validatePagination,
    async (req: Request, res: Response, next) => {
        try {
            const { address } = req.params;
            const limit = parseInt(req.query.limit as string);
            const offset = parseInt(req.query.offset as string);

            if (!validateBTCAddress(address)) {
                throw new ValidationError('Invalid Bitcoin address format');
            }

            const result = await btcRepository.getAddressTransactions(address, limit, offset);

            res.json({
                success: true,
                data: {
                    address,
                    transactions: result.transactions,
                    pagination: {
                        limit,
                        offset,
                        total: result.total,
                        hasMore: offset + limit < result.total,
                    },
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
