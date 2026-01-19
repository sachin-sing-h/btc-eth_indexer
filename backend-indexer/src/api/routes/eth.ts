import { Router, Request, Response } from 'express';
import ethRepository from '../../db/repositories/ethRepository';
import { NotFoundError, ValidationError } from '../../utils/errors';
import {
    validatePagination,
    validateETHAddress,
    validateETHTxHash,
    validateETHBlockHash,
} from '../middleware/validation';

const router = Router();

/**
 * GET /api/eth/blocks/:blockHash
 * Get Ethereum block details by hash
 */
router.get('/blocks/:blockHashOrHeight', async (req: Request, res: Response, next) => {
    try {
        const { blockHashOrHeight } = req.params;

        // Check if input is a block height (numeric)
        if (/^\d+$/.test(blockHashOrHeight)) {
            const height = parseInt(blockHashOrHeight, 10);
            const block = await ethRepository.getBlockByNumber(height);

            if (!block) {
                throw new NotFoundError(`Ethereum block #${height}`);
            }

            res.json({ success: true, data: block });
            return;
        }

        if (!validateETHBlockHash(blockHashOrHeight)) {
            throw new ValidationError('Invalid Ethereum block hash or height format');
        }

        const block = await ethRepository.getBlockByHash(blockHashOrHeight);

        if (!block) {
            throw new NotFoundError('Ethereum block');
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
 * GET /api/eth/transactions/:txHash
 * Get Ethereum transaction details by hash
 */
router.get('/transactions/:txHash', async (req: Request, res: Response, next) => {
    try {
        const { txHash } = req.params;

        if (!validateETHTxHash(txHash)) {
            throw new ValidationError('Invalid Ethereum transaction hash format');
        }

        const transaction = await ethRepository.getTransactionByHash(txHash);

        if (!transaction) {
            throw new NotFoundError('Ethereum transaction');
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
 * GET /api/eth/addresses/:address/transactions
 * Get Ethereum address transaction history with pagination
 */
router.get(
    '/addresses/:address/transactions',
    validatePagination,
    async (req: Request, res: Response, next) => {
        try {
            const { address } = req.params;
            const limit = parseInt(req.query.limit as string);
            const offset = parseInt(req.query.offset as string);

            if (!validateETHAddress(address)) {
                throw new ValidationError('Invalid Ethereum address format');
            }

            const result = await ethRepository.getAddressTransactions(
                address.toLowerCase(),
                limit,
                offset
            );

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

/**
 * GET /api/eth/addresses/:address/balance
 * Get Ethereum address balance (latest)
 */
router.get('/addresses/:address/balance', async (req: Request, res: Response, next) => {
    try {
        const { address } = req.params;

        if (!validateETHAddress(address)) {
            throw new ValidationError('Invalid Ethereum address format');
        }

        const balance = await ethRepository.getLatestBalance(address.toLowerCase());

        res.json({
            success: true,
            data: {
                address,
                balance: balance || '0',
            },
        });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/eth/tokens/:tokenAddress/transfers
 * Get ERC-20 token transfer history with pagination
 */
router.get(
    '/tokens/:tokenAddress/transfers',
    validatePagination,
    async (req: Request, res: Response, next) => {
        try {
            const { tokenAddress } = req.params;
            const limit = parseInt(req.query.limit as string);
            const offset = parseInt(req.query.offset as string);

            if (!validateETHAddress(tokenAddress)) {
                throw new ValidationError('Invalid token address format');
            }

            const result = await ethRepository.getTokenTransfers(
                tokenAddress.toLowerCase(),
                limit,
                offset
            );

            res.json({
                success: true,
                data: {
                    tokenAddress,
                    transfers: result.transfers,
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
